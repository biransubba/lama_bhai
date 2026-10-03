const mongoose = require('mongoose');
const { User, Property, Room } = require('../models');

async function testAdminModeration() {
  console.log('--- Starting Phase 8: Admin Approval/Rejection Moderation Test Suite ---');
  const { server } = require('../server');

  // Wait 1.5s for DB connection
  await new Promise((r) => setTimeout(r, 1500));

  const authUrl = 'http://localhost:5000/api/auth';
  const adminUrl = 'http://localhost:5000/api/admin';
  const publicPropUrl = 'http://localhost:5000/api/properties';
  const unique = Date.now().toString().slice(-5);

  try {
    // 1. Create Admin Account
    const adminUser = await User.create({
      name: 'System Administrator',
      email: `admin_${unique}@lama.test`,
      password: 'adminPassword123',
      role: 'admin',
    });

    // Login as Admin
    const loginAdminRes = await fetch(`${authUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: adminUser.email,
        password: 'adminPassword123',
      }),
    });
    const adminCookie = loginAdminRes.headers.get('set-cookie')?.split(';')[0];
    console.log('Admin Authenticated:', adminUser.email);

    // 2. Create Owner & Pending Property for testing moderation
    const partnerOwner = await User.create({
      name: 'Sonam Wangchuk',
      email: `sonam_${unique}@lama.test`,
      password: 'password123',
      role: 'owner',
      partnerProfile: {
        agencyName: 'Dzongu Organic Homestay Network',
        location: 'Dzongu, North Sikkim',
        verificationStatus: 'Pending',
      },
    });

    const pendingProp = await Property.create({
      name: 'Dzongu Cardamom Haven Homestay',
      slug: `dzongu-cardamom-haven-${unique}`,
      type: 'Homestay',
      owner: partnerOwner._id,
      description: 'Indigenous Lepcha homestay surrounded by cardamom plantations.',
      location: {
        district: 'North Sikkim',
        town: 'Dzongu',
        address: 'Passingdang Village',
      },
      price: 2600,
      image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb',
      status: 'pending',
      active: true,
    });

    // 3. Register Tourist for authorization test
    const touristRes = await fetch(`${authUrl}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Curious Tourist',
        email: `tourist_${unique}@lama.test`,
        password: 'password123',
        role: 'tourist',
      }),
    });
    const touristCookie = touristRes.headers.get('set-cookie')?.split(';')[0];

    // TEST 1: Tourist attempts to access admin console (Expect 403)
    console.log('\n[1] Testing Non-Admin (Tourist) accessing /api/admin/properties (Expect 403)...');
    const forbidRes = await fetch(`${adminUrl}/properties`, {
      headers: { Cookie: touristCookie },
    });
    console.log('Status:', forbidRes.status);
    if (forbidRes.status !== 403) {
      throw new Error(`Security breach: Non-admin got status ${forbidRes.status} on admin route`);
    }
    console.log('✓ Admin route protection verified: Tourist rejected with 403.');

    // TEST 2: Admin lists all properties with moderation filter
    console.log('\n[2] Testing Admin GET /api/admin/properties?status=pending...');
    const pendingListRes = await fetch(`${adminUrl}/properties?status=pending`, {
      headers: { Cookie: adminCookie },
    });
    const pendingListJson = await pendingListRes.json();
    console.log('Status:', pendingListRes.status);
    console.log('Pending Properties Found:', pendingListJson.count);
    const foundOurPending = pendingListJson.data.some((p) => p._id === pendingProp._id.toString());
    if (!foundOurPending) throw new Error('Pending property not found in admin moderation queue');
    console.log('✓ Admin moderation queue verified.');

    // TEST 3: Admin approves the pending property
    console.log(`\n[3] Testing Admin PATCH /api/admin/properties/${pendingProp._id}/status -> approved...`);
    const approveRes = await fetch(`${adminUrl}/properties/${pendingProp._id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({ status: 'approved', featured: true }),
    });
    const approveJson = await approveRes.json();
    console.log('Status:', approveRes.status);
    console.log('Updated Status:', approveJson.data?.status);
    console.log('Featured Flag:', approveJson.data?.featured);
    if (approveJson.data?.status !== 'approved' || approveJson.data?.featured !== true) {
      throw new Error('Property approval status update failed');
    }
    console.log('✓ Property approval verified.');

    // TEST 4: Verify property is now live and visible on public endpoint
    console.log(`\n[4] Verifying newly approved property on public endpoint /api/properties/${pendingProp.slug}...`);
    const publicCheckRes = await fetch(`${publicPropUrl}/${pendingProp.slug}`);
    console.log('Public Status:', publicCheckRes.status);
    if (publicCheckRes.status !== 200) {
      throw new Error(`Public failed to see newly approved property: status ${publicCheckRes.status}`);
    }
    console.log('✓ Public visibility verified after approval.');

    // TEST 5: Admin rejects a property
    console.log(`\n[5] Testing Admin PATCH /api/admin/properties/${pendingProp._id}/status -> rejected...`);
    const rejectRes = await fetch(`${adminUrl}/properties/${pendingProp._id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({ status: 'rejected' }),
    });
    const rejectJson = await rejectRes.json();
    console.log('Status:', rejectRes.status);
    console.log('Updated Status:', rejectJson.data?.status);
    if (rejectJson.data?.status !== 'rejected') throw new Error('Property rejection failed');

    // Public guest should now get 404 for rejected property
    const publicRejectCheck = await fetch(`${publicPropUrl}/${pendingProp.slug}`);
    console.log('Public Status for Rejected Property:', publicRejectCheck.status);
    if (publicRejectCheck.status !== 404) {
      throw new Error('Security flaw: Rejected property is still visible publicly');
    }
    console.log('✓ Property rejection & public seclusion verified.');

    // TEST 6: Admin lists partners
    console.log('\n[6] Testing Admin GET /api/admin/partners...');
    const partnersRes = await fetch(`${adminUrl}/partners`, {
      headers: { Cookie: adminCookie },
    });
    const partnersJson = await partnersRes.json();
    console.log('Status:', partnersRes.status);
    console.log('Total Partners Listed:', partnersJson.count);
    const partnerFound = partnersJson.data.some((p) => p._id === partnerOwner._id.toString());
    if (!partnerFound) throw new Error('Partner owner not returned in admin partners list');
    console.log('✓ Admin partner roster verified.');

    // TEST 7: Admin verifies partner account
    console.log(`\n[7] Testing Admin PATCH /api/admin/partners/${partnerOwner._id}/status -> Approved...`);
    const partnerStatusRes = await fetch(`${adminUrl}/partners/${partnerOwner._id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({ status: 'Approved', reviewerNotes: 'Verified local homestay host' }),
    });
    const partnerStatusJson = await partnerStatusRes.json();
    console.log('Status:', partnerStatusRes.status);
    console.log('Partner Verification Status:', partnerStatusJson.data?.partnerProfile?.verificationStatus);
    if (partnerStatusJson.data?.partnerProfile?.verificationStatus !== 'Approved') {
      throw new Error('Partner status update failed');
    }
    console.log('✓ Partner verification approved.');

    // TEST 8: Admin Platform Statistics
    console.log('\n[8] Testing Admin GET /api/admin/stats...');
    const statsRes = await fetch(`${adminUrl}/stats`, {
      headers: { Cookie: adminCookie },
    });
    const statsJson = await statsRes.json();
    console.log('Status:', statsRes.status);
    console.log('Platform Stats:', JSON.stringify(statsJson.data, null, 2));
    if (!statsJson.data?.properties || !statsJson.data?.partners) {
      throw new Error('Admin statistics schema mismatch');
    }
    console.log('✓ Admin platform analytics verified.');

    console.log('\n======================================================');
    console.log(' ALL ADMIN MODERATION TESTS PASSED SUCCESSFULLY (8/8)!');
    console.log('======================================================');
  } catch (err) {
    console.error('\nTest Failed:', err.message);
    process.exitCode = 1;
  } finally {
    server.close();
    await mongoose.connection.close();
    process.exit(process.exitCode || 0);
  }
}

testAdminModeration();

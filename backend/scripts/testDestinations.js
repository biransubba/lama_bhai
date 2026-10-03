const mongoose = require('mongoose');
const { Destination, User, Property } = require('../models');

async function runDestinationTests() {
  console.log('--- Starting Phase 12: Destination & Content APIs Test Suite ---');
  const { server } = require('../server');

  // Wait 1.5s for DB connection to establish
  await new Promise((r) => setTimeout(r, 1500));

  const authUrl = 'http://localhost:5000/api/auth';
  const destUrl = 'http://localhost:5000/api/destinations';
  const unique = Date.now().toString().slice(-5);

  let adminUser = null;
  let touristUser = null;
  let createdDestinationId = null;

  try {
    // 1. Create Admin & Tourist users
    console.log('\n[1] Setting up Admin and Tourist test accounts...');
    adminUser = await User.create({
      name: 'Guide Admin',
      email: `admin_dest_${unique}@lama.test`,
      password: 'password123',
      role: 'admin',
    });

    const adminLoginRes = await fetch(`${authUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminUser.email, password: 'password123' }),
    });
    const adminCookie = adminLoginRes.headers.get('set-cookie')?.split(';')[0];
    if (!adminCookie) throw new Error('Admin login failed');

    touristUser = await User.create({
      name: 'Hiker Tourist',
      email: `tourist_dest_${unique}@lama.test`,
      password: 'password123',
      role: 'tourist',
    });

    const touristLoginRes = await fetch(`${authUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: touristUser.email, password: 'password123' }),
    });
    const touristCookie = touristLoginRes.headers.get('set-cookie')?.split(';')[0];
    if (!touristCookie) throw new Error('Tourist login failed');

    console.log('✓ Accounts created and authenticated successfully.');

    // 2. Public GET /api/destinations
    console.log('\n[2] Testing GET /api/destinations (Public List)...');
    const listRes = await fetch(destUrl);
    const listData = await listRes.json();
    console.log(`Status: ${listRes.status}, Count: ${listData.count}, Total: ${listData.total}`);
    if (listRes.status !== 200 || !listData.success || listData.count < 9) {
      throw new Error(`Failed to list destinations. Count: ${listData.count}`);
    }
    console.log('✓ Public destinations list retrieved.');

    // 3. District filter
    console.log('\n[3] Testing GET /api/destinations?district=North Sikkim...');
    const districtRes = await fetch(`${destUrl}?district=North%20Sikkim`);
    const districtData = await districtRes.json();
    console.log(`Status: ${districtRes.status}, Matched: ${districtData.count}`);
    if (districtRes.status !== 200 || !districtData.data.every((d) => d.district === 'North Sikkim')) {
      throw new Error('District filter failed');
    }
    console.log('✓ District filter working correctly.');

    // 4. Search query
    console.log('\n[4] Testing GET /api/destinations?search=Gurudongmar...');
    const searchRes = await fetch(`${destUrl}?search=Gurudongmar`);
    const searchData = await searchRes.json();
    console.log(`Status: ${searchRes.status}, Matched: ${searchData.count}`);
    if (searchRes.status !== 200 || !searchData.data.some((d) => d.slug === 'gurudongmar-lake')) {
      throw new Error('Search failed to find Gurudongmar Lake');
    }
    console.log('✓ Text search returned Gurudongmar Lake.');

    // 5. Single Destination Detail with Related Slugs & Nearby Stays
    console.log('\n[5] Testing GET /api/destinations/lachen (Single Destination & Related)...');
    const singleRes = await fetch(`${destUrl}/lachen`);
    const singleData = await singleRes.json();
    console.log(`Status: ${singleRes.status}, Name: ${singleData.data.name}`);
    if (singleRes.status !== 200 || singleData.data.slug !== 'lachen') {
      throw new Error('Failed to retrieve Lachen destination detail');
    }
    if (!Array.isArray(singleData.data.relatedDestinations)) {
      throw new Error('Expected relatedDestinations array');
    }
    console.log(
      `✓ Lachen retrieved with ${singleData.data.relatedDestinations.length} related destinations (${singleData.data.relatedDestinations.map(r => r.name).join(', ')}) and ${singleData.data.nearbyStays.length} nearby stays.`
    );

    // 6. Security Check: Tourist cannot POST /api/destinations
    console.log('\n[6] Testing authorization: Tourist attempting to POST /api/destinations (Expect 403)...');
    const unauthCreateRes = await fetch(destUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: touristCookie,
      },
      body: JSON.stringify({
        name: 'Unauthorized Spot',
        shortDescription: 'Should be blocked',
        description: 'Should be blocked',
      }),
    });
    console.log(`Status: ${unauthCreateRes.status}`);
    if (unauthCreateRes.status !== 403) {
      throw new Error(`Expected 403 Forbidden for tourist, got ${unauthCreateRes.status}`);
    }
    console.log('✓ Tourist correctly blocked with 403 Forbidden.');

    // 7. Admin creates new destination
    console.log('\n[7] Testing Admin POST /api/destinations...');
    const newDestData = {
      name: `Pelling Skywalk ${unique}`,
      tag: 'Glass Skywalk & Viewpoint',
      district: 'West Sikkim',
      shortDescription: 'Spectacular glass skywalk facing the Kangchenjunga range.',
      description: 'Pelling Skywalk is Sikkim first glass bridge offering breathtaking panoramic views of Mt. Kangchenjunga and the Chenrezig statue.',
      whyVisit: ['Panoramic view of Kangchenjunga', 'First glass skywalk in Sikkim'],
      highlights: ['Glass Skywalk', 'Chenrezig Statue', 'Monastery circuit'],
      travelInfo: 'Located near Pelling town in West Sikkim. Easily accessible by local taxis.',
      permitNote: 'Standard tourist permit not required for Indian citizens.',
      bestTimeToVisit: 'September to May',
      relatedSlugs: ['lachen', 'lachung'],
    };

    const createRes = await fetch(destUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify(newDestData),
    });
    const createData = await createRes.json();
    console.log(`Status: ${createRes.status}, Created ID: ${createData.data?._id}`);
    if (createRes.status !== 201 || !createData.data?._id) {
      throw new Error(`Admin failed to create destination: ${JSON.stringify(createData)}`);
    }
    createdDestinationId = createData.data._id;
    console.log(`✓ Admin created destination: ${createData.data.name} (slug: ${createData.data.slug})`);

    // 8. Admin updates destination
    console.log('\n[8] Testing Admin PUT /api/destinations/:id...');
    const updateRes = await fetch(`${destUrl}/${createdDestinationId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        tag: 'World-Class Himalayan Skywalk',
        bestTimeToVisit: 'Year-round except monsoon',
      }),
    });
    const updateData = await updateRes.json();
    console.log(`Status: ${updateRes.status}, New Tag: ${updateData.data?.tag}`);
    if (
      updateRes.status !== 200 ||
      updateData.data?.tag !== 'World-Class Himalayan Skywalk'
    ) {
      throw new Error('Admin failed to update destination');
    }
    console.log('✓ Destination updated successfully.');

    // 9. Admin soft-deactivates destination
    console.log('\n[9] Testing Admin DELETE /api/destinations/:id (Deactivate)...');
    const deleteRes = await fetch(`${destUrl}/${createdDestinationId}`, {
      method: 'DELETE',
      headers: { Cookie: adminCookie },
    });
    const deleteData = await deleteRes.json();
    console.log(`Status: ${deleteRes.status}, isActive: ${deleteData.data?.isActive}`);
    if (deleteRes.status !== 200 || deleteData.data?.isActive !== false) {
      throw new Error('Admin failed to deactivate destination');
    }
    console.log('✓ Destination deactivated (isActive: false).');

    // 10. Verify deactivated destination returns 404 to public requests
    console.log('\n[10] Testing public access to deactivated destination (Expect 404)...');
    const verifyRes = await fetch(`${destUrl}/${createData.data.slug}`);
    console.log(`Status: ${verifyRes.status}`);
    if (verifyRes.status !== 404) {
      throw new Error('Deactivated destination should return 404 to public requests');
    }
    console.log('✓ Deactivated destination correctly returns 404 to public discovery.');

    console.log('\n=================================================');
    console.log('🎉 ALL 10 PHASE 12 DESTINATION TESTS PASSED! 🎉');
    console.log('=================================================\n');
  } catch (err) {
    console.error('\n❌ TEST FAILED:', err.message);
    process.exitCode = 1;
  } finally {
    // Cleanup
    if (createdDestinationId) {
      await Destination.findByIdAndDelete(createdDestinationId).catch(() => {});
    }
    if (adminUser) {
      await User.findByIdAndDelete(adminUser._id).catch(() => {});
    }
    if (touristUser) {
      await User.findByIdAndDelete(touristUser._id).catch(() => {});
    }
    if (server) {
      server.close();
    }
    await mongoose.connection.close(false);
    process.exit(process.exitCode || 0);
  }
}

runDestinationTests();

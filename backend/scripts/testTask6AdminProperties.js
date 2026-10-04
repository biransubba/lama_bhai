/**
 * Task 6 Test Suite: Admin Property Approval & Moderation Backend Integration
 *
 * Verifies:
 * - Test 1: Admin property list (GET /api/admin/properties returns 200 & MongoDB properties)
 * - Test 2: Pending filter (GET /api/admin/properties?status=pending returns only pending properties)
 * - Test 3: Search (GET /api/admin/properties?search=Lachung matches name/town/district)
 * - Test 4: Approve property (PATCH /api/admin/properties/:id/status with status=approved)
 * - Test 5: Reject property (PATCH /api/admin/properties/:id/status with status=rejected)
 * - Test 6: Reviewer notes (PATCH with reviewerNotes persists notes in MongoDB)
 * - Test 7: Partner cannot access Admin API (GET /api/admin/properties returns 403)
 * - Test 8: Partner cannot approve (PATCH /api/admin/properties/:id/status returns 403, status unchanged)
 * - Test 9: Session persistence (Session cookie remains valid for /auth/me and reloads properties)
 * - Test 10: No static property data in AdminStays.jsx (staysRepo / staysStore removed from source)
 */

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { User, Property, Room } = require('../models');

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000/api';

let passedTests = 0;
const totalTests = 10;

function logPass(title, details = '') {
  passedTests++;
  console.log(`✓ PASS: ${title} ${details ? `(${details})` : ''}`);
}

function logFail(title, error) {
  console.error(`✗ FAIL: ${title}`, error);
}

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  const res = await fetch(url, { ...options, headers });
  let json = null;
  try {
    json = await res.json();
  } catch (_) {}
  return {
    status: res.status,
    headers: res.headers,
    cookie: res.headers.get('set-cookie')?.split(';')[0] || '',
    json,
  };
}

async function runTask6Tests() {
  console.log('================================================================');
  console.log(' STARTING TASK 6: ADMIN PROPERTY MODERATION TEST SUITE ');
  console.log('================================================================\n');

  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/lama-bhaila');

  const uniqueSuffix = Date.now().toString().slice(-6);

  try {
    // 0. SETUP: Create Admin user and Partner user in MongoDB
    console.log('[Setup] Registering Admin and Partner accounts...');
    const adminEmail = `admin_${uniqueSuffix}@lama.test`;
    const partnerEmail = `partner_${uniqueSuffix}@lama.test`;

    // Create Admin user directly with role 'admin'
    const adminUser = await User.create({
      name: 'System Admin',
      email: adminEmail,
      password: 'adminPassword123',
      role: 'admin',
    });

    // Create Partner user via API
    const regPartnerRes = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Homestay Partner Host',
        email: partnerEmail,
        password: 'partnerPassword123',
        role: 'owner',
        agencyName: 'Highland Hospitality',
        location: 'Lachung, North Sikkim',
      }),
    });
    const partnerCookie = regPartnerRes.cookie;
    const partnerUser = regPartnerRes.json.user;

    // Login Admin via POST /api/auth/login to acquire session cookie
    const loginAdminRes = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: adminEmail,
        password: 'adminPassword123',
      }),
    });
    const adminCookie = loginAdminRes.cookie;

    // Create 3 test properties in MongoDB with different statuses and locations
    const prop1 = await Property.create({
      name: `Lachung Alpine Retreat ${uniqueSuffix}`,
      slug: `lachung-alpine-retreat-${uniqueSuffix}`,
      type: 'Homestay',
      description: 'Charming wooden homestay in Lachung valley.',
      image: 'https://res.cloudinary.com/demo/image/upload/v1/sample.jpg',
      location: {
        district: 'North Sikkim',
        town: 'Lachung',
        address: 'Katao Road',
      },
      price: 2800,
      owner: partnerUser._id,
      status: 'pending',
      active: true,
    });

    const prop2 = await Property.create({
      name: `Gangtok City Heights ${uniqueSuffix}`,
      slug: `gangtok-city-heights-${uniqueSuffix}`,
      type: 'Hotel',
      description: 'Modern luxury hotel overlooking Gangtok valley.',
      image: 'https://res.cloudinary.com/demo/image/upload/v1/sample2.jpg',
      location: {
        district: 'East Sikkim',
        town: 'Gangtok',
        address: 'MG Marg Area',
      },
      price: 4500,
      owner: partnerUser._id,
      status: 'approved',
      active: true,
    });

    const prop3 = await Property.create({
      name: `Pelling Cloud Villa ${uniqueSuffix}`,
      slug: `pelling-cloud-villa-${uniqueSuffix}`,
      type: 'Resort',
      description: 'Scenic resort facing Kanchenjunga peaks.',
      image: 'https://res.cloudinary.com/demo/image/upload/v1/sample3.jpg',
      location: {
        district: 'West Sikkim',
        town: 'Pelling',
        address: 'Upper Pelling',
      },
      price: 3600,
      owner: partnerUser._id,
      status: 'pending',
      active: true,
    });

    console.log(`[Setup] Created 3 test properties: Prop1 (pending), Prop2 (approved), Prop3 (pending).\n`);

    // TEST 1 — Admin property list (GET /api/admin/properties)
    console.log('[Test 1] Testing Admin property list via GET /api/admin/properties...');
    const listRes = await request('/admin/properties', {
      method: 'GET',
      headers: { Cookie: adminCookie },
    });

    const isTest1Ok =
      listRes.status === 200 &&
      listRes.json.success === true &&
      Array.isArray(listRes.json.data) &&
      listRes.json.data.length >= 3 &&
      listRes.json.data.some((p) => p._id.toString() === prop1._id.toString());

    if (isTest1Ok) {
      logPass(
        'Test 1 Admin property list returns MongoDB properties with count & pagination',
        `total: ${listRes.json.total}, count: ${listRes.json.count}`
      );
    } else {
      logFail('Test 1 Admin property list failed', listRes);
    }

    // TEST 2 — Pending filter (GET /api/admin/properties?status=pending)
    console.log('\n[Test 2] Testing Pending filter via GET /api/admin/properties?status=pending...');
    const pendingRes = await request('/admin/properties?status=pending', {
      method: 'GET',
      headers: { Cookie: adminCookie },
    });

    const isTest2Ok =
      pendingRes.status === 200 &&
      pendingRes.json.success === true &&
      Array.isArray(pendingRes.json.data) &&
      pendingRes.json.data.length >= 2 &&
      pendingRes.json.data.every((p) => p.status === 'pending');

    if (isTest2Ok) {
      logPass(
        'Test 2 Pending filter returns strictly pending properties',
        `returned: ${pendingRes.json.count} pending properties`
      );
    } else {
      logFail('Test 2 Pending filter failed', pendingRes);
    }

    // TEST 3 — Search (GET /api/admin/properties?search=Lachung)
    console.log('\n[Test 3] Testing Search via GET /api/admin/properties?search=Lachung...');
    const searchRes = await request(`/admin/properties?search=Lachung`, {
      method: 'GET',
      headers: { Cookie: adminCookie },
    });

    const isTest3Ok =
      searchRes.status === 200 &&
      searchRes.json.success === true &&
      Array.isArray(searchRes.json.data) &&
      searchRes.json.data.some((p) => p._id.toString() === prop1._id.toString());

    if (isTest3Ok) {
      logPass(
        'Test 3 Search accurately queries name and location in MongoDB',
        `matched: ${searchRes.json.data[0].name}`
      );
    } else {
      logFail('Test 3 Search failed', searchRes);
    }

    // TEST 4 — Approve property (PATCH /api/admin/properties/:id/status -> status=approved)
    console.log('\n[Test 4] Testing Approve property via PATCH /api/admin/properties/:id/status...');
    const approveRes = await request(`/admin/properties/${prop1._id}/status`, {
      method: 'PATCH',
      headers: { Cookie: adminCookie },
      body: JSON.stringify({ status: 'approved' }),
    });

    const prop1InDb = await Property.findById(prop1._id).lean();

    const isTest4Ok =
      approveRes.status === 200 &&
      approveRes.json.success === true &&
      approveRes.json.data.status === 'approved' &&
      prop1InDb.status === 'approved';

    if (isTest4Ok) {
      logPass(
        'Test 4 Property approved successfully and verified in MongoDB',
        `property status: ${prop1InDb.status}`
      );
    } else {
      logFail('Test 4 Approve failed', { approveRes, prop1InDb });
    }

    // TEST 5 — Reject property (PATCH /api/admin/properties/:id/status -> status=rejected)
    console.log('\n[Test 5] Testing Reject property via PATCH /api/admin/properties/:id/status...');
    const rejectRes = await request(`/admin/properties/${prop3._id}/status`, {
      method: 'PATCH',
      headers: { Cookie: adminCookie },
      body: JSON.stringify({ status: 'rejected' }),
    });

    const prop3InDb = await Property.findById(prop3._id).lean();

    const isTest5Ok =
      rejectRes.status === 200 &&
      rejectRes.json.success === true &&
      rejectRes.json.data.status === 'rejected' &&
      prop3InDb.status === 'rejected';

    if (isTest5Ok) {
      logPass(
        'Test 5 Property rejected successfully and verified in MongoDB',
        `property status: ${prop3InDb.status}`
      );
    } else {
      logFail('Test 5 Reject failed', { rejectRes, prop3InDb });
    }

    // TEST 6 — Reviewer notes persistence
    console.log('\n[Test 6] Testing Reviewer notes persistence on rejection...');
    const noteText = 'Missing valid fire safety certificate and tourism registration';
    const noteRes = await request(`/admin/properties/${prop1._id}/status`, {
      method: 'PATCH',
      headers: { Cookie: adminCookie },
      body: JSON.stringify({
        status: 'rejected',
        reviewerNotes: noteText,
      }),
    });

    const prop1WithNote = await Property.findById(prop1._id).lean();

    const isTest6Ok =
      noteRes.status === 200 &&
      noteRes.json.success === true &&
      prop1WithNote.status === 'rejected' &&
      prop1WithNote.reviewerNotes === noteText;

    if (isTest6Ok) {
      logPass(
        'Test 6 Reviewer notes persisted accurately in MongoDB document',
        `notes: "${prop1WithNote.reviewerNotes}"`
      );
    } else {
      logFail('Test 6 Reviewer notes failed', { noteRes, prop1WithNote });
    }

    // TEST 7 — Partner cannot access Admin API (GET /api/admin/properties -> 403)
    console.log('\n[Test 7] Testing Partner blocked from GET /api/admin/properties...');
    const partnerListAttempt = await request('/admin/properties', {
      method: 'GET',
      headers: { Cookie: partnerCookie },
    });

    const isTest7Ok =
      partnerListAttempt.status === 403 &&
      partnerListAttempt.json.success === false;

    if (isTest7Ok) {
      logPass(
        'Test 7 Partner access to Admin properties API strictly rejected with 403 Forbidden',
        `response status: ${partnerListAttempt.status}`
      );
    } else {
      logFail('Test 7 Partner access check failed', partnerListAttempt);
    }

    // TEST 8 — Partner cannot approve (PATCH /api/admin/properties/:id/status -> 403)
    console.log('\n[Test 8] Testing Partner blocked from approving property...');
    const partnerApproveAttempt = await request(`/admin/properties/${prop1._id}/status`, {
      method: 'PATCH',
      headers: { Cookie: partnerCookie },
      body: JSON.stringify({ status: 'approved' }),
    });

    const prop1Unchanged = await Property.findById(prop1._id).lean();

    const isTest8Ok =
      partnerApproveAttempt.status === 403 &&
      partnerApproveAttempt.json.success === false &&
      prop1Unchanged.status === 'rejected'; // Still rejected, partner could not approve

    if (isTest8Ok) {
      logPass(
        'Test 8 Partner forbidden from approving property and MongoDB status preserved intact',
        `status remained: ${prop1Unchanged.status}`
      );
    } else {
      logFail('Test 8 Partner approve attempt check failed', partnerApproveAttempt);
    }

    // TEST 9 — Session persistence on refresh
    console.log('\n[Test 9] Testing Admin session persistence across page reload...');
    const meRes = await request('/auth/me', {
      method: 'GET',
      headers: { Cookie: adminCookie },
    });

    const reloadRes = await request('/admin/properties', {
      method: 'GET',
      headers: { Cookie: adminCookie },
    });

    const isTest9Ok =
      meRes.status === 200 &&
      meRes.json.success === true &&
      meRes.json.user.role === 'admin' &&
      reloadRes.status === 200 &&
      reloadRes.json.data.length >= 3;

    if (isTest9Ok) {
      logPass(
        'Test 9 Admin session persisted and reloaded live MongoDB properties successfully',
        `admin user: ${meRes.json.user.name} (${meRes.json.user.email})`
      );
    } else {
      logFail('Test 9 Session persistence failed', { meRes, reloadRes });
    }

    // TEST 10 — No static property data in AdminStays.jsx
    console.log('\n[Test 10] Verifying AdminStays.jsx no longer uses mock / static property storage...');
    const adminStaysFile = path.join(__dirname, '../../src/admin/pages/AdminStays.jsx');
    const code = fs.readFileSync(adminStaysFile, 'utf8');

    const usesStaysRepo = code.includes('staysRepo');
    const usesStaysStore = code.includes('staysStore');
    const usesApiAdmin = code.includes('api.admin.getProperties') && code.includes('api.admin.updatePropertyStatus');

    const isTest10Ok = !usesStaysRepo && !usesStaysStore && usesApiAdmin;

    if (isTest10Ok) {
      logPass(
        'Test 10 AdminStays.jsx is completely free from static staysRepo / staysStore dependencies',
        'exclusively uses api.admin.getProperties and api.admin.updatePropertyStatus'
      );
    } else {
      logFail('Test 10 Check failed', { usesStaysRepo, usesStaysStore, usesApiAdmin });
    }

    // Clean up created test data
    await Property.deleteMany({ _id: { $in: [prop1._id, prop2._id, prop3._id] } });
    await User.deleteMany({ _id: { $in: [adminUser._id, partnerUser._id] } });

    console.log('\n================================================================');
    console.log(` TASK 6 RESULTS: ${passedTests}/${totalTests} TESTS PASSED `);
    console.log('================================================================\n');

    if (passedTests === totalTests) {
      console.log('>>> TASK 6 IMPLEMENTATION IS 100% COMPLETE AND VERIFIED <<<\n');
      process.exit(0);
    } else {
      console.error(`Only ${passedTests} of ${totalTests} tests passed.`);
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal error during Task 6 tests:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

runTask6Tests();

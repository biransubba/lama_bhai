/**
 * Task 9 Test Suite: Admin Creates Partner Accounts
 *
 * Verifies:
 * - Test 1: Admin can create partner (POST /api/admin/partners returns 201)
 * - Test 2: Created user has the correct existing partner role ('owner')
 * - Test 3: Password is hashed (MongoDB contains bcrypt hash, NOT plaintext temporaryPassword)
 * - Test 4: Duplicate email rejected (returns 400 with friendly message)
 * - Test 5: Partner cannot call POST /api/admin/partners (returns 403 Forbidden)
 * - Test 6: Unauthenticated request rejected (returns 401 Unauthorized)
 * - Test 7: Created partner can log in using existing login system (POST /api/auth/login returns 200)
 * - Test 8: Created partner reaches Partner Dashboard (GET /api/auth/me returns role: 'owner')
 * - Test 9: Admin Partner list (GET /api/admin/partners) contains the newly created partner
 * - Test 10: Partner list response never contains password or passwordHash
 */

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { User } = require('../models');

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

async function runTask9Tests() {
  console.log('================================================================');
  console.log(' STARTING TASK 9: ADMIN CREATES PARTNER ACCOUNTS TEST SUITE ');
  console.log('================================================================\n');

  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/lama-bhaila');

  const uniqueSuffix = Date.now().toString().slice(-6);

  try {
    // 0. SETUP: Create an Admin user and a pre-existing Partner user
    console.log('[Setup] Registering Admin and regular Partner test accounts...');
    const adminEmail = `admin_${uniqueSuffix}@lama.test`;
    const existingPartnerEmail = `existing_partner_${uniqueSuffix}@lama.test`;
    const tempPassword = 'TempPassword123!';

    // Create Admin
    const adminUser = await User.create({
      name: 'Super Admin',
      email: adminEmail,
      password: 'adminPassword123',
      role: 'admin',
      phone: '9800000001',
    });

    // Create regular Partner for role restriction test
    const regularPartnerUser = await User.create({
      name: 'Regular Host',
      email: existingPartnerEmail,
      password: 'partnerPassword123',
      role: 'owner',
      phone: '9800000002',
      partnerProfile: {
        agencyName: 'Existing Homestay',
        location: 'Gangtok',
        verificationStatus: 'Approved',
      },
    });

    // Log in as Admin to obtain admin session cookie
    const adminLoginRes = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: adminEmail, password: 'adminPassword123' }),
    });
    const adminCookie = adminLoginRes.cookie;
    if (!adminCookie) {
      throw new Error(`Admin login failed: status ${adminLoginRes.status}, ${JSON.stringify(adminLoginRes.json)}`);
    }

    // Log in as regular Partner to obtain partner session cookie
    const partnerLoginRes = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: existingPartnerEmail, password: 'partnerPassword123' }),
    });
    const partnerCookie = partnerLoginRes.cookie;

    const newPartnerEmail = `partner_${uniqueSuffix}@example.com`;
    const newPartnerName = `Tenzing Norbu ${uniqueSuffix}`;
    const newPartnerPhone = '9876543210';
    let createdPartnerId = null;

    // -------------------------------------------------------------
    // TEST 1: Admin can create partner (POST /api/admin/partners returns 201)
    // -------------------------------------------------------------
    const createRes = await request('/admin/partners', {
      method: 'POST',
      headers: { Cookie: adminCookie },
      body: JSON.stringify({
        name: newPartnerName,
        phone: newPartnerPhone,
        email: newPartnerEmail,
        temporaryPassword: tempPassword,
        agencyName: 'Kanchenjunga Heights Homestay',
        location: 'Lachen',
      }),
    });

    if (createRes.status === 201 && createRes.json?.success && createRes.json?.data) {
      createdPartnerId = createRes.json.data._id || createRes.json.data.id;
      logPass('Test 1: Admin can create partner', `Status: 201, Partner ID: ${createdPartnerId}`);
    } else {
      logFail('Test 1: Admin can create partner', `Expected 201, got ${createRes.status}: ${JSON.stringify(createRes.json)}`);
    }

    // -------------------------------------------------------------
    // TEST 2: Created user has the correct existing partner role ('owner')
    // -------------------------------------------------------------
    const dbUser = await User.findById(createdPartnerId).select('+password');
    if (dbUser && dbUser.role === 'owner') {
      logPass('Test 2: Created user has the correct existing partner role', `Role in MongoDB: '${dbUser.role}'`);
    } else {
      logFail('Test 2: Created user role verification', `Expected role 'owner', got '${dbUser?.role}'`);
    }

    // -------------------------------------------------------------
    // TEST 3: Password is hashed (Database does NOT contain plaintext temporaryPassword)
    // -------------------------------------------------------------
    const isPlaintext = dbUser?.password === tempPassword;
    const isBcryptHash = typeof dbUser?.password === 'string' && dbUser.password.startsWith('$2');
    const isPasswordValid = await bcrypt.compare(tempPassword, dbUser?.password || '');

    if (!isPlaintext && isBcryptHash && isPasswordValid) {
      logPass('Test 3: Password is hashed securely', `bcrypt hash: ${dbUser.password.slice(0, 15)}... (Plaintext was NOT stored)`);
    } else {
      logFail('Test 3: Password hashing verification', `isPlaintext=${isPlaintext}, isBcryptHash=${isBcryptHash}, isPasswordValid=${isPasswordValid}`);
    }

    // -------------------------------------------------------------
    // TEST 4: Duplicate email rejected (returns 400)
    // -------------------------------------------------------------
    const dupRes = await request('/admin/partners', {
      method: 'POST',
      headers: { Cookie: adminCookie },
      body: JSON.stringify({
        name: 'Another Host',
        phone: '9811111111',
        email: newPartnerEmail, // Same email!
        temporaryPassword: 'AnotherPassword123!',
      }),
    });

    if (dupRes.status === 400 && (dupRes.json?.error || dupRes.json?.message)) {
      logPass('Test 4: Duplicate email rejected', `Status: 400, Error: "${dupRes.json.error || dupRes.json.message}"`);
    } else {
      logFail('Test 4: Duplicate email rejection', `Expected 400, got ${dupRes.status}: ${JSON.stringify(dupRes.json)}`);
    }

    // -------------------------------------------------------------
    // TEST 5: Partner cannot call POST /api/admin/partners (returns 403)
    // -------------------------------------------------------------
    const partnerForbiddenRes = await request('/admin/partners', {
      method: 'POST',
      headers: { Cookie: partnerCookie },
      body: JSON.stringify({
        name: 'Hacker Partner',
        phone: '9822222222',
        email: `hacker_${uniqueSuffix}@lama.test`,
        temporaryPassword: 'TempPassword123!',
      }),
    });

    if (partnerForbiddenRes.status === 403) {
      logPass('Test 5: Partner cannot call POST /api/admin/partners', `Status: 403 Forbidden`);
    } else {
      logFail('Test 5: Partner authorization check', `Expected 403, got ${partnerForbiddenRes.status}`);
    }

    // -------------------------------------------------------------
    // TEST 6: Unauthenticated request rejected (returns 401)
    // -------------------------------------------------------------
    const unauthRes = await request('/admin/partners', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Unauth User',
        phone: '9833333333',
        email: `unauth_${uniqueSuffix}@lama.test`,
        temporaryPassword: 'TempPassword123!',
      }),
    });

    if (unauthRes.status === 401) {
      logPass('Test 6: Unauthenticated request rejected', `Status: 401 Unauthorized`);
    } else {
      logFail('Test 6: Unauthenticated request rejection', `Expected 401, got ${unauthRes.status}`);
    }

    // -------------------------------------------------------------
    // TEST 7: Created partner can log in using existing login system
    // -------------------------------------------------------------
    const newPartnerLoginRes = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: newPartnerEmail,
        password: tempPassword,
      }),
    });

    const newPartnerCookie = newPartnerLoginRes.cookie;
    if (newPartnerLoginRes.status === 200 && newPartnerLoginRes.json?.success && newPartnerCookie) {
      logPass('Test 7: Created partner can log in using existing login system', `Status: 200, Session Cookie Established`);
    } else {
      logFail('Test 7: Partner login verification', `Expected 200, got ${newPartnerLoginRes.status}: ${JSON.stringify(newPartnerLoginRes.json)}`);
    }

    // -------------------------------------------------------------
    // TEST 8: Created partner reaches Partner Dashboard (GET /api/auth/me)
    // -------------------------------------------------------------
    const meRes = await request('/auth/me', {
      method: 'GET',
      headers: { Cookie: newPartnerCookie },
    });

    if (
      meRes.status === 200 &&
      meRes.json?.user?.role === 'owner' &&
      meRes.json?.user?.partnerProfile?.verificationStatus === 'Approved'
    ) {
      logPass('Test 8: Created partner reaches Partner Dashboard', `User role: '${meRes.json.user.role}', Verification: '${meRes.json.user.partnerProfile.verificationStatus}'`);
    } else {
      logFail('Test 8: Partner Dashboard access check', `Status: ${meRes.status}, User: ${JSON.stringify(meRes.json?.user)}`);
    }

    // -------------------------------------------------------------
    // TEST 9: Admin Partner list contains the newly created partner
    // -------------------------------------------------------------
    const listRes = await request('/admin/partners', {
      method: 'GET',
      headers: { Cookie: adminCookie },
    });

    const partnersList = listRes.json?.data || [];
    const foundPartner = partnersList.find(
      (p) => (p._id || p.id).toString() === createdPartnerId.toString() || p.email === newPartnerEmail
    );

    if (listRes.status === 200 && foundPartner) {
      logPass('Test 9: Admin Partner list contains newly created partner', `Found: ${foundPartner.name} (${foundPartner.email})`);
    } else {
      logFail('Test 9: Admin Partner list verification', `Partner not found in list of ${partnersList.length} partners`);
    }

    // -------------------------------------------------------------
    // TEST 10: Partner list response never contains password or passwordHash
    // -------------------------------------------------------------
    let leakDetected = false;
    partnersList.forEach((p) => {
      if (p.password !== undefined || p.passwordHash !== undefined) {
        leakDetected = true;
      }
    });

    const createResponseHasPassword =
      createRes.json?.data?.password !== undefined ||
      createRes.json?.data?.passwordHash !== undefined;

    if (!leakDetected && !createResponseHasPassword) {
      logPass('Test 10: Partner responses never contain password or passwordHash', 'Verified 0 password/hash leaks across all partner endpoints');
    } else {
      logFail('Test 10: Password leakage check', `Leak detected! leakInList=${leakDetected}, leakInCreate=${createResponseHasPassword}`);
    }

    // CLEANUP
    console.log('\n[Cleanup] Removing temporary test users from MongoDB...');
    await User.deleteMany({
      _id: { $in: [adminUser._id, regularPartnerUser._id, createdPartnerId] },
    });
    console.log('[Cleanup] Completed.\n');

  } catch (error) {
    console.error('Fatal error running tests:', error);
  } finally {
    await mongoose.disconnect();
  }

  console.log('================================================================');
  console.log(` RESULTS: ${passedTests}/${totalTests} TESTS PASSED `);
  console.log('================================================================');

  if (passedTests === totalTests) {
    console.log('\n🌟 ALL TASK 9 TESTS PASSED SUCCESSFULLY! 🌟\n');
    process.exit(0);
  } else {
    console.error(`\n❌ ${totalTests - passedTests} TESTS FAILED\n`);
    process.exit(1);
  }
}

runTask9Tests();

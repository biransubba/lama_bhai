const mongoose = require('mongoose');

async function runTests() {
  console.log('--- Starting Authentication Test Suite ---');
  // Import server
  const { server } = require('../server');

  // Wait 1.5 seconds for DB connection to establish
  await new Promise((r) => setTimeout(r, 1500));

  const baseUrl = 'http://localhost:5000/api/auth';
  let cookie = '';

  const uniqueSuffix = Date.now().toString().slice(-6);

  try {
    // 1. Register Tourist
    console.log('\n[1] Testing POST /api/auth/register (Tourist)...');
    const touristData = {
      name: 'Karma Bhutia',
      email: `karma_${uniqueSuffix}@lama.test`,
      password: 'securePassword123',
      role: 'tourist',
      phone: '+91 9876543210',
    };

    const regRes = await fetch(`${baseUrl}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(touristData),
    });

    const regJson = await regRes.json();
    console.log('Status:', regRes.status);
    console.log('Response:', regJson);

    // Save session cookie
    const setCookieHeader = regRes.headers.get('set-cookie');
    if (setCookieHeader) {
      cookie = setCookieHeader.split(';')[0];
      console.log('Session cookie acquired:', cookie);
    }

    if (!regJson.success) {
      throw new Error(`Tourist registration failed: ${JSON.stringify(regJson)}`);
    }

    // 2. Check /api/auth/me with session cookie
    console.log('\n[2] Testing GET /api/auth/me (Authenticated Session)...');
    const meRes = await fetch(`${baseUrl}/me`, {
      method: 'GET',
      headers: { Cookie: cookie },
    });
    const meJson = await meRes.json();
    console.log('Status:', meRes.status);
    console.log('Response:', meJson);

    if (!meJson.success || meJson.user.email !== touristData.email) {
      throw new Error(`Session /me verification failed: ${JSON.stringify(meJson)}`);
    }

    // 3. Register Owner / Partner
    console.log('\n[3] Testing POST /api/auth/register (Owner / Partner)...');
    const ownerData = {
      name: 'Tashi Namgyal',
      email: `tashi_${uniqueSuffix}@lama.test`,
      password: 'securePassword123',
      role: 'owner',
      agencyName: 'Khangchendzonga Retreat & Homestay',
      location: 'Lachung, North Sikkim',
      notes: 'Experienced hospitality host in North Sikkim',
    };

    const ownerRes = await fetch(`${baseUrl}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ownerData),
    });
    const ownerJson = await ownerRes.json();
    console.log('Status:', ownerRes.status);
    console.log('Response:', ownerJson);

    if (
      !ownerJson.success ||
      ownerJson.user.role !== 'owner' ||
      ownerJson.user.partnerProfile?.verificationStatus !== 'Pending'
    ) {
      throw new Error(`Owner registration failed: ${JSON.stringify(ownerJson)}`);
    }

    // 4. Test Login with tourist credentials
    console.log('\n[4] Testing POST /api/auth/login...');
    const loginRes = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: touristData.email,
        password: 'securePassword123',
      }),
    });
    const loginJson = await loginRes.json();
    console.log('Status:', loginRes.status);
    console.log('Response:', loginJson);

    if (!loginJson.success || loginJson.user.email !== touristData.email) {
      throw new Error(`Login failed: ${JSON.stringify(loginJson)}`);
    }

    const loginCookie = loginRes.headers.get('set-cookie')?.split(';')[0];

    // 5. Test Logout
    console.log('\n[5] Testing POST /api/auth/logout...');
    const logoutRes = await fetch(`${baseUrl}/logout`, {
      method: 'POST',
      headers: { Cookie: loginCookie || cookie },
    });
    const logoutJson = await logoutRes.json();
    console.log('Status:', logoutRes.status);
    console.log('Response:', logoutJson);

    if (!logoutJson.success) {
      throw new Error(`Logout failed: ${JSON.stringify(logoutJson)}`);
    }

    console.log('\n===============================================');
    console.log(' ALL AUTHENTICATION TESTS PASSED SUCCESSFULLY! ');
    console.log('===============================================');
  } catch (err) {
    console.error('\nTest Failed:', err.message);
    process.exitCode = 1;
  } finally {
    server.close();
    await mongoose.connection.close();
    process.exit(process.exitCode || 0);
  }
}

runTests();

/**
 * Test Partner Authentication & Session Flow
 * Validates the exact backend integration used by PartnerAuthContext and PartnerLogin
 */

async function testPartnerFlow() {
  const baseUrl = 'http://localhost:5000/api';
  console.log('====================================================');
  console.log(' STARTING PARTNER SESSION AUTHENTICATION TEST SUITE ');
  console.log('====================================================\n');

  let passedTests = 0;
  const totalTests = 5;

  // Test 1: Unauthenticated user check
  console.log('[Test 1] Testing unauthenticated state on GET /api/auth/me...');
  try {
    const res = await fetch(`${baseUrl}/auth/me`, { method: 'GET' });
    const json = await res.json();
    if (res.status === 401 && json.success === false) {
      console.log('✓ PASS: Unauthenticated access returns 401 and success: false');
      passedTests++;
    } else {
      console.error('✗ FAIL: Expected 401 for unauthenticated /me, got:', res.status, json);
    }
  } catch (err) {
    console.error('✗ FAIL in Test 1:', err.message);
  }

  // Test 2: Valid partner login
  console.log('\n[Test 2] Testing valid partner login via POST /api/auth/login...');
  let sessionCookie = '';
  try {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'mw_owner_82977@lama.test',
        password: 'password123',
      }),
    });
    const json = await res.json();
    const setCookie = res.headers.get('set-cookie');
    if (setCookie) {
      sessionCookie = setCookie.split(';')[0];
    }

    if (
      res.status === 200 &&
      json.success === true &&
      json.user &&
      json.user.role === 'owner' &&
      sessionCookie.includes('connect.sid')
    ) {
      console.log('✓ PASS: Login successful. Session cookie received:', sessionCookie.substring(0, 30) + '...');
      console.log('        Authenticated user:', json.user.name, `(${json.user.role})`);
      console.log('        Partner verification status:', json.user.partnerProfile?.verificationStatus);
      passedTests++;
    } else {
      console.error('✗ FAIL in Test 2:', res.status, json);
    }
  } catch (err) {
    console.error('✗ FAIL in Test 2:', err.message);
  }

  // Test 3: Session persistence (/api/auth/me using cookie)
  console.log('\n[Test 3] Testing session persistence via GET /api/auth/me (with session cookie)...');
  try {
    const res = await fetch(`${baseUrl}/auth/me`, {
      method: 'GET',
      headers: { Cookie: sessionCookie },
    });
    const json = await res.json();

    if (
      res.status === 200 &&
      json.success === true &&
      json.user &&
      json.user.email === 'mw_owner_82977@lama.test'
    ) {
      console.log('✓ PASS: Session restored successfully from cookie:');
      console.log('        User ID:', json.user._id);
      console.log('        Email:', json.user.email);
      console.log('        Role:', json.user.role);
      passedTests++;
    } else {
      console.error('✗ FAIL in Test 3:', res.status, json);
    }
  } catch (err) {
    console.error('✗ FAIL in Test 3:', err.message);
  }

  // Test 4: Logout
  console.log('\n[Test 4] Testing logout via POST /api/auth/logout...');
  try {
    const logoutRes = await fetch(`${baseUrl}/auth/logout`, {
      method: 'POST',
      headers: { Cookie: sessionCookie },
    });
    const logoutJson = await logoutRes.json();

    // Verify session is destroyed
    const verifyRes = await fetch(`${baseUrl}/auth/me`, {
      method: 'GET',
      headers: { Cookie: sessionCookie },
    });
    const verifyJson = await verifyRes.json();

    if (
      logoutRes.status === 200 &&
      logoutJson.success === true &&
      verifyRes.status === 401 &&
      verifyJson.success === false
    ) {
      console.log('✓ PASS: Session successfully destroyed on backend. Subsequent /me returns 401.');
      passedTests++;
    } else {
      console.error('✗ FAIL in Test 4: Session still active after logout:', verifyRes.status, verifyJson);
    }
  } catch (err) {
    console.error('✗ FAIL in Test 4:', err.message);
  }

  // Test 5: Role authorization (Tourist attempting partner login / access)
  console.log('\n[Test 5] Testing role authorization (Tourist blocked from partner access)...');
  try {
    const touristLogin = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'passang_05167@lama.test',
        password: 'password123',
      }),
    });
    const touristJson = await touristLogin.json();
    const touristCookie = touristLogin.headers.get('set-cookie')?.split(';')[0];

    // Attempt to access owner-only protected endpoint with tourist session
    const ownerRes = await fetch(`${baseUrl}/owner/properties`, {
      method: 'GET',
      headers: { Cookie: touristCookie },
    });
    const ownerJson = await ownerRes.json();

    if (
      touristJson.user?.role === 'tourist' &&
      ownerRes.status === 403 &&
      ownerJson.success === false
    ) {
      console.log('✓ PASS: RBAC successfully verified.');
      console.log('        User role is tourist; backend rejects owner access with 403:', ownerJson.error);
      passedTests++;
    } else {
      console.error('✗ FAIL in Test 5:', ownerRes.status, ownerJson);
    }
  } catch (err) {
    console.error('✗ FAIL in Test 5:', err.message);
  }

  console.log('\n====================================================');
  console.log(` RESULTS: ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY!`);
  console.log('====================================================');

  if (passedTests === totalTests) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

testPartnerFlow();

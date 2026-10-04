/**
 * Task 2 Test Suite: Partner Properties MongoDB Backend Integration & Scoping
 */

async function runTask2Tests() {
  const baseUrl = 'http://localhost:5000/api';
  console.log('================================================================');
  console.log(' STARTING TASK 2: PARTNER PROPERTIES BACKEND TEST SUITE ');
  console.log('================================================================\n');

  let passedTests = 0;
  const totalTests = 6;

  // TEST 1: Partner Login
  console.log('[Test 1] Testing Partner Login via POST /api/auth/login...');
  let norbuCookie = '';
  let norbuUser = null;
  try {
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'norbu_52704@lama.test',
        password: 'password123',
      }),
    });
    const loginJson = await loginRes.json();
    norbuCookie = loginRes.headers.get('set-cookie')?.split(';')[0];
    norbuUser = loginJson.user;

    if (
      loginRes.status === 200 &&
      loginJson.success &&
      norbuCookie &&
      norbuUser.role === 'owner'
    ) {
      console.log('✓ PASS: Partner login succeeded with session cookie.');
      console.log('        Host:', norbuUser.name, `(${norbuUser.email})`);
      passedTests++;
    } else {
      console.error('✗ FAIL in Test 1:', loginRes.status, loginJson);
    }
  } catch (err) {
    console.error('✗ FAIL in Test 1:', err.message);
  }

  // TEST 2: Properties loaded from MongoDB via GET /api/owner/properties
  console.log('\n[Test 2] Testing GET /api/owner/properties (MongoDB backed)...');
  let norbuProps = [];
  try {
    const propRes = await fetch(`${baseUrl}/owner/properties`, {
      headers: { Cookie: norbuCookie },
    });
    const propJson = await propRes.json();
    norbuProps = propJson.data || [];

    if (
      propRes.status === 200 &&
      propJson.success &&
      Array.isArray(norbuProps) &&
      norbuProps.length > 0 &&
      norbuProps[0]._id
    ) {
      console.log('✓ PASS: Properties loaded from MongoDB.');
      console.log(`        Retrieved ${norbuProps.length} properties for ${norbuUser.name}:`);
      norbuProps.forEach((p) => {
        console.log(`        - ${p.name} (₹${p.price}) | Rooms: ${p.rooms?.length || 0} | Availability: ${p.availability || (p.active ? 'available' : 'unavailable')}`);
      });
      passedTests++;
    } else {
      console.error('✗ FAIL in Test 2:', propRes.status, propJson);
    }
  } catch (err) {
    console.error('✗ FAIL in Test 2:', err.message);
  }

  // TEST 3: Partner Isolation (Ownership Scoping)
  console.log('\n[Test 3] Testing Partner Isolation & Ownership Scoping...');
  try {
    // Login Partner B: Sonam
    const sonamLogin = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'sonam_47458@lama.test',
        password: 'password123',
      }),
    });
    const sonamCookie = sonamLogin.headers.get('set-cookie')?.split(';')[0];
    const sonamPropsRes = await fetch(`${baseUrl}/owner/properties`, {
      headers: { Cookie: sonamCookie },
    });
    const sonamProps = (await sonamPropsRes.json()).data || [];

    // Login Partner C: MW Owner (0 properties)
    const mwLogin = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'mw_owner_82977@lama.test',
        password: 'password123',
      }),
    });
    const mwCookie = mwLogin.headers.get('set-cookie')?.split(';')[0];
    const mwPropsRes = await fetch(`${baseUrl}/owner/properties`, {
      headers: { Cookie: mwCookie },
    });
    const mwProps = (await mwPropsRes.json()).data || [];

    // Verify isolation: Sonam has 1 property, Norbu has 3, MW has 0, NO overlap
    const norbuIds = new Set(norbuProps.map((p) => String(p._id)));
    const sonamIds = new Set(sonamProps.map((p) => String(p._id)));
    const hasOverlap = [...norbuIds].some((id) => sonamIds.has(id));

    if (
      sonamProps.length === 1 &&
      mwProps.length === 0 &&
      !hasOverlap
    ) {
      console.log('✓ PASS: Strict ownership isolation verified.');
      console.log(`        Partner A (Norbu) properties: ${norbuProps.length}`);
      console.log(`        Partner B (Sonam) properties: ${sonamProps.length} (${sonamProps[0].name})`);
      console.log(`        Partner C (MW Owner) properties: ${mwProps.length}`);
      console.log('        Zero property leakage or cross-partner exposure detected.');
      passedTests++;
    } else {
      console.error('✗ FAIL in Test 3: Overlap or incorrect count:', {
        norbuCount: norbuProps.length,
        sonamCount: sonamProps.length,
        mwCount: mwProps.length,
        hasOverlap,
      });
    }
  } catch (err) {
    console.error('✗ FAIL in Test 3:', err.message);
  }

  // TEST 4: Property Edit & Persistence (PUT /api/owner/properties/:id)
  console.log('\n[Test 4] Testing Property Edit and MongoDB Persistence...');
  try {
    const targetProperty = norbuProps[0];
    const originalPrice = targetProperty.price;
    const testUpdatedPrice = originalPrice === 2400 ? 2550 : 2400;
    const testUpdatedDesc = `Updated mountain retreat with pristine alpine views - Test timestamp ${Date.now().toString().slice(-4)}`;

    const putRes = await fetch(`${baseUrl}/owner/properties/${targetProperty._id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: norbuCookie,
      },
      body: JSON.stringify({
        price: testUpdatedPrice,
        description: testUpdatedDesc,
        availability: 'available',
      }),
    });
    const putJson = await putRes.json();

    // Re-query directly via GET /api/owner/properties/:id to confirm MongoDB persistence
    const verifyRes = await fetch(`${baseUrl}/owner/properties/${targetProperty._id}`, {
      headers: { Cookie: norbuCookie },
    });
    const verifyJson = await verifyRes.json();
    const persisted = verifyJson.data;

    if (
      putRes.status === 200 &&
      putJson.success &&
      persisted.price === testUpdatedPrice &&
      persisted.description === testUpdatedDesc &&
      persisted.availability === 'available'
    ) {
      console.log('✓ PASS: Property successfully updated via PUT and verified in MongoDB:');
      console.log(`        Property: ${persisted.name}`);
      console.log(`        Updated Price: ₹${persisted.price}`);
      console.log(`        Updated Availability: ${persisted.availability}`);
      console.log(`        Updated Description: "${persisted.description.substring(0, 50)}..."`);
      passedTests++;
    } else {
      console.error('✗ FAIL in Test 4: Update failed or was not persisted:', putRes.status, putJson, persisted);
    }
  } catch (err) {
    console.error('✗ FAIL in Test 4:', err.message);
  }

  // TEST 5: Unauthorized Property Modification (Cross-Partner Hack Protection)
  console.log('\n[Test 5] Testing Unauthorized Property Modification Protection...');
  try {
    // Sonam tries to edit Norbu's property
    const sonamLogin = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'sonam_47458@lama.test',
        password: 'password123',
      }),
    });
    const sonamCookie = sonamLogin.headers.get('set-cookie')?.split(';')[0];
    const targetId = norbuProps[0]._id;

    const unauthorizedRes = await fetch(`${baseUrl}/owner/properties/${targetId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: sonamCookie,
      },
      body: JSON.stringify({
        name: 'Malicious Hijack Attempt',
        price: 99999,
      }),
    });
    const unauthorizedJson = await unauthorizedRes.json();

    if (
      unauthorizedRes.status === 403 &&
      unauthorizedJson.success === false &&
      unauthorizedJson.error.includes('Access denied')
    ) {
      console.log('✓ PASS: Backend rejected unauthorized cross-owner edit:');
      console.log(`        HTTP ${unauthorizedRes.status}: ${unauthorizedJson.error}`);
      passedTests++;
    } else {
      console.error('✗ FAIL in Test 5: Expected 403 Forbidden, got:', unauthorizedRes.status, unauthorizedJson);
    }
  } catch (err) {
    console.error('✗ FAIL in Test 5:', err.message);
  }

  // TEST 6: Session and Property Persistence on Refresh
  console.log('\n[Test 6] Testing Session & Property Reload on Page Refresh...');
  try {
    // 1. Session check (/api/auth/me) with cookie
    const meRes = await fetch(`${baseUrl}/auth/me`, {
      headers: { Cookie: norbuCookie },
    });
    const meJson = await meRes.json();

    // 2. Fresh properties fetch (/api/owner/properties) with cookie
    const refPropsRes = await fetch(`${baseUrl}/owner/properties`, {
      headers: { Cookie: norbuCookie },
    });
    const refPropsJson = await refPropsRes.json();

    if (
      meRes.status === 200 &&
      meJson.user.email === 'norbu_52704@lama.test' &&
      refPropsRes.status === 200 &&
      refPropsJson.data.length === norbuProps.length
    ) {
      console.log('✓ PASS: Session remains authenticated and properties reloaded cleanly from MongoDB.');
      console.log(`        Current user: ${meJson.user.email}`);
      console.log(`        Reloaded properties count: ${refPropsJson.data.length}`);
      passedTests++;
    } else {
      console.error('✗ FAIL in Test 6:', meRes.status, refPropsRes.status);
    }
  } catch (err) {
    console.error('✗ FAIL in Test 6:', err.message);
  }

  console.log('\n================================================================');
  console.log(` RESULTS: ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY!`);
  console.log('================================================================\n');

  if (passedTests === totalTests) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTask2Tests();

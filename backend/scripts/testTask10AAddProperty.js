/**
 * TASK 10A TEST SUITE: Partner Add Property Form & MongoDB Backend Integration
 * Validates:
 * 1. Partner authentication
 * 2. Missing required fields validation on POST /api/owner/properties
 * 3. Single image upload via POST /api/upload/image (Multer / Cloudinary / Local fallback)
 * 4. Gallery upload via POST /api/upload/gallery
 * 5. Full property creation via POST /api/owner/properties
 * 6. Property status is strictly 'pending'
 * 7. Property owner is strictly the authenticated partner
 * 8. Property appears in GET /api/owner/properties
 */

const fs = require('fs');
const path = require('path');

async function runTask10ATests() {
  const baseUrl = 'http://localhost:5000/api';
  console.log('================================================================');
  console.log(' STARTING TASK 10A: PARTNER ADD PROPERTY TEST SUITE ');
  console.log('================================================================\n');

  let passedTests = 0;
  const totalTests = 8;

  // 1. Partner Login
  console.log('[Test 1] Authenticating as Partner host...');
  let partnerCookie = '';
  let partnerUser = null;

  // Attempt login with known test partner or find approved owner
  const candidatePartners = [
    { email: 'norbu_52704@lama.test', password: 'password123' },
    { email: 'mw_owner_82977@lama.test', password: 'password123' },
  ];

  for (const creds of candidatePartners) {
    try {
      const loginRes = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(creds),
      });
      const loginJson = await loginRes.json();
      if (loginRes.status === 200 && loginJson.success && loginJson.user?.role === 'owner') {
        partnerCookie = loginRes.headers.get('set-cookie')?.split(';')[0];
        partnerUser = loginJson.user;
        break;
      }
    } catch (e) {
      // try next
    }
  }

  // If none matched, check if an admin can list partners or register one
  if (!partnerCookie) {
    console.log('No cached partner login, creating temporary test partner...');
    try {
      const regRes = await fetch(`${baseUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Task 10A Host',
          email: `task10a_host_${Date.now()}@lama.test`,
          password: 'password123',
          role: 'owner',
          phone: '9876500000',
        }),
      });
      const regJson = await regRes.json();
      partnerCookie = regRes.headers.get('set-cookie')?.split(';')[0];
      partnerUser = regJson.user;
    } catch (e) {
      console.error('Failed to create partner user:', e.message);
    }
  }

  if (partnerCookie && partnerUser) {
    console.log(`✓ PASS: Partner authenticated: ${partnerUser.name} (${partnerUser.email}), Role: ${partnerUser.role}`);
    passedTests++;
  } else {
    console.error('✗ FAIL: Could not authenticate partner user.');
    process.exit(1);
  }

  // 2. Missing required fields validation on POST /api/owner/properties
  console.log('\n[Test 2] Testing validation when required fields are missing...');
  try {
    const incompletePayload = {
      name: 'Test Incomplete Property',
      // missing type, description, location, price, image
    };

    const res = await fetch(`${baseUrl}/owner/properties`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: partnerCookie,
      },
      body: JSON.stringify(incompletePayload),
    });

    const json = await res.json();
    if (res.status === 400 && json.success === false && json.error) {
      console.log(`✓ PASS: Rejected missing fields with 400 Bad Request: "${json.error}"`);
      passedTests++;
    } else {
      console.error('✗ FAIL: Expected 400 for missing fields, got:', res.status, json);
    }
  } catch (err) {
    console.error('✗ FAIL in Test 2:', err.message);
  }

  // 3. Single image upload via POST /api/upload/image
  console.log('\n[Test 3] Testing image upload via POST /api/upload/image...');
  let uploadedCoverUrl = '';
  try {
    // Create a 1x1 dummy PNG in memory
    const dummyPngBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );

    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    const bodyParts = [
      `--${boundary}\r\n`,
      'Content-Disposition: form-data; name="image"; filename="cover-test.png"\r\n',
      'Content-Type: image/png\r\n\r\n',
      dummyPngBuffer,
      `\r\n--${boundary}\r\n`,
      'Content-Disposition: form-data; name="folder"\r\n\r\n',
      'lama-bhaila/properties\r\n',
      `--${boundary}--\r\n`,
    ];

    const bodyBuffer = Buffer.concat(
      bodyParts.map((part) => (typeof part === 'string' ? Buffer.from(part) : part))
    );

    const uploadRes = await fetch(`${baseUrl}/upload/image`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        Cookie: partnerCookie,
      },
      body: bodyBuffer,
    });

    const uploadJson = await uploadRes.json();
    if (uploadRes.status === 200 && uploadJson.success && uploadJson.data?.url) {
      uploadedCoverUrl = uploadJson.data.url;
      console.log('✓ PASS: Cover image uploaded successfully:');
      console.log('        URL:', uploadedCoverUrl);
      passedTests++;
    } else {
      console.error('✗ FAIL in Test 3: Upload response:', uploadRes.status, uploadJson);
    }
  } catch (err) {
    console.error('✗ FAIL in Test 3:', err.message);
  }

  // 4. Gallery upload via POST /api/upload/gallery
  console.log('\n[Test 4] Testing gallery photos upload via POST /api/upload/gallery...');
  let uploadedGalleryUrls = [];
  try {
    const dummyPngBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );

    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    const bodyParts = [
      `--${boundary}\r\n`,
      'Content-Disposition: form-data; name="images"; filename="gal1-test.png"\r\n',
      'Content-Type: image/png\r\n\r\n',
      dummyPngBuffer,
      `\r\n--${boundary}\r\n`,
      'Content-Disposition: form-data; name="images"; filename="gal2-test.png"\r\n',
      'Content-Type: image/png\r\n\r\n',
      dummyPngBuffer,
      `\r\n--${boundary}\r\n`,
      'Content-Disposition: form-data; name="category"\r\n\r\n',
      'Gallery\r\n',
      `--${boundary}--\r\n`,
    ];

    const bodyBuffer = Buffer.concat(
      bodyParts.map((part) => (typeof part === 'string' ? Buffer.from(part) : part))
    );

    const galRes = await fetch(`${baseUrl}/upload/gallery`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        Cookie: partnerCookie,
      },
      body: bodyBuffer,
    });

    const galJson = await galRes.json();
    const imagesList = Array.isArray(galJson.data) ? galJson.data : (galJson.data?.images || []);
    if (galRes.status === 200 && galJson.success && imagesList.length > 0) {
      uploadedGalleryUrls = imagesList.map((img) => img.src);
      console.log(`✓ PASS: Gallery uploaded successfully (${uploadedGalleryUrls.length} images)`);
      passedTests++;
    } else {
      console.error('✗ FAIL in Test 4:', galRes.status, galJson);
    }
  } catch (err) {
    console.error('✗ FAIL in Test 4:', err.message);
  }

  // 5. Full Property Creation via POST /api/owner/properties
  console.log('\n[Test 5] Submitting complete Add Property form via POST /api/owner/properties...');
  let createdProperty = null;
  const testPropName = `Lama Alpine Retreat ${Date.now()}`;
  try {
    const fullPayload = {
      name: testPropName,
      type: 'Homestay',
      description: 'A serene Himalayan homestay nestled in the North Sikkim mountains with warm host hospitality.',
      location: {
        district: 'North Sikkim',
        town: 'Lachen',
        address: 'Near Gurudongmar Road, Upper Lachen',
        pincode: '737120',
        coordinates: {
          latitude: 27.7167,
          longitude: 88.5577,
        },
      },
      price: 2800,
      image: uploadedCoverUrl || 'https://images.unsplash.com/photo-1544735716-392fe2489ffa',
      gallery: uploadedGalleryUrls.length > 0
        ? uploadedGalleryUrls
        : ['https://images.unsplash.com/photo-1544735716-392fe2489ffa'],
      amenities: ['Wi-Fi', 'Parking', 'Hot Water', 'Mountain View', 'Breakfast'],
      contactDetails: {
        phone: '9876543210',
        email: 'alpine.host@lama.test',
      },
    };

    const createRes = await fetch(`${baseUrl}/owner/properties`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: partnerCookie,
      },
      body: JSON.stringify(fullPayload),
    });

    const createJson = await createRes.json();
    if (createRes.status === 201 && createJson.success && createJson.data) {
      createdProperty = createJson.data;
      console.log('✓ PASS: Property created successfully with status 201!');
      console.log('        ID:', createdProperty._id);
      console.log('        Name:', createdProperty.name);
      console.log('        Slug:', createdProperty.slug);
      passedTests++;
    } else {
      console.error('✗ FAIL in Test 5:', createRes.status, createJson);
    }
  } catch (err) {
    console.error('✗ FAIL in Test 5:', err.message);
  }

  // 6. Verify Property Status is strictly 'pending'
  console.log('\n[Test 6] Verifying property status is strictly "pending"...');
  if (createdProperty && createdProperty.status === 'pending') {
    console.log(`✓ PASS: Property approval status is strictly "${createdProperty.status}" (Under Admin review)`);
    passedTests++;
  } else {
    console.error('✗ FAIL in Test 6: Expected status "pending", got:', createdProperty?.status);
  }

  // 7. Verify Owner is strictly the authenticated partner
  console.log('\n[Test 7] Verifying property owner is strictly the authenticated partner...');
  const ownerIdStr = createdProperty?.owner?.toString();
  const partnerIdStr = (partnerUser._id || partnerUser.id)?.toString();
  if (ownerIdStr && partnerIdStr && ownerIdStr === partnerIdStr) {
    console.log(`✓ PASS: Property owner (${ownerIdStr}) correctly matches authenticated partner (${partnerIdStr})`);
    passedTests++;
  } else {
    console.error('✗ FAIL in Test 7: Owner mismatch:', { ownerIdStr, partnerIdStr });
  }

  // 8. Verify property appears in GET /api/owner/properties
  console.log('\n[Test 8] Verifying property appears in GET /api/owner/properties list...');
  try {
    const listRes = await fetch(`${baseUrl}/owner/properties`, {
      headers: { Cookie: partnerCookie },
    });
    const listJson = await listRes.json();
    const myProps = listJson.data || [];
    const found = myProps.find((p) => p._id === createdProperty?._id);

    if (listRes.status === 200 && listJson.success && found) {
      console.log('✓ PASS: Newly created property successfully found in partner\'s My Properties list:');
      console.log('        Name:', found.name);
      console.log('        Status:', found.status);
      console.log('        Type:', found.type);
      console.log('        District:', found.location?.district);
      console.log('        Town:', found.location?.town);
      console.log('        Price:', found.price);
      console.log('        Amenities:', found.amenities);
      passedTests++;
    } else {
      console.error('✗ FAIL in Test 8: Created property not found in list.', { found, total: myProps.length });
    }
  } catch (err) {
    console.error('✗ FAIL in Test 8:', err.message);
  }

  console.log('\n================================================================');
  console.log(` TASK 10A TEST RESULTS: ${passedTests} / ${totalTests} TESTS PASSED `);
  console.log('================================================================\n');

  if (passedTests === totalTests) {
    console.log('ALL TASK 10A BACKEND & PARTNER PROPERTY TESTS PASSED! SUCCESS!');
    process.exit(0);
  } else {
    console.error(`FAILED: ${totalTests - passedTests} tests did not pass.`);
    process.exit(1);
  }
}

runTask10ATests();

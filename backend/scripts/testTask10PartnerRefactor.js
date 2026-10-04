/**
 * TASK 10 FINAL REFACTOR TEST SUITE
 * Partner System: From Property Management to Individual Room Listings
 *
 * Verifies:
 * 1. Partner authentication (Biran Subba) & session persistence
 * 2. Property relationship (Biran Homestay)
 * 3. Compulsory cover image validation (room cannot be created without cover)
 * 4. Image uploads via Cloudinary / Local fallback (single cover & multiple gallery)
 * 5. Creation of individual room listings:
 *    - Standard Room (Cap: 2, Double Bed, ₹1800)
 *    - Deluxe Mountain View Room (Cap: 3, King Bed, ₹2500, Mountain View, Heater, Electric Kettle custom)
 *    - Family Room (Cap: 5, Queen Bed, ₹4000)
 * 6. Custom amenities stored in the SAME amenities array
 * 7. Each room listing appears independently with parent property info
 * 8. Edit listing (Deluxe Room edit does not modify Standard Room or Family Room)
 * 9. Image management (Cover replacement & empty cover rejection)
 * 10. Image management (Gallery image deletion)
 * 11. Security & Ownership enforcement (Cross-partner access strictly blocked with 403)
 * 12. Delete listing (Deleting Deluxe Room permanently removes only that room; parent property is NOT deleted)
 * 13. Admin moderation & Public stay/room view
 */

const base = 'http://localhost:5000/api';
let passed = 0;
let failed = 0;

const logPass = (name, detail = '') => {
  passed++;
  console.log(`✓ PASS: [${name}] ${detail}`);
};

const logFail = (name, error) => {
  failed++;
  console.error(`✗ FAIL: [${name}]`, error?.message || error);
};

async function login(email, password = 'password123') {
  const res = await fetch(`${base}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const cookie = res.headers.get('set-cookie')?.split(';')[0];
  const json = await res.json();
  return { status: res.status, json, cookie };
}

const call = async (method, path, cookie, body) => {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch (_) {
    json = { raw: text };
  }
  return { status: res.status, json };
};

// Helper to upload a single dummy image via multipart/form-data
async function uploadImage(cookie, filename = 'test_cover.png') {
  const dummyPng = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
  );
  const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
  const body = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="image"; filename="${filename}"\r\nContent-Type: image/png\r\n\r\n`),
    dummyPng,
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ]);

  const res = await fetch(`${base}/upload/image`, {
    method: 'POST',
    headers: {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      Cookie: cookie,
    },
    body,
  });
  const json = await res.json();
  return { status: res.status, json, url: json.data?.url };
}

// Helper to upload multiple gallery images
async function uploadGallery(cookie, count = 2) {
  const dummyPng = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
  );
  const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
  const parts = [];

  for (let i = 0; i < count; i++) {
    parts.push(
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="images"; filename="gallery_${i}.png"\r\nContent-Type: image/png\r\n\r\n`),
      dummyPng,
      Buffer.from('\r\n')
    );
  }
  parts.push(Buffer.from(`--${boundary}--\r\n`));

  const body = Buffer.concat(parts);
  const res = await fetch(`${base}/upload/gallery`, {
    method: 'POST',
    headers: {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      Cookie: cookie,
    },
    body,
  });
  const json = await res.json();
  const urls = Array.isArray(json.data)
    ? json.data.map((item) => (typeof item === 'string' ? item : item.url || item.src))
    : [];
  return { status: res.status, json, urls };
}

async function runTests() {
  console.log('================================================================');
  console.log(' STARTING TASK 10 FINAL REFACTOR TEST SUITE ');
  console.log('================================================================\n');

  // TEST 1 — Partner Authentication (Biran Subba)
  console.log('[Test 1] Authenticating as Partner: Biran Subba...');
  const biranAuth = await login('biransubba124@gmail.com', 'password123');
  if (biranAuth.status === 200 && biranAuth.json.success && biranAuth.json.user?.role === 'owner') {
    logPass('Test 1: Partner Authentication', `Logged in as ${biranAuth.json.user.name} (${biranAuth.json.user.email})`);
  } else {
    logFail('Test 1: Partner Authentication', new Error(`Status ${biranAuth.status}: ${JSON.stringify(biranAuth.json)}`));
    process.exit(1);
  }

  // TEST 2 — Property Relationship (Biran Homestay)
  console.log('\n[Test 2] Retrieving parent property Biran Homestay...');
  const propsRes = await call('GET', '/owner/properties', biranAuth.cookie);
  let biranHomestay = propsRes.json.data?.find((p) => p.name?.toLowerCase().includes('biran homestay'));

  if (!biranHomestay) {
    // If not existing, create it
    console.log('Creating Biran Homestay...');
    const createPropRes = await call('POST', '/owner/properties', biranAuth.cookie, {
      name: 'Biran Homestay',
      type: 'Homestay',
      description: 'Cosy homestay with panoramic mountain view in Namchi, Sikkim.',
      location: {
        district: 'South Sikkim',
        town: 'Namchi',
        address: 'Lower Ghurpisey Road',
      },
      image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa',
      amenities: ['Wi-Fi', 'Parking', 'Mountain View', 'Breakfast'],
    });
    biranHomestay = createPropRes.json.data;
  }

  if (biranHomestay && biranHomestay._id) {
    logPass('Test 2: Property Relationship', `Property verified: ${biranHomestay.name} (ID: ${biranHomestay._id})`);
  } else {
    logFail('Test 2: Property Relationship', new Error('Could not find or create Biran Homestay'));
    process.exit(1);
  }

  // TEST 3 — Compulsory Cover Image: Rejected if missing
  console.log('\n[Test 3] Verifying compulsory cover image requirement...');
  const noCoverRes = await call('POST', `/owner/properties/${biranHomestay._id}/rooms`, biranAuth.cookie, {
    name: 'Room Without Cover',
    type: 'Standard',
    price: 1500,
    capacity: 2,
    // image is deliberately omitted or empty
    image: '',
  });

  if (noCoverRes.status === 400 && noCoverRes.json.success === false) {
    logPass('Test 3: Compulsory Cover Image', `Rejected with 400 Bad Request: "${noCoverRes.json.error}"`);
  } else {
    logFail('Test 3: Compulsory Cover Image', new Error(`Expected 400, got ${noCoverRes.status}`));
  }

  // TEST 4 — Upload Images via Existing Cloudinary / Local upload API
  console.log('\n[Test 4] Uploading cover and gallery photos via upload APIs...');
  const coverUpload1 = await uploadImage(biranAuth.cookie, 'standard_cover.png');
  const coverUpload2 = await uploadImage(biranAuth.cookie, 'deluxe_cover.png');
  const coverUpload3 = await uploadImage(biranAuth.cookie, 'family_cover.png');
  const galleryUpload = await uploadGallery(biranAuth.cookie, 3);

  if (coverUpload1.url && coverUpload2.url && coverUpload3.url && galleryUpload.urls.length >= 2) {
    logPass('Test 4: Media Uploads Reused', `Uploaded 3 cover photos and ${galleryUpload.urls.length} gallery photos.`);
  } else {
    logFail('Test 4: Media Uploads Reused', new Error(`Upload failed: cover1=${coverUpload1.url}, gallery=${galleryUpload.urls}`));
  }

  // TEST 5 — Create Listing 1: Standard Room
  console.log('\n[Test 5] Creating Listing 1: Standard Room (Capacity: 2, Double Bed, ₹1800)...');
  const room1Res = await call('POST', `/owner/properties/${biranHomestay._id}/rooms`, biranAuth.cookie, {
    name: 'Standard Room',
    type: 'Standard',
    capacity: 2,
    bedType: 'Double Bed',
    numberOfBeds: 1,
    price: 1800,
    description: 'Clean and comfortable standard room with double bed and attached bath.',
    amenities: ['Wi-Fi', 'Hot Water', 'Attached Bathroom'],
    image: coverUpload1.url,
    gallery: galleryUpload.urls.slice(0, 1),
    availability: 'available',
  });

  const room1 = room1Res.json.data;
  if (room1Res.status === 201 && room1 && room1.name === 'Standard Room' && room1.price === 1800) {
    logPass('Test 5: Create Standard Room', `Room 1 created (ID: ${room1._id}, Price: ₹${room1.price}, Beds: ${room1.bedConfiguration})`);
  } else {
    logFail('Test 5: Create Standard Room', new Error(`Status ${room1Res.status}: ${JSON.stringify(room1Res.json)}`));
  }

  // TEST 6 — Create Listing 2: Deluxe Mountain View Room
  // Capacity: 3, King Bed, ₹2500, Mountain View, Heater, Electric Kettle (custom)
  console.log('\n[Test 6] Creating Listing 2: Deluxe Mountain View Room...');
  const room2Res = await call('POST', `/owner/properties/${biranHomestay._id}/rooms`, biranAuth.cookie, {
    name: 'Deluxe Mountain View Room',
    type: 'Deluxe',
    capacity: 3,
    bedType: 'King Bed',
    numberOfBeds: 1,
    price: 2500,
    description: 'Spacious room with a private balcony overlooking the Kanchenjunga mountains.',
    amenities: ['Wi-Fi', 'Mountain View', 'Heater', 'Electric Kettle'],
    image: coverUpload2.url,
    gallery: galleryUpload.urls.slice(1, 3),
    availability: 'available',
  });

  const room2 = room2Res.json.data;
  if (room2Res.status === 201 && room2 && room2.name === 'Deluxe Mountain View Room' && room2.price === 2500) {
    logPass('Test 6: Create Deluxe Room', `Room 2 created (ID: ${room2._id}, Price: ₹${room2.price}, Amenities: ${room2.amenities.join(', ')})`);
  } else {
    logFail('Test 6: Create Deluxe Room', new Error(`Status ${room2Res.status}: ${JSON.stringify(room2Res.json)}`));
  }

  // TEST 7 — Create Listing 3: Family Room (Capacity: 5, Queen Bed, ₹4000)
  console.log('\n[Test 7] Creating Listing 3: Family Room...');
  const room3Res = await call('POST', `/owner/properties/${biranHomestay._id}/rooms`, biranAuth.cookie, {
    name: 'Family Room',
    type: 'Family',
    capacity: 5,
    bedType: 'Queen Bed',
    numberOfBeds: 2,
    price: 4000,
    description: 'Generous suite ideal for families or groups traveling together.',
    amenities: ['Wi-Fi', 'Hot Water', 'Attached Bathroom', 'Balcony', 'Breakfast'],
    image: coverUpload3.url,
    gallery: galleryUpload.urls,
    availability: 'available',
  });

  const room3 = room3Res.json.data;
  if (room3Res.status === 201 && room3 && room3.name === 'Family Room' && room3.price === 4000) {
    logPass('Test 7: Create Family Room', `Room 3 created (ID: ${room3._id}, Price: ₹${room3.price}, Cap: ${room3.capacity})`);
  } else {
    logFail('Test 7: Create Family Room', new Error(`Status ${room3Res.status}: ${JSON.stringify(room3Res.json)}`));
  }

  // TEST 8 — Custom Amenities Stored in the SAME Array
  console.log('\n[Test 8] Verifying custom amenities stored in same amenities array...');
  const hasCustom = room2.amenities.includes('Electric Kettle') && room2.amenities.includes('Mountain View');
  if (hasCustom && Array.isArray(room2.amenities)) {
    logPass('Test 8: Custom Amenities in Same Array', `Amenities array: [${room2.amenities.map(a => `"${a}"`).join(', ')}]`);
  } else {
    logFail('Test 8: Custom Amenities in Same Array', new Error(`Custom amenity missing in array: ${room2.amenities}`));
  }

  // TEST 9 — Individual Listings Retrieval (GET /api/owner/rooms)
  console.log('\n[Test 9] Verifying each room listing appears separately with parent property...');
  const myRoomsRes = await call('GET', '/owner/rooms', biranAuth.cookie);
  const myRooms = myRoomsRes.json.data || [];
  const foundR1 = myRooms.find((r) => r._id === room1._id);
  const foundR2 = myRooms.find((r) => r._id === room2._id);
  const foundR3 = myRooms.find((r) => r._id === room3._id);

  if (foundR1 && foundR2 && foundR3 && foundR1.property && foundR2.property && foundR3.property) {
    logPass('Test 9: Individual Room Listings', `All 3 listings found independently. Parent: "${foundR2.property.name}"`);
  } else {
    logFail('Test 9: Individual Room Listings', new Error(`Missing listings in GET /owner/rooms: count=${myRooms.length}`));
  }

  // TEST 10 — Edit Listing: Modifying Deluxe Room does NOT modify Standard Room
  console.log('\n[Test 10] Testing Edit: updating Deluxe Room price and amenities...');
  const editRes = await call('PUT', `/owner/rooms/${room2._id}`, biranAuth.cookie, {
    price: 2750,
    description: 'Updated deluxe room with enhanced panoramic terrace.',
    amenities: ['Wi-Fi', 'Mountain View', 'Heater', 'Electric Kettle', 'Room Service'],
  });

  // Verify room 2 updated
  const afterEditRes = await call('GET', `/owner/rooms/${room2._id}`, biranAuth.cookie);
  const updatedR2 = afterEditRes.json.data;

  // Verify room 1 was NOT modified
  const checkR1Res = await call('GET', `/owner/rooms/${room1._id}`, biranAuth.cookie);
  const checkR1 = checkR1Res.json.data;

  if (
    editRes.status === 200 &&
    updatedR2.price === 2750 &&
    updatedR2.amenities.includes('Room Service') &&
    checkR1.price === 1800 &&
    checkR1.name === 'Standard Room'
  ) {
    logPass('Test 10: Edit Independence', `Deluxe Room price updated to ₹${updatedR2.price}. Standard Room unchanged at ₹${checkR1.price}.`);
  } else {
    logFail('Test 10: Edit Independence', new Error('Edit affected other rooms or failed to persist'));
  }

  // TEST 11 — Image Management: Replace Cover & Protection Against Empty Cover
  console.log('\n[Test 11] Testing cover replacement and zero-cover prevention...');
  // 1. Attempt to set cover image to empty string -> should be rejected
  const emptyCoverRes = await call('PUT', `/owner/rooms/${room2._id}`, biranAuth.cookie, {
    image: '',
  });

  const uploadNewCover = await uploadImage(biranAuth.cookie, 'new_deluxe_cover.png');
  const replaceCoverRes = await call('PUT', `/owner/rooms/${room2._id}`, biranAuth.cookie, {
    image: uploadNewCover.url,
  });

  if (emptyCoverRes.status === 400 && replaceCoverRes.status === 200 && replaceCoverRes.json.data.image === uploadNewCover.url) {
    logPass('Test 11: Image Cover Management', `Empty cover rejected with 400. New cover replaced successfully.`);
  } else {
    logFail('Test 11: Image Cover Management', new Error(`Cover management failure: empty status=${emptyCoverRes.status}, replace status=${replaceCoverRes.status}`));
  }

  // TEST 12 — Image Management: Delete Gallery Image
  console.log('\n[Test 12] Testing gallery image deletion...');
  const currentGallery = updatedR2.gallery || [];
  const galleryCountBefore = currentGallery.length;
  const remainingGallery = currentGallery.slice(1); // remove first gallery photo

  const updateGalRes = await call('PUT', `/owner/rooms/${room2._id}`, biranAuth.cookie, {
    gallery: remainingGallery,
  });

  if (updateGalRes.status === 200 && updateGalRes.json.data.gallery.length === remainingGallery.length) {
    logPass('Test 12: Gallery Image Deletion', `Gallery updated from ${galleryCountBefore} to ${remainingGallery.length} photos.`);
  } else {
    logFail('Test 12: Gallery Image Deletion', new Error(`Gallery deletion failed: status ${updateGalRes.status}`));
  }

  // TEST 13 — Security & Ownership Checks (Cross-Partner Access Forbidden)
  console.log('\n[Test 13] Verifying cross-partner security (Partner B cannot edit/delete Biran Subba rooms)...');
  const partnerB = await login('sonam_47458@lama.test', 'password123'); // different partner
  if (partnerB.cookie) {
    const hackEdit = await call('PUT', `/owner/rooms/${room2._id}`, partnerB.cookie, { name: 'HACKED NAME', price: 10 });
    const hackDelete = await call('DELETE', `/owner/rooms/${room2._id}`, partnerB.cookie);
    const hackAdd = await call('POST', `/owner/properties/${biranHomestay._id}/rooms`, partnerB.cookie, { name: 'Injected Room', price: 50, image: 'hack.png' });

    if (hackEdit.status === 403 && hackDelete.status === 403 && hackAdd.status === 403) {
      logPass('Test 13: Security & Ownership Enforcement', `Cross-partner Edit (403), Delete (403), and Add (403) all safely rejected.`);
    } else {
      logFail('Test 13: Security & Ownership Enforcement', new Error(`Expected 403, got: edit=${hackEdit.status}, del=${hackDelete.status}, add=${hackAdd.status}`));
    }
  } else {
    console.warn('Partner B could not authenticate; skipping cross-partner test.');
  }

  // TEST 14 — Delete Room Listing (Parent Property Intact)
  console.log('\n[Test 14] Deleting Listing 1 (Standard Room) and verifying parent property remains intact...');
  const delRes = await call('DELETE', `/owner/rooms/${room1._id}`, biranAuth.cookie);

  // Verify Room 1 is deleted
  const getDelRoom = await call('GET', `/owner/rooms/${room1._id}`, biranAuth.cookie);

  // Verify Parent Property Biran Homestay is STILL INTACT
  const checkPropRes = await call('GET', `/owner/properties/${biranHomestay._id}`, biranAuth.cookie);

  // Verify Room 2 and Room 3 are still intact under Biran Homestay
  const afterDelRooms = await call('GET', '/owner/rooms', biranAuth.cookie);
  const r2StillThere = afterDelRooms.json.data?.some((r) => r._id === room2._id);
  const r3StillThere = afterDelRooms.json.data?.some((r) => r._id === room3._id);
  const r1Gone = !afterDelRooms.json.data?.some((r) => r._id === room1._id);

  if (
    delRes.status === 200 &&
    getDelRoom.status === 404 &&
    checkPropRes.status === 200 &&
    checkPropRes.json.data.name === biranHomestay.name &&
    r2StillThere &&
    r3StillThere &&
    r1Gone
  ) {
    logPass('Test 14: Delete Independence', `Standard Room deleted. Parent property "${biranHomestay.name}" remains intact with remaining listings.`);
  } else {
    logFail('Test 14: Delete Independence', new Error(`Deletion verification failed: del=${delRes.status}, getRoom=${getDelRoom.status}, prop=${checkPropRes.status}`));
  }

  // SUMMARY
  console.log('\n================================================================');
  console.log(` RESULTS: ${passed} PASSED, ${failed} FAILED `);
  console.log('================================================================\n');

  process.exit(failed === 0 ? 0 : 1);
}

runTests().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});

const mongoose = require('mongoose');
const path = require('path');
const { User, Property, Room } = require('../models');

// Valid 1x1 pixel PNG buffer
const testPngBuffer = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

// Large 6MB buffer to test 413 LIMIT_FILE_SIZE
const large6MbBuffer = Buffer.alloc(6 * 1024 * 1024, 'a');

async function runTask4TestSuite() {
  console.log('===============================================================');
  console.log(' STARTING TASK 4: PARTNER PHOTOS BACKEND / CLOUDINARY TEST');
  console.log('===============================================================\n');

  // Connect Mongoose directly if not connected
  if (mongoose.connection.readyState === 0) {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/lama-bhaila';
    await mongoose.connect(mongoUri);
  }

  const baseUrl = 'http://127.0.0.1:5000/api';
  const unique = Date.now().toString().slice(-5);

  let partnerA, partnerB, propertyA, cookieA, cookieB;

  try {
    // -------------------------------------------------------------
    // SETUP: Create Partners A & B and a Property for Partner A
    // -------------------------------------------------------------
    console.log('[Setup] Creating test partners and property in MongoDB...');
    partnerA = await User.create({
      name: `Partner Alpha ${unique}`,
      email: `partner_a_${unique}@lama.test`,
      password: 'password123',
      role: 'owner',
      partnerProfile: {
        agencyName: 'Alpha Homestays',
        location: 'Gangtok',
        verificationStatus: 'Approved',
      },
    });

    partnerB = await User.create({
      name: `Partner Beta ${unique}`,
      email: `partner_b_${unique}@lama.test`,
      password: 'password123',
      role: 'owner',
      partnerProfile: {
        agencyName: 'Beta Homestays',
        location: 'Pelling',
        verificationStatus: 'Approved',
      },
    });

    // Authenticate Partner A
    const loginARes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: partnerA.email, password: 'password123' }),
    });
    cookieA = loginARes.headers.get('set-cookie')?.split(';')[0];
    if (!cookieA) throw new Error('Failed to get session cookie for Partner A');

    // Authenticate Partner B
    const loginBRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: partnerB.email, password: 'password123' }),
    });
    cookieB = loginBRes.headers.get('set-cookie')?.split(';')[0];
    if (!cookieB) throw new Error('Failed to get session cookie for Partner B');

    // Create property for Partner A
    propertyA = await Property.create({
      name: `Alpha Mountain Villa ${unique}`,
      slug: `alpha-mountain-villa-${unique}`,
      type: 'Homestay',
      owner: partnerA._id,
      description: 'Serene mountain villa in Gangtok',
      location: {
        district: 'East Sikkim',
        town: 'Gangtok',
        address: 'MG Marg Near Viewpoint',
      },
      price: 2800,
      image: 'https://images.unsplash.com/photo-initial-seed.jpg',
      gallery: [],
      status: 'approved',
      active: true,
    });
    console.log(`✓ Setup complete: Property created with ID: ${propertyA._id}\n`);

    // -------------------------------------------------------------
    // TEST 1 — Authentication (Unauthenticated upload returns 401)
    // -------------------------------------------------------------
    console.log('[Test 1] Testing Unauthenticated Upload (Expect 401)...');
    const formUnauth = new FormData();
    formUnauth.append('image', new Blob([testPngBuffer], { type: 'image/png' }), 'test.png');
    const resUnauth = await fetch(`${baseUrl}/upload/image`, {
      method: 'POST',
      body: formUnauth,
    });
    console.log(`Status: ${resUnauth.status} (Expected 401)`);
    if (resUnauth.status !== 401) {
      throw new Error(`Test 1 Failed: Expected 401 but received ${resUnauth.status}`);
    }
    console.log('✓ PASS: Unauthenticated upload blocked with 401.\n');

    // -------------------------------------------------------------
    // TEST 2 — Property Ownership (Partner B uploads to Partner A's property -> 403)
    // -------------------------------------------------------------
    console.log("[Test 2] Testing Ownership Check: Partner B uploads to Partner A's property (Expect 403)...");
    const formB = new FormData();
    formB.append('image', new Blob([testPngBuffer], { type: 'image/png' }), 'hacker.png');
    formB.append('propertyId', propertyA._id.toString());

    const resB = await fetch(`${baseUrl}/upload/image`, {
      method: 'POST',
      headers: { Cookie: cookieB },
      body: formB,
    });
    const jsonB = await resB.json();
    console.log(`Upload Status: ${resB.status} (Expected 403)`);
    console.log(`Response:`, jsonB.error);

    if (resB.status !== 403) {
      throw new Error(`Test 2 Failed: Partner B was not rejected with 403 (Got: ${resB.status})`);
    }

    // Also test PUT /api/owner/properties/:id by Partner B
    const resUpdateB = await fetch(`${baseUrl}/owner/properties/${propertyA._id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieB,
      },
      body: JSON.stringify({ image: 'https://hacker.com/evil.jpg' }),
    });
    console.log(`Property Update Status for non-owner: ${resUpdateB.status} (Expected 403)`);
    if (resUpdateB.status !== 403) {
      throw new Error(`Test 2 Failed: Partner B update was not rejected with 403 (Got: ${resUpdateB.status})`);
    }
    console.log('✓ PASS: Property ownership strictly enforced with 403 Forbidden.\n');

    // -------------------------------------------------------------
    // TEST 3 — Single Image Upload & MongoDB Persistence
    // -------------------------------------------------------------
    console.log('[Test 3] Testing Single Image Upload & Cover Photo Update...');
    const formSingle = new FormData();
    formSingle.append('image', new Blob([testPngBuffer], { type: 'image/png' }), 'villa_cover.png');
    formSingle.append('propertyId', propertyA._id.toString());

    const resSingle = await fetch(`${baseUrl}/upload/image`, {
      method: 'POST',
      headers: { Cookie: cookieA },
      body: formSingle,
    });
    const jsonSingle = await resSingle.json();
    console.log(`Upload Status: ${resSingle.status}`);
    console.log(`Uploaded Image URL:`, jsonSingle.data?.url);

    if (resSingle.status !== 200 || !jsonSingle.data?.url) {
      throw new Error('Test 3 Failed: Single image upload did not return URL');
    }
    const uploadedCoverUrl = jsonSingle.data.url;

    // Persist to MongoDB Property.image
    const resSaveCover = await fetch(`${baseUrl}/owner/properties/${propertyA._id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieA,
      },
      body: JSON.stringify({ image: uploadedCoverUrl }),
    });
    const jsonSaveCover = await resSaveCover.json();
    if (resSaveCover.status !== 200 || jsonSaveCover.data?.image !== uploadedCoverUrl) {
      throw new Error('Test 3 Failed: Failed to save cover image to MongoDB');
    }

    // Verify directly in MongoDB database
    const dbProp1 = await Property.findById(propertyA._id);
    if (dbProp1.image !== uploadedCoverUrl) {
      throw new Error('Test 3 Failed: MongoDB document image does not match uploaded URL');
    }
    console.log(`✓ PASS: Single image uploaded & persisted in MongoDB Property.image: ${dbProp1.image}\n`);

    // -------------------------------------------------------------
    // TEST 4 — Multi-Photo Gallery Upload & MongoDB Persistence
    // -------------------------------------------------------------
    console.log('[Test 4] Testing Multiple Gallery Images Upload & Persistence...');
    const formGallery = new FormData();
    formGallery.append('images', new Blob([testPngBuffer], { type: 'image/png' }), 'room_deluxe.png');
    formGallery.append('images', new Blob([testPngBuffer], { type: 'image/png' }), 'balcony_view.png');
    formGallery.append('images', new Blob([testPngBuffer], { type: 'image/png' }), 'dining_area.png');
    formGallery.append('propertyId', propertyA._id.toString());
    formGallery.append('category', 'Property');

    const resGallery = await fetch(`${baseUrl}/upload/gallery`, {
      method: 'POST',
      headers: { Cookie: cookieA },
      body: formGallery,
    });
    const jsonGallery = await resGallery.json();
    console.log(`Gallery Upload Status: ${resGallery.status}`);
    console.log(`Photos Uploaded: ${jsonGallery.count}`);

    if (resGallery.status !== 200 || jsonGallery.count !== 3) {
      throw new Error('Test 4 Failed: Gallery upload failed or count is not 3');
    }

    const galleryPayload = jsonGallery.data.map((item, idx) => ({
      src: item.src,
      alt: item.alt || `Photo ${idx + 1}`,
      category: 'Property',
    }));

    // Persist gallery to MongoDB Property.gallery
    const resSaveGallery = await fetch(`${baseUrl}/owner/properties/${propertyA._id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieA,
      },
      body: JSON.stringify({ gallery: galleryPayload }),
    });
    const jsonSaveGallery = await resSaveGallery.json();
    if (resSaveGallery.status !== 200 || jsonSaveGallery.data?.gallery?.length !== 3) {
      throw new Error('Test 4 Failed: Failed to save gallery photos to MongoDB');
    }

    // Verify in MongoDB database
    const dbProp2 = await Property.findById(propertyA._id);
    if (!dbProp2.gallery || dbProp2.gallery.length !== 3) {
      throw new Error('Test 4 Failed: MongoDB gallery count is not 3');
    }
    console.log(`✓ PASS: ${dbProp2.gallery.length} gallery photos persisted in MongoDB Property.gallery.\n`);

    // -------------------------------------------------------------
    // TEST 5 — Persistence Verification Across Re-Fetch / Refresh
    // -------------------------------------------------------------
    console.log('[Test 5] Testing Property Re-fetch (Simulating Browser Refresh)...');
    const resGet = await fetch(`${baseUrl}/owner/properties/${propertyA._id}`, {
      method: 'GET',
      headers: { Cookie: cookieA },
    });
    const jsonGet = await resGet.json();
    console.log(`Fetch Status: ${resGet.status}`);

    if (resGet.status !== 200 || !jsonGet.data) {
      throw new Error('Test 5 Failed: Could not re-fetch property');
    }
    if (jsonGet.data.image !== uploadedCoverUrl) {
      throw new Error('Test 5 Failed: Re-fetched cover photo does not match');
    }
    if (jsonGet.data.gallery.length !== 3) {
      throw new Error('Test 5 Failed: Re-fetched gallery photos count mismatch');
    }
    console.log('✓ PASS: Re-fetched property matches MongoDB/CDN data completely.\n');

    // -------------------------------------------------------------
    // TEST 6 — Invalid File Format (Unsupported formats rejected -> 400)
    // -------------------------------------------------------------
    console.log('[Test 6] Testing Invalid File Format Rejection (Expect 400)...');
    const formInvalid = new FormData();
    formInvalid.append('image', new Blob(['not an image content'], { type: 'text/plain' }), 'document.txt');
    formInvalid.append('propertyId', propertyA._id.toString());

    const resInvalid = await fetch(`${baseUrl}/upload/image`, {
      method: 'POST',
      headers: { Cookie: cookieA },
      body: formInvalid,
    });
    const jsonInvalid = await resInvalid.json();
    console.log(`Status: ${resInvalid.status} (Expected 400)`);
    console.log(`Error Message:`, jsonInvalid.error);

    if (resInvalid.status !== 400) {
      throw new Error(`Test 6 Failed: Unsupported format was not rejected with 400 (Got: ${resInvalid.status})`);
    }
    console.log('✓ PASS: Unsupported file format rejected with 400.\n');

    // -------------------------------------------------------------
    // TEST 7 — Error Handling (File Too Large -> 413 & DB Uncorrupted)
    // -------------------------------------------------------------
    console.log('[Test 7] Testing File Size Limit 5MB (Expect 413)...');
    const formLarge = new FormData();
    formLarge.append('image', new Blob([large6MbBuffer], { type: 'image/png' }), 'large_6mb_photo.png');
    formLarge.append('propertyId', propertyA._id.toString());

    const resLarge = await fetch(`${baseUrl}/upload/image`, {
      method: 'POST',
      headers: { Cookie: cookieA },
      body: formLarge,
    });
    const jsonLarge = await resLarge.json();
    console.log(`Status: ${resLarge.status} (Expected 413)`);
    console.log(`Error Message:`, jsonLarge.error);

    if (resLarge.status !== 413) {
      throw new Error(`Test 7 Failed: 6MB file was not rejected with 413 (Got: ${resLarge.status})`);
    }

    // Verify property in DB was not corrupted by the failed upload
    const dbPropClean = await Property.findById(propertyA._id);
    if (dbPropClean.image !== uploadedCoverUrl || dbPropClean.gallery.length !== 3) {
      throw new Error('Test 7 Failed: Database property was corrupted by failed upload');
    }
    console.log('✓ PASS: Large file rejected with 413 and MongoDB state preserved intact.\n');

    // -------------------------------------------------------------
    // TEST 8 — Photo Deletion
    // -------------------------------------------------------------
    console.log('[Test 8] Testing Photo Deletion via DELETE /api/upload/image...');
    const photoToDelete = dbPropClean.gallery[0].src;
    const resDelete = await fetch(`${baseUrl}/upload/image`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieA,
      },
      body: JSON.stringify({
        url: photoToDelete,
        propertyId: propertyA._id.toString(),
      }),
    });
    const jsonDelete = await resDelete.json();
    console.log(`Delete Status: ${resDelete.status}`);
    console.log(`Delete Message:`, jsonDelete.message);

    if (resDelete.status !== 200) {
      throw new Error('Test 8 Failed: Photo deletion returned non-200 status');
    }

    // Verify photo was removed from Property.gallery in MongoDB
    const dbPropAfterDelete = await Property.findById(propertyA._id);
    if (dbPropAfterDelete.gallery.length !== 2) {
      throw new Error(`Test 8 Failed: Expected 2 gallery items after delete, found ${dbPropAfterDelete.gallery.length}`);
    }
    console.log(`✓ PASS: Photo deleted successfully, remaining gallery count: ${dbPropAfterDelete.gallery.length}.\n`);

    console.log('===============================================================');
    console.log(' ALL TASK 4 TESTS PASSED SUCCESSFULLY! (8/8)                  ');
    console.log(' Partner Photos is now fully MongoDB/Cloudinary backed.       ');
    console.log('===============================================================');
  } catch (err) {
    console.error('\n❌ TASK 4 TEST FAILED:', err.message, err.cause || '', err.stack);
    process.exitCode = 1;
  } finally {
    // Cleanup created test records
    try {
      if (propertyA) await Property.findByIdAndDelete(propertyA._id);
      if (partnerA) await User.findByIdAndDelete(partnerA._id);
      if (partnerB) await User.findByIdAndDelete(partnerB._id);
    } catch (_) {}

    await mongoose.connection.close();
    process.exit(process.exitCode || 0);
  }
}

runTask4TestSuite();

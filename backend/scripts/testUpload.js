const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { User } = require('../models');

// 1x1 pixel valid PNG buffer in base64
const testPngBuffer = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

async function testUploadPipeline() {
  console.log('--- Starting Phase 9: Multer + Cloudinary / Local Upload Test Suite ---');
  const { server } = require('../server');

  // Wait 1.5s for DB connection
  await new Promise((r) => setTimeout(r, 1500));

  const authUrl = 'http://localhost:5000/api/auth';
  const uploadUrl = 'http://localhost:5000/api/upload';
  const unique = Date.now().toString().slice(-5);

  try {
    // 1. Create & Authenticate user
    const uploaderUser = await User.create({
      name: 'Media Host',
      email: `uploader_${unique}@lama.test`,
      password: 'password123',
      role: 'owner',
    });

    const loginRes = await fetch(`${authUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: uploaderUser.email,
        password: 'password123',
      }),
    });
    const cookie = loginRes.headers.get('set-cookie')?.split(';')[0];
    console.log('User Authenticated:', uploaderUser.email);

    // TEST 1: Unauthenticated upload attempt (Expect 401)
    console.log('\n[1] Testing Unauthenticated upload (Expect 401)...');
    const unauthForm = new FormData();
    unauthForm.append('image', new Blob([testPngBuffer], { type: 'image/png' }), 'test.png');
    const unauthRes = await fetch(`${uploadUrl}/image`, {
      method: 'POST',
      body: unauthForm,
    });
    console.log('Status:', unauthRes.status);
    if (unauthRes.status !== 401) throw new Error('Unauthenticated upload was not blocked');
    console.log('✓ Authentication guard verified.');

    // TEST 2: Single Image Upload
    console.log('\n[2] Testing POST /api/upload/image (Single image upload)...');
    const singleForm = new FormData();
    singleForm.append('image', new Blob([testPngBuffer], { type: 'image/png' }), 'homestay_cover.png');
    singleForm.append('folder', 'lama-bhaila/stays');

    const singleRes = await fetch(`${uploadUrl}/image`, {
      method: 'POST',
      headers: { Cookie: cookie },
      body: singleForm,
    });
    const singleJson = await singleRes.json();
    console.log('Status:', singleRes.status);
    console.log('Response:', JSON.stringify(singleJson, null, 2));

    if (singleRes.status !== 200 || !singleJson.data?.url) {
      throw new Error('Single image upload failed');
    }
    const uploadedUrl = singleJson.data.url;
    console.log('✓ Single image uploaded successfully. URL:', uploadedUrl);

    // TEST 3: Static Asset Serving Verification
    console.log(`\n[3] Testing HTTP GET retrieval of uploaded asset from: ${uploadedUrl}...`);
    const fetchAssetRes = await fetch(uploadedUrl);
    console.log('Static Serve Status:', fetchAssetRes.status);
    console.log('Content-Type:', fetchAssetRes.headers.get('content-type'));
    if (fetchAssetRes.status !== 200) {
      throw new Error(`Failed to retrieve uploaded image from static server: ${fetchAssetRes.status}`);
    }
    console.log('✓ Static asset serving verified.');

    // TEST 4: Multiple Gallery Images Upload
    console.log('\n[4] Testing POST /api/upload/gallery (Multiple gallery photos)...');
    const galleryForm = new FormData();
    galleryForm.append('images', new Blob([testPngBuffer], { type: 'image/png' }), 'gallery_room1.png');
    galleryForm.append('images', new Blob([testPngBuffer], { type: 'image/png' }), 'gallery_room2.png');
    galleryForm.append('images', new Blob([testPngBuffer], { type: 'image/png' }), 'gallery_view.png');
    galleryForm.append('category', 'Room');

    const galleryRes = await fetch(`${uploadUrl}/gallery`, {
      method: 'POST',
      headers: { Cookie: cookie },
      body: galleryForm,
    });
    const galleryJson = await galleryRes.json();
    console.log('Status:', galleryRes.status);
    console.log(`Successfully uploaded ${galleryJson.count} gallery photos`);
    console.log('Sample Photo Object:', JSON.stringify(galleryJson.data?.[0], null, 2));

    if (galleryRes.status !== 200 || galleryJson.count !== 3) {
      throw new Error('Gallery photos upload failed');
    }
    console.log('✓ Multi-photo gallery upload verified.');

    console.log('\n======================================================');
    console.log(' ALL IMAGE UPLOAD TESTS PASSED SUCCESSFULLY (4/4)!    ');
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

testUploadPipeline();

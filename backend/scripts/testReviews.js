const mongoose = require('mongoose');
const { User, Property, Review } = require('../models');

async function testReviewPipeline() {
  console.log('--- Starting Phase 11: Property Review & Rating System Test Suite ---');
  const { server } = require('../server');

  // Wait 1.5s for DB connection
  await new Promise((r) => setTimeout(r, 1500));

  const authUrl = 'http://localhost:5000/api/auth';
  const propUrl = 'http://localhost:5000/api/properties';
  const reviewUrl = 'http://localhost:5000/api/reviews';
  const adminUrl = 'http://localhost:5000/api/admin';
  const unique = Date.now().toString().slice(-5);

  try {
    // 1. Create Admin
    const adminUser = await User.create({
      name: 'Review Admin',
      email: `admin_rev_${unique}@lama.test`,
      password: 'password123',
      role: 'admin',
    });
    const adminLoginRes = await fetch(`${authUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminUser.email, password: 'password123' }),
    });
    const adminCookie = adminLoginRes.headers.get('set-cookie')?.split(';')[0];

    // 2. Create Owner & Property
    const ownerUser = await User.create({
      name: 'Lobsang Host',
      email: `owner_rev_${unique}@lama.test`,
      password: 'password123',
      role: 'owner',
    });

    const testProperty = await Property.create({
      name: 'Yuksom Heritage Homestay',
      slug: `yuksom-heritage-homestay-${unique}`,
      type: 'Homestay',
      owner: ownerUser._id,
      description: 'Historical retreat in ancient Yuksom.',
      location: { district: 'West Sikkim', town: 'Yuksom' },
      price: 2200,
      image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb',
      status: 'approved',
      active: true,
      rating: 0,
      numReviews: 0,
    });
    const propId = testProperty._id.toString();

    // 3. Create Tourist A and Tourist B
    const touristA = await User.create({
      name: 'Ananya Roy',
      email: `ananya_${unique}@lama.test`,
      password: 'password123',
      role: 'tourist',
    });
    const loginARes = await fetch(`${authUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: touristA.email, password: 'password123' }),
    });
    const cookieA = loginARes.headers.get('set-cookie')?.split(';')[0];

    const touristB = await User.create({
      name: 'Rohan Sen',
      email: `rohan_${unique}@lama.test`,
      password: 'password123',
      role: 'tourist',
    });
    const loginBRes = await fetch(`${authUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: touristB.email, password: 'password123' }),
    });
    const cookieB = loginBRes.headers.get('set-cookie')?.split(';')[0];

    // TEST 1: Unauthenticated review attempt
    console.log('\n[1] Testing Unauthenticated review submission (Expect 401)...');
    const unauthRes = await fetch(`${propUrl}/${propId}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating: 5, comment: 'Amazing place!' }),
    });
    console.log('Status:', unauthRes.status);
    if (unauthRes.status !== 401) throw new Error('Unauthenticated review was not blocked');
    console.log('✓ Authentication guard verified.');

    // TEST 2: Tourist A submits 5-star review
    console.log('\n[2] Testing Tourist A submitting 5-star review...');
    const reviewARes = await fetch(`${propUrl}/${propId}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieA },
      body: JSON.stringify({ rating: 5, comment: 'Magical mountain views and warm hosts!' }),
    });
    const reviewAJson = await reviewARes.json();
    console.log('Status:', reviewARes.status);
    console.log('Review ID:', reviewAJson.data?._id);
    console.log('Recalculated Rating:', reviewAJson.propertyRating?.rating);
    console.log('Total Reviews:', reviewAJson.propertyRating?.numReviews);

    if (reviewARes.status !== 201 || reviewAJson.propertyRating?.rating !== 5) {
      throw new Error('5-star review creation and rating recalculation failed');
    }
    const reviewAId = reviewAJson.data._id;
    console.log('✓ 5-star review and real-time average aggregation verified.');

    // TEST 3: Duplicate review prevention (Tourist A tries again)
    console.log('\n[3] Testing duplicate review prevention for same tourist (Expect 400)...');
    const dupRes = await fetch(`${propUrl}/${propId}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieA },
      body: JSON.stringify({ rating: 4, comment: 'Second review' }),
    });
    console.log('Status:', dupRes.status);
    if (dupRes.status !== 400) throw new Error('Duplicate review was not blocked');
    console.log('✓ Duplicate review prevention verified.');

    // TEST 4: Tourist B submits 4-star review
    console.log('\n[4] Testing Tourist B submitting 4-star review...');
    const reviewBRes = await fetch(`${propUrl}/${propId}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieB },
      body: JSON.stringify({ rating: 4, comment: 'Clean rooms and great local food.' }),
    });
    const reviewBJson = await reviewBRes.json();
    console.log('Status:', reviewBRes.status);
    console.log('Updated Average Rating:', reviewBJson.propertyRating?.rating);
    console.log('Total Reviews:', reviewBJson.propertyRating?.numReviews);

    // (5 + 4) / 2 = 4.5
    if (reviewBJson.propertyRating?.rating !== 4.5 || reviewBJson.propertyRating?.numReviews !== 2) {
      throw new Error(`Expected average 4.5 with 2 reviews, got: ${reviewBJson.propertyRating?.rating}`);
    }
    const reviewBId = reviewBJson.data._id;
    console.log('✓ Multi-review average aggregation verified (4.5 stars).');

    // TEST 5: Public review listing
    console.log(`\n[5] Testing GET /api/properties/${propId}/reviews (Public view)...`);
    const listRes = await fetch(`${propUrl}/${propId}/reviews`);
    const listJson = await listRes.json();
    console.log('Status:', listRes.status);
    console.log('Approved Reviews Found:', listJson.count);
    if (listJson.count !== 2) throw new Error('Public review query returned incorrect count');
    console.log('✓ Public review directory verified.');

    // TEST 6: Tourist B edits review to 2 stars
    console.log(`\n[6] Testing Tourist B updating review to 2 stars (PUT /api/reviews/${reviewBId})...`);
    const editRes = await fetch(`${reviewUrl}/${reviewBId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: cookieB },
      body: JSON.stringify({ rating: 2, comment: 'Updated: Water was cold on morning 2.' }),
    });
    const editJson = await editRes.json();
    console.log('Status:', editRes.status);
    console.log('Recalculated Rating after edit:', editJson.propertyRating?.rating);
    // (5 + 2) / 2 = 3.5
    if (editJson.propertyRating?.rating !== 3.5) {
      throw new Error(`Expected 3.5 rating after update, got: ${editJson.propertyRating?.rating}`);
    }
    console.log('✓ Real-time rating aggregation on review update verified (3.5 stars).');

    // TEST 7: Admin hides review B via moderation
    console.log(`\n[7] Testing Admin hiding review B (PATCH /api/admin/reviews/${reviewBId}/moderation)...`);
    const modRes = await fetch(`${adminUrl}/reviews/${reviewBId}/moderation`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({ isApproved: false }),
    });
    const modJson = await modRes.json();
    console.log('Status:', modRes.status);
    console.log('Rating after hiding Review B:', modJson.propertyRating?.rating);
    // Now only Review A (5 stars) is active
    if (modJson.propertyRating?.rating !== 5 || modJson.propertyRating?.numReviews !== 1) {
      throw new Error('Rating recalculation failed after admin review moderation');
    }
    console.log('✓ Admin moderation & selective aggregation verified.');

    // TEST 8: Tourist A deletes review
    console.log(`\n[8] Testing Tourist A deleting review (DELETE /api/reviews/${reviewAId})...`);
    const delRes = await fetch(`${reviewUrl}/${reviewAId}`, {
      method: 'DELETE',
      headers: { Cookie: cookieA },
    });
    const delJson = await delRes.json();
    console.log('Status:', delRes.status);
    console.log('Rating after delete:', delJson.propertyRating?.rating);
    console.log('Reviews count after delete:', delJson.propertyRating?.numReviews);

    // All active reviews removed, rating should reset to 0
    if (delJson.propertyRating?.rating !== 0 || delJson.propertyRating?.numReviews !== 0) {
      throw new Error('Rating reset failed on review deletion');
    }
    console.log('✓ Rating reset to 0 on review deletion verified.');

    console.log('\n======================================================');
    console.log(' ALL REVIEW & RATING TESTS PASSED (8/8)!              ');
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

testReviewPipeline();

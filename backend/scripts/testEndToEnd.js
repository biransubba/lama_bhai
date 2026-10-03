/**
 * Phase 14: End-to-End System Verification Test Suite
 * Validates complete system integration across all 14 phases:
 * - System Health & Database connectivity
 * - Tourist Registration, Login, Destination discovery, Homestay booking, and Reviews
 * - Partner Homestay submission, Room inventory management, and Host reservation queue
 * - Admin Moderation, Approval workflows, Review moderation, and Platform Analytics
 * - Customer Reservation Tracking, Cancellation, and Session Invalidation
 */

const mongoose = require('mongoose');
const { User, Property, Room, Booking, Review, Destination } = require('../models');

async function runEndToEndVerification() {
  console.log('===============================================================');
  console.log('🏔️  LAMA BHAILA TOURISM — END-TO-END VERIFICATION TEST SUITE  🏔️');
  console.log('===============================================================\n');

  const { server } = require('../server');

  // Allow database connection to establish
  await new Promise((r) => setTimeout(r, 1500));

  const baseUrl = 'http://localhost:5000/api';
  const timestamp = Date.now().toString().slice(-6);

  // Entities created during test for validation and cleanup
  const cleanups = {
    userIds: [],
    propertyIds: [],
    roomIds: [],
    bookingIds: [],
    reviewIds: [],
  };

  try {
    // -------------------------------------------------------------------------
    // STEP 1: Health Check & System Status
    // -------------------------------------------------------------------------
    console.log('[STEP 1] Testing System Health Check (GET /api/health)...');
    const healthRes = await fetch(`${baseUrl}/health`);
    const healthData = await healthRes.json();
    console.log(`Status: ${healthRes.status} | DB: ${healthData.database?.status}`);
    if (healthRes.status !== 200 || healthData.status !== 'ok' || healthData.database?.status !== 'connected') {
      throw new Error(`Health check failed: ${JSON.stringify(healthData)}`);
    }
    console.log('✓ Health check passed. Server & MongoDB Atlas/Local operational.\n');

    // -------------------------------------------------------------------------
    // STEP 2: Tourist Registration, Login & Session Authentication
    // -------------------------------------------------------------------------
    console.log('[STEP 2] Testing Tourist Registration & Session Authentication...');
    const touristEmail = `tourist_e2e_${timestamp}@lamatest.com`;
    const regTouristRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Tashi Namgyal',
        email: touristEmail,
        password: 'Password123!',
        phone: '9800112233',
        role: 'tourist',
      }),
    });
    const regTouristData = await regTouristRes.json();
    console.log(`Registration status: ${regTouristRes.status}`);
    const touristUser = regTouristData.user || regTouristData.data;
    if (regTouristRes.status !== 201 || !touristUser?._id) {
      throw new Error(`Tourist registration failed: ${JSON.stringify(regTouristData)}`);
    }
    cleanups.userIds.push(touristUser._id);

    // Login Tourist
    const loginTouristRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: touristEmail, password: 'Password123!' }),
    });
    const touristCookie = loginTouristRes.headers.get('set-cookie')?.split(';')[0];
    if (!touristCookie) throw new Error('Tourist session cookie not returned on login');

    // Verify session identity (GET /api/auth/me)
    const meTouristRes = await fetch(`${baseUrl}/auth/me`, {
      headers: { Cookie: touristCookie },
    });
    const meTouristData = await meTouristRes.json();
    const meUser = meTouristData.user || meTouristData.data;
    if (meTouristRes.status !== 200 || meUser?.email !== touristEmail) {
      throw new Error('Tourist session verification (/api/auth/me) failed');
    }
    console.log(`✓ Tourist authenticated as "${meUser.name}" (${meUser.role}).\n`);

    // -------------------------------------------------------------------------
    // STEP 3: Admin Registration & Session Authentication
    // -------------------------------------------------------------------------
    console.log('[STEP 3] Setting up Admin Session...');
    const adminEmail = `admin_e2e_${timestamp}@lamatest.com`;
    const adminUser = await User.create({
      name: 'Super Admin',
      email: adminEmail,
      password: 'Password123!',
      role: 'admin',
    });
    cleanups.userIds.push(adminUser._id);

    const loginAdminRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminEmail, password: 'Password123!' }),
    });
    const adminCookie = loginAdminRes.headers.get('set-cookie')?.split(';')[0];
    if (!adminCookie) throw new Error('Admin session cookie not returned');
    console.log('✓ Admin authenticated successfully.\n');

    // -------------------------------------------------------------------------
    // STEP 4: Partner Host Registration & Approval Workflow
    // -------------------------------------------------------------------------
    console.log('[STEP 4] Testing Partner Onboarding & Admin Approval Workflow...');
    const partnerEmail = `host_e2e_${timestamp}@lamatest.com`;
    const regPartnerRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Dawa Bhutia',
        email: partnerEmail,
        password: 'Password123!',
        phone: '9811223344',
        role: 'owner',
        agency: 'Dzongu Heritage Stays',
      }),
    });
    const regPartnerData = await regPartnerRes.json();
    const partnerObj = regPartnerData.user || regPartnerData.data;
    if (regPartnerRes.status !== 201 || !partnerObj?._id) {
      throw new Error(`Partner registration failed: ${JSON.stringify(regPartnerData)}`);
    }
    const partnerId = partnerObj._id;
    cleanups.userIds.push(partnerId);

    // Login Partner
    const loginPartnerRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: partnerEmail, password: 'Password123!' }),
    });
    const partnerCookie = loginPartnerRes.headers.get('set-cookie')?.split(';')[0];

    // Admin verifies the new partner using status: 'Approved'
    const approvePartnerRes = await fetch(`${baseUrl}/admin/partners/${partnerId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({ status: 'Approved', reviewerNotes: 'Verified local host' }),
    });
    const approvePartnerData = await approvePartnerRes.json();
    if (approvePartnerRes.status !== 200 || approvePartnerData.data?.partnerProfile?.verificationStatus !== 'Approved') {
      throw new Error(`Admin failed to approve partner: ${JSON.stringify(approvePartnerData)}`);
    }
    console.log(`✓ Partner "${partnerObj.name}" registered and approved by Admin.\n`);

    // -------------------------------------------------------------------------
    // STEP 5: Partner Submits Homestay & Adds Rooms
    // -------------------------------------------------------------------------
    console.log('[STEP 5] Testing Partner Homestay Submission & Room Inventory...');
    const newPropertyPayload = {
      name: `Khangchendzonga Mountain Retreat ${timestamp}`,
      type: 'Homestay',
      description: 'Authentic Lepcha wooden homestay overlooking snow-capped peaks in Passingdang, Dzongu.',
      location: {
        district: 'North Sikkim',
        town: 'Dzongu',
        address: 'Passingdang Upper Village',
      },
      price: 2800,
      image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb',
      gallery: [
        'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb',
        'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4',
      ],
      amenities: ['Timber Architecture', 'Organic Kitchen', 'Bukhari Heater', 'Mountain View', 'Hot Water'],
    };

    const createPropRes = await fetch(`${baseUrl}/owner/properties`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: partnerCookie },
      body: JSON.stringify(newPropertyPayload),
    });
    const createPropData = await createPropRes.json();
    if (createPropRes.status !== 201 || !createPropData.data?._id) {
      throw new Error(`Owner property creation failed: ${JSON.stringify(createPropData)}`);
    }
    const propId = createPropData.data._id;
    cleanups.propertyIds.push(propId);
    console.log(`✓ Homestay submitted: "${createPropData.data.name}" (status: ${createPropData.data.status})`);

    // Partner adds a room to the homestay
    const addRoomRes = await fetch(`${baseUrl}/owner/properties/${propId}/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: partnerCookie },
      body: JSON.stringify({
        name: 'Snow Peak Deluxe Suite',
        type: 'Deluxe Room',
        capacity: 3,
        bedConfiguration: '1 King Bed + 1 Single',
        price: 2800,
        amenities: ['Mountain View', 'Attached Bath', 'Wood Fireplace'],
        availability: 'available',
      }),
    });
    const addRoomData = await addRoomRes.json();
    if (addRoomRes.status !== 201 || !addRoomData.data?._id) {
      throw new Error(`Owner room creation failed: ${JSON.stringify(addRoomData)}`);
    }
    const roomId = addRoomData.data._id;
    cleanups.roomIds.push(roomId);
    console.log(`✓ Room added: "${addRoomData.data.name}" (ID: ${roomId})\n`);

    // -------------------------------------------------------------------------
    // STEP 6: Admin Moderates & Approves Homestay
    // -------------------------------------------------------------------------
    console.log('[STEP 6] Testing Admin Property Moderation & Approval...');
    const approvePropRes = await fetch(`${baseUrl}/admin/properties/${propId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({ status: 'approved', notes: 'Meets heritage homestay standards' }),
    });
    const approvePropData = await approvePropRes.json();
    if (approvePropRes.status !== 200 || approvePropData.data?.status !== 'approved') {
      throw new Error('Admin property approval failed');
    }
    console.log(`✓ Property "${approvePropData.data.name}" approved and live for public discovery.\n`);

    // -------------------------------------------------------------------------
    // STEP 7: Public Property Discovery & Slug Routing
    // -------------------------------------------------------------------------
    console.log('[STEP 7] Testing Public Property Discovery & Slug Query...');
    const publicListRes = await fetch(`${baseUrl}/properties?district=North%20Sikkim`);
    const publicListData = await publicListRes.json();
    const foundInList = publicListData.data?.some((p) => p._id === propId);
    if (!foundInList) {
      throw new Error('Newly approved property did not appear in public district listing');
    }

    const publicDetailRes = await fetch(`${baseUrl}/properties/${createPropData.data.slug}`);
    const publicDetailData = await publicDetailRes.json();
    if (publicDetailRes.status !== 200 || publicDetailData.data?.name !== createPropData.data.name) {
      throw new Error('Failed to retrieve property by slug');
    }
    console.log(`✓ Property successfully retrieved via public slug "/properties/${createPropData.data.slug}".\n`);

    // -------------------------------------------------------------------------
    // STEP 8: Tourist Booking Reservation Lifecycle
    // -------------------------------------------------------------------------
    console.log('[STEP 8] Testing Tourist Booking Request Creation & Tracking Code...');
    const bookingPayload = {
      propertyId: propId,
      roomId: roomId,
      service: 'Stay',
      customerName: 'Tashi Namgyal',
      customerEmail: touristEmail,
      customerPhone: '9800112233',
      guestCount: 2,
      dates: {
        checkIn: new Date(Date.now() + 86400000 * 7).toISOString(),
        checkOut: new Date(Date.now() + 86400000 * 10).toISOString(),
      },
      specialRequests: 'Would love local organic Lepcha meals and village walking guide.',
    };

    const createBookingRes = await fetch(`${baseUrl}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: touristCookie },
      body: JSON.stringify(bookingPayload),
    });
    const createBookingData = await createBookingRes.json();
    if (createBookingRes.status !== 201 || !createBookingData.data?.bookingRequestId) {
      throw new Error(`Booking submission failed: ${JSON.stringify(createBookingData)}`);
    }
    const bookingObj = createBookingData.data;
    const trackingCode = bookingObj.bookingRequestId;
    cleanups.bookingIds.push(bookingObj._id);
    console.log(`✓ Booking confirmed! Generated Tracking Code: ${trackingCode} (3 nights, Total: ₹${bookingObj.pricing?.totalPrice})`);

    // Customer looks up booking by Tracking Code
    const lookupBookingRes = await fetch(`${baseUrl}/bookings/${trackingCode}`);
    const lookupBookingData = await lookupBookingRes.json();
    if (lookupBookingRes.status !== 200 || lookupBookingData.data?.bookingRequestId !== trackingCode) {
      throw new Error('Failed to look up booking via tracking code');
    }
    console.log(`✓ Booking looked up successfully via tracking code "${trackingCode}".`);

    // Partner checks their incoming reservation queue
    const ownerBookingsRes = await fetch(`${baseUrl}/owner/bookings`, {
      headers: { Cookie: partnerCookie },
    });
    const ownerBookingsData = await ownerBookingsRes.json();
    const foundInQueue = ownerBookingsData.data?.some((b) => b.bookingRequestId === trackingCode);
    if (!foundInQueue) {
      throw new Error('New reservation was not found in host reservation queue');
    }
    console.log('✓ Host received reservation in partner inbox.\n');

    // -------------------------------------------------------------------------
    // STEP 9: Review Submission & Automated Property Rating Calculation
    // -------------------------------------------------------------------------
    console.log('[STEP 9] Testing Tourist Review & Property Rating Aggregation...');
    const reviewRes = await fetch(`${baseUrl}/properties/${propId}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: touristCookie },
      body: JSON.stringify({
        rating: 5,
        title: 'Unforgettable Dzongu hospitality!',
        comment: 'Warm wooden rooms, exceptional mountain views, and the tastiest home-cooked meals.',
      }),
    });
    const reviewData = await reviewRes.json();
    if (reviewRes.status !== 201 || !reviewData.data?._id) {
      throw new Error(`Review submission failed: ${JSON.stringify(reviewData)}`);
    }
    cleanups.reviewIds.push(reviewData.data._id);
    console.log(`✓ 5-star review submitted by tourist (Review ID: ${reviewData.data._id})`);

    // Verify property rating updated
    const updatedProp = await Property.findById(propId).lean();
    if (updatedProp.rating !== 5 || updatedProp.numReviews !== 1) {
      throw new Error(`Property rating aggregation mismatch: rating=${updatedProp.rating}, numReviews=${updatedProp.numReviews}`);
    }
    console.log(`✓ Property rating automatically updated to ${updatedProp.rating}★ (${updatedProp.numReviews} review).\n`);

    // -------------------------------------------------------------------------
    // STEP 10: Admin Moderation & Platform Analytics Overview
    // -------------------------------------------------------------------------
    console.log('[STEP 10] Testing Admin Platform Analytics (GET /api/admin/stats)...');
    const statsRes = await fetch(`${baseUrl}/admin/stats`, {
      headers: { Cookie: adminCookie },
    });
    const statsData = await statsRes.json();
    if (statsRes.status !== 200 || !statsData.data) {
      throw new Error('Failed to retrieve admin stats');
    }
    console.log(
      `✓ Admin Stats: ${statsData.data.properties?.total || 0} properties (${statsData.data.properties?.approved || 0} approved), ${statsData.data.partners?.total || 0} partners, ${statsData.data.bookings?.total || 0} bookings.\n`
    );

    // -------------------------------------------------------------------------
    // STEP 11: Tourist Cancels Reservation
    // -------------------------------------------------------------------------
    console.log('[STEP 11] Testing Customer Cancellation Flow...');
    const cancelRes = await fetch(`${baseUrl}/bookings/${trackingCode}/cancel`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: touristCookie },
      body: JSON.stringify({ reason: 'Personal or family emergency' }),
    });
    const cancelData = await cancelRes.json();
    if (cancelRes.status !== 200 || cancelData.data?.status !== 'Cancelled') {
      throw new Error('Customer booking cancellation failed');
    }
    console.log(`✓ Reservation "${trackingCode}" cancelled with reason: "${cancelData.data.cancellationReason}".\n`);

    // -------------------------------------------------------------------------
    // STEP 12: Logout & Session Invalidation
    // -------------------------------------------------------------------------
    console.log('[STEP 12] Testing Session Logout & Invalidation...');
    const logoutRes = await fetch(`${baseUrl}/auth/logout`, {
      method: 'POST',
      headers: { Cookie: touristCookie },
    });
    if (logoutRes.status !== 200) {
      throw new Error('Logout request failed');
    }

    const testLoggedOut = await fetch(`${baseUrl}/auth/me`, {
      headers: { Cookie: touristCookie },
    });
    if (testLoggedOut.status !== 401) {
      throw new Error(`Expected 401 after logout, got ${testLoggedOut.status}`);
    }
    console.log('✓ Session terminated and cookie invalidated successfully.\n');

    console.log('===============================================================');
    console.log('🎉 ALL 12 END-TO-END VERIFICATION STEPS PASSED SUCCESSFULLY! 🎉');
    console.log('===============================================================\n');
  } catch (error) {
    console.error('\n❌ E2E VERIFICATION TEST FAILED:', error.message);
    process.exitCode = 1;
  } finally {
    // Teardown created test entities
    console.log('Cleaning up test data from MongoDB...');
    try {
      if (cleanups.reviewIds.length) await Review.deleteMany({ _id: { $in: cleanups.reviewIds } });
      if (cleanups.bookingIds.length) await Booking.deleteMany({ _id: { $in: cleanups.bookingIds } });
      if (cleanups.roomIds.length) await Room.deleteMany({ _id: { $in: cleanups.roomIds } });
      if (cleanups.propertyIds.length) await Property.deleteMany({ _id: { $in: cleanups.propertyIds } });
      if (cleanups.userIds.length) await User.deleteMany({ _id: { $in: cleanups.userIds } });
      console.log('✓ Cleanup complete.');
    } catch (cleanErr) {
      console.warn('Cleanup warning:', cleanErr.message);
    }

    if (server) {
      server.close();
    }
    await mongoose.connection.close(false);
    console.log('Database disconnected. Verification finished.');
    process.exit(process.exitCode || 0);
  }
}

runEndToEndVerification();

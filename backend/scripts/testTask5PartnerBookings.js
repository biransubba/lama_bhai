/**
 * Task 5 Test Suite: Partner Bookings Backend API Integration & Scoping
 *
 * Verifies:
 * - Test 1: Partner booking list (GET /api/owner/bookings scoped to partner)
 * - Test 2: Empty bookings for partner with 0 bookings returns count 0 and empty array
 * - Test 3: Status update (PATCH /api/owner/bookings/:id/status, New -> Confirmed)
 * - Test 4: Cancellation (PATCH /api/owner/bookings/:id/status, Confirmed -> Cancelled with cancellation reason/metadata)
 * - Test 5: Cross-partner security (Partner B cannot modify Partner A's booking, returns 403)
 * - Test 6: Session persistence (Session cookie remains valid on page refresh /auth/me and reloads bookings)
 * - Test 7: No local booking source (PartnerBookings.jsx does not use bookingStorage/localStorage/updateBookingRequestStatus)
 */

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { User, Property, Room, Booking } = require('../models');

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000/api';

let passedTests = 0;
const totalTests = 7;

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

async function runTask5Tests() {
  console.log('================================================================');
  console.log(' STARTING TASK 5: PARTNER BOOKINGS BACKEND TEST SUITE ');
  console.log('================================================================\n');

  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/lama-bhaila');

  const uniqueSuffix = Date.now().toString().slice(-6);

  try {
    // 0. SETUP: Create Partner A and Partner B with properties and a test booking for Partner A
    console.log('[Setup] Registering Partner A and Partner B...');
    const partnerAEmail = `partner_a_${uniqueSuffix}@lama.test`;
    const partnerBEmail = `partner_b_${uniqueSuffix}@lama.test`;

    const regARes = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Partner Host Alpha',
        email: partnerAEmail,
        password: 'password123',
        role: 'owner',
        agencyName: 'Alpha Homestay Corp',
        location: 'Lachung, North Sikkim',
      }),
    });
    const cookieA = regARes.cookie;
    const userA = regARes.json.user;

    const regBRes = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Partner Host Beta',
        email: partnerBEmail,
        password: 'password123',
        role: 'owner',
        agencyName: 'Beta Retreats Ltd',
        location: 'Lachen, North Sikkim',
      }),
    });
    const cookieB = regBRes.cookie;
    const userB = regBRes.json.user;

    // Create property for Partner A
    const propA = await Property.create({
      name: `Alpha Pine Villa ${uniqueSuffix}`,
      slug: `alpha-pine-villa-${uniqueSuffix}`,
      type: 'Homestay',
      description: 'Cozy homestay surrounded by pines in Lachung.',
      image: 'https://res.cloudinary.com/demo/image/upload/v1/sample.jpg',
      location: {
        district: 'North Sikkim',
        town: 'Lachung',
        address: 'Main Village Road',
      },
      price: 3200,
      owner: userA._id,
      status: 'approved',
      active: true,
    });

    const roomA = await Room.create({
      property: propA._id,
      name: 'Pine Deluxe Suite',
      type: 'Deluxe Room',
      price: 3200,
      capacity: 2,
      availability: 'available',
      status: 'published',
      active: true,
    });

    // Create a real Booking document assigned to Partner A
    const bookingA = await Booking.create({
      service: 'Stay',
      property: propA._id,
      propertyName: propA.name,
      room: roomA._id,
      roomName: roomA.name,
      partner: userA._id,
      customerDetails: {
        name: 'Arjun Sen',
        email: 'arjun.sen@example.com',
        phone: '+91 9876543210',
        nationality: 'Indian',
      },
      schedule: {
        checkIn: new Date(Date.now() + 86400000 * 5),
        checkOut: new Date(Date.now() + 86400000 * 7),
        nights: 2,
      },
      travellers: 2,
      pricing: {
        totalPrice: 6400,
        currency: 'INR',
        paymentStatus: 'pending',
      },
      status: 'New',
      notes: 'Please arrange ground-floor room if possible.',
    });

    console.log(`[Setup] Created Booking ${bookingA.bookingRequestId} (_id: ${bookingA._id}) for Partner A.\n`);

    // TEST 1 — Partner booking list
    console.log('[Test 1] Testing Partner A booking list (GET /api/owner/bookings)...');
    const listResA = await request('/owner/bookings', {
      method: 'GET',
      headers: { Cookie: cookieA },
    });

    const isTest1Ok =
      listResA.status === 200 &&
      listResA.json.success === true &&
      Array.isArray(listResA.json.data) &&
      listResA.json.data.length >= 1 &&
      listResA.json.data.some((b) => b._id.toString() === bookingA._id.toString());

    if (isTest1Ok) {
      logPass(
        'Test 1 Partner booking list returned scoped bookings from MongoDB',
        `count: ${listResA.json.count}, booking: ${listResA.json.data[0].bookingRequestId}`
      );
    } else {
      logFail('Test 1 Partner booking list failed', listResA);
    }

    // TEST 2 — Empty bookings
    console.log('\n[Test 2] Testing Partner B with no bookings (GET /api/owner/bookings)...');
    const listResB = await request('/owner/bookings', {
      method: 'GET',
      headers: { Cookie: cookieB },
    });

    const isTest2Ok =
      listResB.status === 200 &&
      listResB.json.success === true &&
      listResB.json.count === 0 &&
      Array.isArray(listResB.json.data) &&
      listResB.json.data.length === 0;

    if (isTest2Ok) {
      logPass(
        'Test 2 Empty bookings for Partner B returns count 0 and empty array',
        'UI will render "No Inquiries Found" without errors'
      );
    } else {
      logFail('Test 2 Empty bookings failed', listResB);
    }

    // TEST 3 — Status update (New -> Confirmed)
    console.log('\n[Test 3] Testing Status update New -> Confirmed (PATCH /api/owner/bookings/:id/status)...');
    const updateRes = await request(`/owner/bookings/${bookingA._id}/status`, {
      method: 'PATCH',
      headers: { Cookie: cookieA },
      body: JSON.stringify({ status: 'Confirmed' }),
    });

    // Re-fetch from MongoDB
    const reloadedBooking = await Booking.findById(bookingA._id).lean();

    const isTest3Ok =
      updateRes.status === 200 &&
      updateRes.json.success === true &&
      updateRes.json.data.status === 'Confirmed' &&
      reloadedBooking.status === 'Confirmed';

    if (isTest3Ok) {
      logPass(
        'Test 3 Booking status updated to Confirmed in MongoDB and verified via re-fetch',
        `MongoDB status: ${reloadedBooking.status}`
      );
    } else {
      logFail('Test 3 Status update failed', { updateRes, reloadedBooking });
    }

    // TEST 4 — Cancellation (Confirmed -> Cancelled)
    console.log('\n[Test 4] Testing Cancellation Confirmed -> Cancelled with metadata...');
    const cancelRes = await request(`/owner/bookings/${bookingA._id}/status`, {
      method: 'PATCH',
      headers: { Cookie: cookieA },
      body: JSON.stringify({
        status: 'Cancelled',
        reason: 'Cancelled by Host/Admin',
      }),
    });

    const cancelledBookingInDb = await Booking.findById(bookingA._id).lean();

    const isTest4Ok =
      cancelRes.status === 200 &&
      cancelRes.json.success === true &&
      cancelledBookingInDb.status === 'Cancelled' &&
      cancelledBookingInDb.cancellation?.cancelledBy &&
      cancelledBookingInDb.cancellation?.reason === 'Cancelled by Host/Admin';

    if (isTest4Ok) {
      logPass(
        'Test 4 Cancellation stored in MongoDB with cancellation metadata',
        `by: ${cancelledBookingInDb.cancellation.cancelledBy}, reason: ${cancelledBookingInDb.cancellation.reason}`
      );
    } else {
      logFail('Test 4 Cancellation failed', { cancelRes, cancelledBookingInDb });
    }

    // TEST 5 — Cross-partner security (Partner B tries to update Partner A's booking)
    console.log('\n[Test 5] Testing Cross-partner security (Partner B attempts PATCH on Partner A booking)...');
    const crossRes = await request(`/owner/bookings/${bookingA._id}/status`, {
      method: 'PATCH',
      headers: { Cookie: cookieB },
      body: JSON.stringify({ status: 'In Progress' }),
    });

    const bookingAfterCrossAttempt = await Booking.findById(bookingA._id).lean();

    const isTest5Ok =
      crossRes.status === 403 &&
      crossRes.json.success === false &&
      bookingAfterCrossAttempt.status === 'Cancelled'; // status untouched

    if (isTest5Ok) {
      logPass(
        'Test 5 Cross-partner security blocked unauthorized update with 403 Forbidden',
        `status remained: ${bookingAfterCrossAttempt.status}`
      );
    } else {
      logFail('Test 5 Cross-partner security failed', crossRes);
    }

    // TEST 6 — Session persistence
    console.log('\n[Test 6] Testing Session persistence and booking reload via session cookie...');
    const meRes = await request('/auth/me', {
      method: 'GET',
      headers: { Cookie: cookieA },
    });

    const reloadRes = await request('/owner/bookings', {
      method: 'GET',
      headers: { Cookie: cookieA },
    });

    const isTest6Ok =
      meRes.status === 200 &&
      meRes.json.success === true &&
      meRes.json.user.email === partnerAEmail &&
      reloadRes.status === 200 &&
      reloadRes.json.data.length >= 1;

    if (isTest6Ok) {
      logPass(
        'Test 6 Session persisted across requests and reloaded bookings from MongoDB',
        `authenticated user: ${meRes.json.user.name}`
      );
    } else {
      logFail('Test 6 Session persistence failed', { meRes, reloadRes });
    }

    // TEST 7 — No local booking source
    console.log('\n[Test 7] Verifying PartnerBookings.jsx no longer uses local storage / bookingStorage.js...');
    const partnerBookingsFile = path.join(__dirname, '../../src/partner/pages/PartnerBookings.jsx');
    const code = fs.readFileSync(partnerBookingsFile, 'utf8');

    const usesBookingStorage = code.includes('bookingStorage.js');
    const usesUpdateBookingRequestStatus = code.includes('updateBookingRequestStatus');
    const usesStaysStore = code.includes('staysStore.js');
    const usesLocalStorageDirectly = code.includes('localStorage.getItem("lamabhai_booking_requests")');
    const usesApiOwner = code.includes('api.owner.getBookings') && code.includes('api.owner.updateBookingStatus');

    const isTest7Ok =
      !usesBookingStorage &&
      !usesUpdateBookingRequestStatus &&
      !usesStaysStore &&
      !usesLocalStorageDirectly &&
      usesApiOwner;

    if (isTest7Ok) {
      logPass(
        'Test 7 PartnerBookings.jsx has zero dependencies on local booking storage',
        'exclusively uses api.owner.getBookings and api.owner.updateBookingStatus'
      );
    } else {
      logFail('Test 7 Check failed', {
        usesBookingStorage,
        usesUpdateBookingRequestStatus,
        usesStaysStore,
        usesLocalStorageDirectly,
        usesApiOwner,
      });
    }

    // Clean up created test data
    await Booking.deleteOne({ _id: bookingA._id });
    await Room.deleteOne({ _id: roomA._id });
    await Property.deleteOne({ _id: propA._id });
    await User.deleteMany({ _id: { $in: [userA._id, userB._id] } });

    console.log('\n================================================================');
    console.log(` TASK 5 RESULTS: ${passedTests}/${totalTests} TESTS PASSED `);
    console.log('================================================================\n');

    if (passedTests === totalTests) {
      console.log('>>> TASK 5 IMPLEMENTATION IS 100% COMPLETE AND VERIFIED <<<\n');
      process.exit(0);
    } else {
      console.error(`Only ${passedTests} of ${totalTests} tests passed.`);
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal error during Task 5 tests:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

runTask5Tests();

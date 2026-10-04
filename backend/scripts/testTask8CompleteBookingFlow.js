/**
 * Task 8 Test Suite: End-to-End Customer Booking Flow
 *
 * Verifies:
 * - Test 1: Approved property publicly accessible
 * - Test 2: Room belongs to property (relationship verified)
 * - Test 3: Create booking (POST /api/bookings returns 201 & success=true)
 * - Test 4: Booking ID generated (bookingRequestId generated automatically)
 * - Test 5: Partner assigned (booking.partner === property.owner)
 * - Test 6: Pricing authoritative (nights * room.price calculated by backend)
 * - Test 7: Customer booking lookup (GET /api/bookings/:bookingRequestId returns booking)
 * - Test 8: Partner sees booking (GET /api/owner/bookings returns newly created booking)
 * - Test 9: Partner updates status (PATCH /api/owner/bookings/:id/status to 'Confirmed')
 * - Test 10: Customer sees updated status (GET /api/bookings/:id returns status='Confirmed')
 * - Test 11: Cross-partner security (Partner B forbidden from modifying Partner A booking, 403)
 * - Test 12: Wrong property/room combination (Property A + Room B safely rejected, 404)
 * - Test 13: Unapproved property cannot be booked (Pending property booking rejected, 400)
 * - Test 14: Completed booking cannot be cancelled (Completed status blocks cancel, 400)
 * - Test 15: Customer cancellation (PATCH /api/bookings/:id/cancel updates to 'Cancelled')
 * - Test 16: Duplicate submission protection (BookingForm enforces isSubmitting state and disabled submit)
 */

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { User, Property, Room, Booking } = require('../models');

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000/api';

let passedTests = 0;
const totalTests = 16;

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

async function runTask8Tests() {
  console.log('================================================================');
  console.log(' STARTING TASK 8: COMPLETE END-TO-END BOOKING FLOW TEST SUITE   ');
  console.log('================================================================\n');

  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/lama-bhaila');

    const timestamp = Date.now();

    // 1. Setup Partner A
    let partnerA = await User.findOne({ email: 'partner_task8_a@lama.test' });
    if (!partnerA) {
      partnerA = await User.create({
        name: 'Partner Host Alpha',
        email: 'partner_task8_a@lama.test',
        password: 'Password123!',
        phone: '9800000081',
        role: 'owner',
        partnerProfile: {
          agencyName: 'Alpha Himalayan Homestays',
          accountStatus: 'approved',
          location: 'Yuksom, West Sikkim',
        },
      });
    }

    // Setup Partner B
    let partnerB = await User.findOne({ email: 'partner_task8_b@lama.test' });
    if (!partnerB) {
      partnerB = await User.create({
        name: 'Partner Host Beta',
        email: 'partner_task8_b@lama.test',
        password: 'Password123!',
        phone: '9800000082',
        role: 'owner',
        partnerProfile: {
          agencyName: 'Beta Alpine Lodges',
          accountStatus: 'approved',
          location: 'Lachung, North Sikkim',
        },
      });
    }

    // Cleanup old test data
    await Property.deleteMany({ name: new RegExp(`Task 8 Test`, 'i') });
    await Room.deleteMany({ name: new RegExp(`Task 8 Room`, 'i') });
    await Booking.deleteMany({ 'customerDetails.email': new RegExp(`task8_`, 'i') });

    // 2. Create Approved Property A owned by Partner A
    const propA = await Property.create({
      name: `Task 8 Test Valley Homestay A ${timestamp}`,
      slug: `task-8-homestay-a-${timestamp}`,
      owner: partnerA._id,
      type: 'Homestay',
      status: 'approved',
      active: true,
      description: 'Charming authentic mountain stay in Yuksom.',
      location: { town: 'Yuksom', district: 'West Sikkim' },
      price: 2500,
      image: 'https://res.cloudinary.com/demo/image/upload/v1/yuksom.jpg',
    });

    // Create Room A for Property A
    const roomA = await Room.create({
      property: propA._id,
      name: `Task 8 Room Deluxe Mountain View ${timestamp}`,
      type: 'Deluxe Room',
      description: 'Cosy wood-panelled room with valley view.',
      capacity: 2,
      price: 2500,
      image: 'https://res.cloudinary.com/demo/image/upload/v1/room_a.jpg',
      availability: 'available',
      active: true,
    });
    propA.rooms = [roomA._id];
    await propA.save();

    // 3. Create Approved Property B owned by Partner B
    const propB = await Property.create({
      name: `Task 8 Test Snow Resort B ${timestamp}`,
      slug: `task-8-resort-b-${timestamp}`,
      owner: partnerB._id,
      type: 'Resort',
      status: 'approved',
      active: true,
      description: 'High-altitude luxury resort in Lachung.',
      location: { town: 'Lachung', district: 'North Sikkim' },
      price: 4000,
      image: 'https://res.cloudinary.com/demo/image/upload/v1/lachung.jpg',
    });

    const roomB = await Room.create({
      property: propB._id,
      name: `Task 8 Room B Alpine Suite ${timestamp}`,
      type: 'Suite',
      description: 'Snow view suite.',
      capacity: 3,
      price: 4500,
      image: 'https://res.cloudinary.com/demo/image/upload/v1/room_b.jpg',
      availability: 'available',
      active: true,
    });
    propB.rooms = [roomB._id];
    await propB.save();

    // 4. Create Pending (Unapproved) Property C
    const propPending = await Property.create({
      name: `Task 8 Test Pending Stay C ${timestamp}`,
      slug: `task-8-pending-c-${timestamp}`,
      owner: partnerA._id,
      type: 'Homestay',
      status: 'pending',
      active: true,
      description: 'Awaiting moderation review.',
      location: { town: 'Pelling', district: 'West Sikkim' },
      price: 1800,
      image: 'https://res.cloudinary.com/demo/image/upload/v1/pelling.jpg',
    });

    // Login Partner A
    const partnerALogin = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'partner_task8_a@lama.test', password: 'Password123!' }),
    });
    const partnerACookie = partnerALogin.cookie;

    // Login Partner B
    const partnerBLogin = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'partner_task8_b@lama.test', password: 'Password123!' }),
    });
    const partnerBCookie = partnerBLogin.cookie;

    // -------------------------------------------------------------------------
    // TEST 1 — Approved property
    // -------------------------------------------------------------------------
    try {
      const res = await request(`/properties/${propA._id}`);
      if (res.status === 200 && res.json?.success && res.json?.data?._id === propA._id.toString()) {
        logPass('TEST 1 — Approved property', `Property ${propA.name} is publicly accessible with status=200`);
      } else {
        logFail('TEST 1 — Approved property', new Error(`Status ${res.status}: ${JSON.stringify(res.json)}`));
      }
    } catch (err) {
      logFail('TEST 1 — Approved property', err);
    }

    // -------------------------------------------------------------------------
    // TEST 2 — Room belongs to property
    // -------------------------------------------------------------------------
    try {
      const res = await request(`/properties/${propA._id}/rooms/${roomA._id}`);
      if (res.status === 200 && res.json?.success && res.json?.data?.property === propA._id.toString()) {
        logPass('TEST 2 — Room belongs to property', `Room ${roomA.name} verified as belonging strictly to Property A`);
      } else {
        logFail('TEST 2 — Room belongs to property', new Error(`Status ${res.status}: ${JSON.stringify(res.json)}`));
      }
    } catch (err) {
      logFail('TEST 2 — Room belongs to property', err);
    }

    // -------------------------------------------------------------------------
    // TEST 3 — Create booking
    // -------------------------------------------------------------------------
    let createdBooking = null;
    try {
      const res = await request('/bookings', {
        method: 'POST',
        body: JSON.stringify({
          service: 'Stay',
          propertyId: propA._id.toString(),
          roomId: roomA._id.toString(),
          customerDetails: {
            name: 'Sonam Tashi',
            email: 'task8_customer@example.com',
            phone: '9876543210',
            nationality: 'Indian',
          },
          schedule: {
            checkIn: '2026-10-15',
            checkOut: '2026-10-17',
            nights: 2,
          },
          travellers: 2,
          notes: 'Arriving by private cab from Bagdogra in late afternoon',
        }),
      });

      if (res.status === 201 && res.json?.success && res.json?.data) {
        createdBooking = res.json.data;
        logPass('TEST 3 — Create booking', `POST /api/bookings returned 201 Created and success=true`);
      } else {
        logFail('TEST 3 — Create booking', new Error(`Status ${res.status}: ${JSON.stringify(res.json)}`));
      }
    } catch (err) {
      logFail('TEST 3 — Create booking', err);
    }

    // -------------------------------------------------------------------------
    // TEST 4 — Booking ID generated
    // -------------------------------------------------------------------------
    try {
      if (createdBooking && createdBooking.bookingRequestId && createdBooking.bookingRequestId.startsWith('LB-ST-')) {
        logPass('TEST 4 — Booking ID generated', `Unique bookingRequestId generated: ${createdBooking.bookingRequestId}`);
      } else {
        logFail('TEST 4 — Booking ID generated', new Error(`Invalid or missing bookingRequestId: ${createdBooking?.bookingRequestId}`));
      }
    } catch (err) {
      logFail('TEST 4 — Booking ID generated', err);
    }

    // -------------------------------------------------------------------------
    // TEST 5 — Partner assigned
    // -------------------------------------------------------------------------
    try {
      if (createdBooking && createdBooking.partner === partnerA._id.toString()) {
        logPass('TEST 5 — Partner assigned', `Booking partner correctly assigned to Property A owner (${partnerA.name})`);
      } else {
        logFail('TEST 5 — Partner assigned', new Error(`Partner mismatch: expected ${partnerA._id}, got ${createdBooking?.partner}`));
      }
    } catch (err) {
      logFail('TEST 5 — Partner assigned', err);
    }

    // -------------------------------------------------------------------------
    // TEST 6 — Pricing
    // -------------------------------------------------------------------------
    try {
      // Room price = 2500, nights = 2 -> expected totalPrice = 5000
      const expectedTotal = 2500 * 2;
      if (createdBooking && createdBooking.pricing?.totalPrice === expectedTotal) {
        logPass('TEST 6 — Pricing', `Backend computed authoritative pricing: ₹${createdBooking.pricing.totalPrice} (₹2500 x 2 nights)`);
      } else {
        logFail('TEST 6 — Pricing', new Error(`Pricing incorrect: expected ${expectedTotal}, got ${createdBooking?.pricing?.totalPrice}`));
      }
    } catch (err) {
      logFail('TEST 6 — Pricing', err);
    }

    // -------------------------------------------------------------------------
    // TEST 7 — Customer booking lookup
    // -------------------------------------------------------------------------
    try {
      const res = await request(`/bookings/${createdBooking.bookingRequestId}`);
      if (
        res.status === 200 &&
        res.json?.success &&
        res.json?.data?.bookingRequestId === createdBooking.bookingRequestId &&
        res.json?.data?.status === 'New'
      ) {
        logPass('TEST 7 — Customer booking lookup', `GET /api/bookings/:bookingRequestId retrieved active reservation with status=New`);
      } else {
        logFail('TEST 7 — Customer booking lookup', new Error(`Status ${res.status}: ${JSON.stringify(res.json)}`));
      }
    } catch (err) {
      logFail('TEST 7 — Customer booking lookup', err);
    }

    // -------------------------------------------------------------------------
    // TEST 8 — Partner sees booking
    // -------------------------------------------------------------------------
    try {
      const res = await request('/owner/bookings', {
        headers: { Cookie: partnerACookie },
      });
      const found = res.json?.data?.some((b) => b.bookingRequestId === createdBooking.bookingRequestId);
      if (res.status === 200 && found) {
        logPass('TEST 8 — Partner sees booking', `Partner A sees booking ${createdBooking.bookingRequestId} under GET /api/owner/bookings`);
      } else {
        logFail('TEST 8 — Partner sees booking', new Error(`Booking not found in Partner A dashboard (status: ${res.status})`));
      }
    } catch (err) {
      logFail('TEST 8 — Partner sees booking', err);
    }

    // -------------------------------------------------------------------------
    // TEST 9 — Partner updates status
    // -------------------------------------------------------------------------
    try {
      const res = await request(`/owner/bookings/${createdBooking._id}/status`, {
        method: 'PATCH',
        headers: { Cookie: partnerACookie },
        body: JSON.stringify({ status: 'Confirmed' }),
      });

      if (res.status === 200 && res.json?.success && res.json?.data?.status === 'Confirmed') {
        logPass('TEST 9 — Partner updates status', `Partner A successfully updated booking status to Confirmed (status 200)`);
      } else {
        logFail('TEST 9 — Partner updates status', new Error(`Status update failed: status=${res.status}, json=${JSON.stringify(res.json)}`));
      }
    } catch (err) {
      logFail('TEST 9 — Partner updates status', err);
    }

    // -------------------------------------------------------------------------
    // TEST 10 — Customer sees updated status
    // -------------------------------------------------------------------------
    try {
      const res = await request(`/bookings/${createdBooking.bookingRequestId}`);
      if (res.status === 200 && res.json?.data?.status === 'Confirmed') {
        logPass('TEST 10 — Customer sees updated status', `Customer lookup verified status transitioned from New -> Confirmed in MongoDB`);
      } else {
        logFail('TEST 10 — Customer sees updated status', new Error(`Expected status Confirmed, got: ${res.json?.data?.status}`));
      }
    } catch (err) {
      logFail('TEST 10 — Customer sees updated status', err);
    }

    // -------------------------------------------------------------------------
    // TEST 11 — Cross-partner security
    // -------------------------------------------------------------------------
    try {
      const res = await request(`/owner/bookings/${createdBooking._id}/status`, {
        method: 'PATCH',
        headers: { Cookie: partnerBCookie },
        body: JSON.stringify({ status: 'Cancelled' }),
      });

      if (res.status === 403) {
        logPass('TEST 11 — Cross-partner security', `Partner B blocked from mutating Partner A's booking with 403 Forbidden`);
      } else {
        logFail('TEST 11 — Cross-partner security', new Error(`Expected 403, got status ${res.status}: ${JSON.stringify(res.json)}`));
      }
    } catch (err) {
      logFail('TEST 11 — Cross-partner security', err);
    }

    // -------------------------------------------------------------------------
    // TEST 12 — Wrong property/room combination
    // -------------------------------------------------------------------------
    try {
      // Attempt booking Property A with Room belonging to Property B
      const res = await request('/bookings', {
        method: 'POST',
        body: JSON.stringify({
          service: 'Stay',
          propertyId: propA._id.toString(),
          roomId: roomB._id.toString(), // belongs to Property B
          customerDetails: {
            name: 'Wrong Combo Tester',
            email: 'task8_wrong@example.com',
            phone: '9876543219',
          },
          schedule: { checkIn: '2026-10-20', checkOut: '2026-10-22', nights: 2 },
        }),
      });

      if (res.status === 404) {
        logPass('TEST 12 — Wrong property/room combination', `Rejected with 404 Room not found for this property`);
      } else {
        logFail('TEST 12 — Wrong property/room combination', new Error(`Expected 404, got status ${res.status}: ${JSON.stringify(res.json)}`));
      }
    } catch (err) {
      logFail('TEST 12 — Wrong property/room combination', err);
    }

    // -------------------------------------------------------------------------
    // TEST 13 — Unapproved property cannot be booked
    // -------------------------------------------------------------------------
    try {
      const res = await request('/bookings', {
        method: 'POST',
        body: JSON.stringify({
          service: 'Stay',
          propertyId: propPending._id.toString(),
          customerDetails: {
            name: 'Unapproved Tester',
            email: 'task8_pending@example.com',
            phone: '9876543218',
          },
          schedule: { checkIn: '2026-10-20', checkOut: '2026-10-22', nights: 2 },
        }),
      });

      if (res.status === 400) {
        logPass('TEST 13 — Unapproved property cannot be booked', `Booking for pending property rejected with 400 Bad Request`);
      } else {
        logFail('TEST 13 — Unapproved property cannot be booked', new Error(`Expected 400, got status ${res.status}: ${JSON.stringify(res.json)}`));
      }
    } catch (err) {
      logFail('TEST 13 — Unapproved property cannot be booked', err);
    }

    // -------------------------------------------------------------------------
    // TEST 14 — Completed booking cannot be cancelled
    // -------------------------------------------------------------------------
    try {
      // Set createdBooking to Completed in DB
      await Booking.findByIdAndUpdate(createdBooking._id, { status: 'Completed' });

      const res = await request(`/bookings/${createdBooking.bookingRequestId}/cancel`, {
        method: 'PATCH',
        body: JSON.stringify({ reason: 'Emergency' }),
      });

      if (res.status === 400) {
        logPass('TEST 14 — Completed booking cannot be cancelled', `Attempt to cancel Completed booking safely rejected with 400 Bad Request`);
      } else {
        logFail('TEST 14 — Completed booking cannot be cancelled', new Error(`Expected 400, got status ${res.status}: ${JSON.stringify(res.json)}`));
      }
    } catch (err) {
      logFail('TEST 14 — Completed booking cannot be cancelled', err);
    }

    // -------------------------------------------------------------------------
    // TEST 15 — Customer cancellation
    // -------------------------------------------------------------------------
    try {
      // Create a second fresh booking to test cancellation
      const freshBookingRes = await request('/bookings', {
        method: 'POST',
        body: JSON.stringify({
          service: 'Stay',
          propertyId: propA._id.toString(),
          roomId: roomA._id.toString(),
          customerDetails: {
            name: 'Pema Bhutia',
            email: 'task8_cancel@example.com',
            phone: '9876543211',
          },
          schedule: { checkIn: '2026-11-01', checkOut: '2026-11-03', nights: 2 },
        }),
      });

      const cancelTarget = freshBookingRes.json?.data;

      // Customer cancels booking
      const cancelRes = await request(`/bookings/${cancelTarget.bookingRequestId}/cancel`, {
        method: 'PATCH',
        body: JSON.stringify({
          reason: 'Change of travel dates',
          notes: 'Customer rescheduled trip',
        }),
      });

      if (
        cancelRes.status === 200 &&
        cancelRes.json?.success &&
        cancelRes.json?.data?.status === 'Cancelled' &&
        cancelRes.json?.data?.cancellation?.cancelledAt
      ) {
        logPass(
          'TEST 15 — Customer cancellation',
          `Booking cancelled with status=Cancelled and cancellation metadata (Reason: ${cancelRes.json.data.cancellation.reason})`
        );
      } else {
        logFail('TEST 15 — Customer cancellation', new Error(`Cancellation failed: status=${cancelRes.status}, json=${JSON.stringify(cancelRes.json)}`));
      }
    } catch (err) {
      logFail('TEST 15 — Customer cancellation', err);
    }

    // -------------------------------------------------------------------------
    // TEST 16 — Duplicate submission protection
    // -------------------------------------------------------------------------
    try {
      const bookingFormPath = path.join(__dirname, '../../src/components/BookingForm.jsx');
      const bookingFormCode = fs.readFileSync(bookingFormPath, 'utf8');

      const hasIsSubmittingState = bookingFormCode.includes('isSubmitting');
      const hasDisabledAttribute = bookingFormCode.includes('disabled={isSubmitting}');
      const hasEarlyReturn = bookingFormCode.includes('if (isSubmitting) return');
      const hasSubmittingLabel = bookingFormCode.includes('Submitting Booking Request') || bookingFormCode.includes('Submitting Request');

      if (hasIsSubmittingState && hasDisabledAttribute && hasEarlyReturn && hasSubmittingLabel) {
        logPass(
          'TEST 16 — Duplicate submission protection',
          `BookingForm.jsx verified: enforces isSubmitting state, button disabled attribute, early return, and dynamic label`
        );
      } else {
        logFail(
          'TEST 16 — Duplicate submission protection',
          new Error(
            `Missing duplicate submission guards: isSubmitting=${hasIsSubmittingState}, disabled=${hasDisabledAttribute}, earlyReturn=${hasEarlyReturn}`
          )
        );
      }
    } catch (err) {
      logFail('TEST 16 — Duplicate submission protection', err);
    }

    // Cleanup test models
    await Property.deleteMany({ name: new RegExp(`Task 8 Test`, 'i') });
    await Room.deleteMany({ name: new RegExp(`Task 8 Room`, 'i') });
    await Booking.deleteMany({ 'customerDetails.email': new RegExp(`task8_`, 'i') });
    await mongoose.disconnect();

    console.log('\n================================================================');
    console.log(` TASK 8 TEST SUMMARY: ${passedTests}/${totalTests} TESTS PASSED`);
    console.log('================================================================\n');

    if (passedTests === totalTests) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  } catch (globalErr) {
    console.error('Fatal test execution error:', globalErr);
    process.exit(1);
  }
}

runTask8Tests();

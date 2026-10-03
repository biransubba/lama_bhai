const mongoose = require('mongoose');
const { User, Property, Room, Booking } = require('../models');

async function testBookingPipeline() {
  console.log('--- Starting Phase 10: Customer Booking System Test Suite ---');
  const { server } = require('../server');

  // Wait 1.5s for DB connection
  await new Promise((r) => setTimeout(r, 1500));

  const authUrl = 'http://localhost:5000/api/auth';
  const bookingUrl = 'http://localhost:5000/api/bookings';
  const ownerUrl = 'http://localhost:5000/api/owner';
  const adminUrl = 'http://localhost:5000/api/admin';
  const unique = Date.now().toString().slice(-5);

  try {
    // 1. Create Admin Account & Cookie
    const adminUser = await User.create({
      name: 'Booking Admin',
      email: `admin_bk_${unique}@lama.test`,
      password: 'password123',
      role: 'admin',
    });
    const adminLoginRes = await fetch(`${authUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminUser.email, password: 'password123' }),
    });
    const adminCookie = adminLoginRes.headers.get('set-cookie')?.split(';')[0];

    // 2. Create Owner, Property & Room
    const ownerUser = await User.create({
      name: 'Dawa Lepcha',
      email: `owner_bk_${unique}@lama.test`,
      password: 'password123',
      role: 'owner',
      partnerProfile: {
        agencyName: 'Lachung Mountain Retreats',
        location: 'Lachung, North Sikkim',
        verificationStatus: 'Approved',
      },
    });
    const ownerLoginRes = await fetch(`${authUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: ownerUser.email, password: 'password123' }),
    });
    const ownerCookie = ownerLoginRes.headers.get('set-cookie')?.split(';')[0];

    const testProperty = await Property.create({
      name: 'Lachung Alpine Haven',
      slug: `lachung-alpine-haven-${unique}`,
      type: 'Homestay',
      owner: ownerUser._id,
      description: 'Charming wood retreat in Lachung valley.',
      location: { district: 'North Sikkim', town: 'Lachung' },
      price: 2500,
      image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb',
      status: 'approved',
      active: true,
    });

    const testRoom = await Room.create({
      property: testProperty._id,
      name: 'Deluxe Pine Room',
      type: 'Deluxe Room',
      capacity: 2,
      price: 2500,
      availability: 'available',
    });

    // 3. Register Tourist & Cookie
    const touristUser = await User.create({
      name: 'Kiran Sharma',
      email: `kiran_${unique}@lama.test`,
      password: 'password123',
      role: 'tourist',
      phone: '+91 9811223344',
    });
    const touristLoginRes = await fetch(`${authUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: touristUser.email, password: 'password123' }),
    });
    const touristCookie = touristLoginRes.headers.get('set-cookie')?.split(';')[0];

    // TEST 1: Authenticated Tourist creates stay booking
    console.log('\n[1] Testing Authenticated Tourist creating booking (POST /api/bookings)...');
    const bookingPayload = {
      service: 'Stay',
      propertyId: testProperty._id.toString(),
      roomId: testRoom._id.toString(),
      schedule: {
        checkIn: '2026-10-15',
        checkOut: '2026-10-17', // 2 nights
      },
      travellers: 2,
      notes: 'Requesting mountain view room on upper floor',
    };

    const createRes = await fetch(bookingUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: touristCookie },
      body: JSON.stringify(bookingPayload),
    });
    const createJson = await createRes.json();
    console.log('Status:', createRes.status);
    console.log('Tracking ID:', createJson.data?.bookingRequestId);
    console.log('Calculated Price:', createJson.data?.pricing?.totalPrice);
    console.log('Assigned Partner:', createJson.data?.partner);

    if (createRes.status !== 201 || !createJson.data?.bookingRequestId) {
      throw new Error('Booking creation failed');
    }
    if (createJson.data.pricing.totalPrice !== 5000) {
      throw new Error(`Expected 5000 INR (2 nights x 2500), got: ${createJson.data.pricing.totalPrice}`);
    }
    const bookingId = createJson.data._id;
    const trackingCode = createJson.data.bookingRequestId;
    console.log('✓ Booking creation & automatic pricing calculation verified.');

    // TEST 2: Guest tourist booking (without session cookie)
    console.log('\n[2] Testing Guest Tourist checkout without login...');
    const guestPayload = {
      service: 'Permit',
      customerDetails: {
        name: 'Anita Roy',
        email: 'anita.guest@example.com',
        phone: '+91 9845012345',
        nationality: 'Indian',
      },
      travellers: 3,
      notes: 'North Sikkim Gurudongmar permit request',
    };
    const guestRes = await fetch(bookingUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(guestPayload),
    });
    const guestJson = await guestRes.json();
    console.log('Status:', guestRes.status);
    console.log('Guest Tracking Code:', guestJson.data?.bookingRequestId);
    if (guestRes.status !== 201) throw new Error('Guest booking failed');
    console.log('✓ Guest booking verified.');

    // TEST 3: Tourist personal booking history
    console.log('\n[3] Testing GET /api/bookings/my (Tourist history)...');
    const myBookingsRes = await fetch(`${bookingUrl}/my`, {
      headers: { Cookie: touristCookie },
    });
    const myBookingsJson = await myBookingsRes.json();
    console.log('Status:', myBookingsRes.status);
    console.log('My Bookings Count:', myBookingsJson.count);
    const foundMyBooking = myBookingsJson.data.some((b) => b._id === bookingId);
    if (!foundMyBooking) throw new Error('Created booking not found in customer history');
    console.log('✓ Customer reservation history verified.');

    // TEST 4: Lookup booking by reference code
    console.log(`\n[4] Testing GET /api/bookings/${trackingCode} (Reference Code Lookup)...`);
    const lookupRes = await fetch(`${bookingUrl}/${trackingCode}`);
    const lookupJson = await lookupRes.json();
    console.log('Status:', lookupRes.status);
    console.log('Resolved Property Name:', lookupJson.data?.propertyName);
    console.log('Resolved Room Name:', lookupJson.data?.roomName);
    if (lookupRes.status !== 200 || lookupJson.data?.bookingRequestId !== trackingCode) {
      throw new Error('Reference code lookup failed');
    }
    console.log('✓ Public reference tracking code lookup verified.');

    // TEST 5: Partner checks assigned bookings
    console.log('\n[5] Testing GET /api/owner/bookings (Host queue)...');
    const hostBookingsRes = await fetch(`${ownerUrl}/bookings`, {
      headers: { Cookie: ownerCookie },
    });
    const hostBookingsJson = await hostBookingsRes.json();
    console.log('Status:', hostBookingsRes.status);
    console.log('Bookings assigned to host:', hostBookingsJson.count);
    const foundHostBooking = hostBookingsJson.data.some((b) => b._id === bookingId);
    if (!foundHostBooking) throw new Error('Booking not found in host queue');
    console.log('✓ Host reservation queue verified.');

    // TEST 6: Host updates booking status
    console.log(`\n[6] Testing PATCH /api/owner/bookings/${bookingId}/status -> Confirmed...`);
    const updateStatusRes = await fetch(`${ownerUrl}/bookings/${bookingId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: ownerCookie },
      body: JSON.stringify({ status: 'Confirmed' }),
    });
    const updateStatusJson = await updateStatusRes.json();
    console.log('Status:', updateStatusRes.status);
    console.log('Updated Booking Status:', updateStatusJson.data?.status);
    if (updateStatusJson.data?.status !== 'Confirmed') throw new Error('Status update failed');
    console.log('✓ Host status management verified.');

    // TEST 7: Customer cancellation
    console.log(`\n[7] Testing PATCH /api/bookings/${bookingId}/cancel...`);
    const cancelRes = await fetch(`${bookingUrl}/${bookingId}/cancel`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: touristCookie },
      body: JSON.stringify({ reason: 'Trip dates rescheduled' }),
    });
    const cancelJson = await cancelRes.json();
    console.log('Status:', cancelRes.status);
    console.log('Cancellation Status:', cancelJson.data?.status);
    console.log('Cancelled By:', cancelJson.data?.cancellation?.cancelledBy);
    if (cancelJson.data?.status !== 'Cancelled') throw new Error('Customer cancellation failed');
    console.log('✓ Customer reservation cancellation verified.');

    // TEST 8: Admin master bookings view
    console.log('\n[8] Testing Admin GET /api/admin/bookings...');
    const adminBookingsRes = await fetch(`${adminUrl}/bookings`, {
      headers: { Cookie: adminCookie },
    });
    const adminBookingsJson = await adminBookingsRes.json();
    console.log('Status:', adminBookingsRes.status);
    console.log('Master Bookings Count:', adminBookingsJson.count);
    if (adminBookingsJson.count < 2) throw new Error('Admin master bookings view incomplete');
    console.log('✓ Admin master bookings audit verified.');

    console.log('\n======================================================');
    console.log(' ALL BOOKING PIPELINE TESTS PASSED (8/8)!             ');
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

testBookingPipeline();

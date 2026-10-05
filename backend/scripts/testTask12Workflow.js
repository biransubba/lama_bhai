/**
 * Task 12 Full Workflow Test Suite
 *
 * Verifies:
 * 1. Admin creates Partner (Biran Subba, Biran Homestay, Namchi, Sikkim)
 * 2. Partner logs in via POST /api/auth/login and receives session
 * 3. Partner creates 3 room listings: Standard Room, Deluxe Room, Family Room
 * 4. All 3 listings initially have status = 'pending' and inherit partner location
 * 5. Admin queries listings via GET /api/admin/rooms
 * 6. Admin approves Deluxe Room via PATCH /api/admin/rooms/:id/status
 * 7. Admin rejects Family Room with rejectionReason via PATCH /api/admin/rooms/:id/status
 * 8. Public website GET /api/properties/:slug/rooms returns ONLY approved Deluxe Room
 * 9. Public website does NOT return pending (Standard) or rejected (Family) rooms
 * 10. Partner edits approved room -> status resets to 'pending' (Section 17)
 * 11. Admin re-approves -> room is visible publicly again
 */

const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { User, Property, Room } = require('../models');

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000/api';

let passedTests = 0;
let failedTests = 0;

function logPass(title, details = '') {
  passedTests++;
  console.log(`✓ PASS: ${title} ${details ? `(${details})` : ''}`);
}

function logFail(title, error) {
  failedTests++;
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

async function runTask12Tests() {
  console.log('================================================================');
  console.log(' STARTING TASK 12: FINAL PARTNER -> LISTING -> ADMIN WORKFLOW   ');
  console.log('================================================================\n');

  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/lama-bhaila');

  const uniqueSuffix = Date.now().toString().slice(-6);

  try {
    // 0. Setup: Create an Admin user for testing
    console.log('[Setup] Registering Admin account for test...');
    const adminEmail = `admin_task12_${uniqueSuffix}@lama.test`;
    const adminPassword = 'adminPassword123!';

    const adminUser = await User.create({
      name: 'Task 12 Super Admin',
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
      isActive: true,
    });

    // Login as Admin to get Admin session
    const adminLoginRes = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: adminEmail, password: adminPassword }),
    });

    const adminCookie = adminLoginRes.cookie;
    if (!adminCookie) {
      throw new Error(`Failed to obtain admin session cookie: status ${adminLoginRes.status}`);
    }
    console.log('[Setup] Admin logged in successfully.\n');

    // ----------------------------------------------------------------
    // STEP 1: Admin Creates Partner (Biran Subba)
    // ----------------------------------------------------------------
    console.log('--- Step 1: Admin Creates Partner ---');
    const partnerEmail = `biran_subba_${uniqueSuffix}@lama.test`;
    const partnerPassword = 'password123';
    const createPartnerPayload = {
      name: 'Biran Subba',
      businessName: 'Biran Homestay',
      phone: '9800112233',
      email: partnerEmail,
      district: 'South Sikkim',
      town: 'Namchi',
      address: 'Central Namchi, Near Helipad Road',
      pincode: '737126',
      password: partnerPassword,
      retypePassword: partnerPassword,
    };

    const createPartnerRes = await request('/admin/partners', {
      method: 'POST',
      headers: { Cookie: adminCookie },
      body: JSON.stringify(createPartnerPayload),
    });

    if (createPartnerRes.status === 201 && createPartnerRes.json?.success) {
      logPass('Admin creates Partner account (POST /api/admin/partners 201)', createPartnerRes.json.data?.name);
    } else {
      logFail('Admin creates Partner account', createPartnerRes.json || createPartnerRes.status);
    }

    const createdPartner = await User.findOne({ email: partnerEmail });
    if (createdPartner && createdPartner.role === 'partner' && createdPartner.partnerProfile?.town === 'Namchi') {
      logPass("Created partner has role: 'partner' and structured location fields", `${createdPartner.partnerProfile.businessName} in ${createdPartner.partnerProfile.town}`);
    } else {
      logFail('Verify created partner in DB', createdPartner);
    }

    // Verify parent Property container was auto-created and pre-approved
    const partnerProperty = await Property.findOne({ owner: createdPartner._id });
    if (partnerProperty && partnerProperty.status === 'approved' && partnerProperty.name === 'Biran Homestay') {
      logPass('Auto-created parent Property container is pre-approved', `Slug: ${partnerProperty.slug}`);
    } else {
      logFail('Parent property auto-creation', partnerProperty);
    }

    // ----------------------------------------------------------------
    // STEP 2: Partner Login
    // ----------------------------------------------------------------
    console.log('\n--- Step 2: Partner Login ---');
    const partnerLoginRes = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: partnerEmail, password: partnerPassword }),
    });

    const partnerCookie = partnerLoginRes.cookie;
    if (partnerLoginRes.status === 200 && partnerCookie) {
      logPass('Partner logs in with credentials via POST /api/auth/login');
    } else {
      logFail('Partner login failed', partnerLoginRes.json || partnerLoginRes.status);
    }

    const meRes = await request('/auth/me', {
      method: 'GET',
      headers: { Cookie: partnerCookie },
    });
    if (meRes.status === 200 && (meRes.json?.data?.role === 'partner' || meRes.json?.user?.role === 'partner')) {
      logPass("GET /api/auth/me confirms session role is 'partner'");
    } else {
      logFail('GET /api/auth/me for partner', meRes.json);
    }

    // ----------------------------------------------------------------
    // STEP 3: Partner Creates 3 Room Listings
    // ----------------------------------------------------------------
    console.log('\n--- Step 3: Partner Creates 3 Room Listings ---');
    const roomPayloads = [
      {
        name: 'Standard Room',
        type: 'Standard',
        price: 1500,
        capacity: 2,
        bedType: 'Double Bed',
        description: 'Cozy standard room with mountain view and geyser.',
        amenities: ['Geyser', 'Mountain View'],
        image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427',
      },
      {
        name: 'Deluxe Room',
        type: 'Deluxe',
        price: 2500,
        capacity: 3,
        bedType: 'King Bed',
        description: 'Spacious deluxe room with balcony and panoramic Kanchenjunga view.',
        amenities: ['WiFi', 'Balcony', 'Geyser', 'Mountain View', 'Breakfast Included'],
        image: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a',
      },
      {
        name: 'Family Room',
        type: 'Family',
        price: 3500,
        capacity: 4,
        bedType: '2 Double Beds',
        description: 'Large family suite suitable for up to 4 adults with attached private bath.',
        amenities: ['WiFi', 'TV', 'Geyser', 'Mountain View'],
        image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b',
      },
    ];

    const createdRooms = [];
    for (const rData of roomPayloads) {
      const res = await request('/owner/rooms', {
        method: 'POST',
        headers: { Cookie: partnerCookie },
        body: JSON.stringify(rData),
      });

      if (res.status === 201 && res.json?.success) {
        createdRooms.push(res.json.data);
        logPass(`Created room listing '${rData.name}'`, `status: ${res.json.data?.status}`);
      } else {
        logFail(`Create room listing '${rData.name}'`, res.json || res.status);
      }
    }

    const standardRoom = createdRooms.find((r) => r.name === 'Standard Room');
    const deluxeRoom = createdRooms.find((r) => r.name === 'Deluxe Room');
    const familyRoom = createdRooms.find((r) => r.name === 'Family Room');

    // Verify all 3 start as 'pending'
    if (
      standardRoom?.status === 'pending' &&
      deluxeRoom?.status === 'pending' &&
      familyRoom?.status === 'pending'
    ) {
      logPass("All 3 room listings default to status: 'pending' awaiting Admin review");
    } else {
      logFail('Default room status verification', { standardRoom, deluxeRoom, familyRoom });
    }

    // Verify location inheritance
    if (deluxeRoom?.location?.town === 'Namchi' && deluxeRoom?.location?.district === 'South Sikkim') {
      logPass('Listing inherits partner profile location', `${deluxeRoom.location.town}, ${deluxeRoom.location.district}`);
    } else {
      logFail('Listing location inheritance', deluxeRoom?.location);
    }

    // ----------------------------------------------------------------
    // STEP 4: Admin Listings Moderation
    // ----------------------------------------------------------------
    console.log('\n--- Step 4: Admin Listings Moderation ---');
    const adminRoomsRes = await request('/admin/rooms', {
      method: 'GET',
      headers: { Cookie: adminCookie },
    });

    if (adminRoomsRes.status === 200 && Array.isArray(adminRoomsRes.json?.data)) {
      logPass('Admin retrieves listings via GET /api/admin/rooms', `Count: ${adminRoomsRes.json.data.length}`);
    } else {
      logFail('Admin GET /api/admin/rooms', adminRoomsRes.json);
    }

    // Admin Approves Deluxe Room
    console.log('\n[Action] Admin Approves Deluxe Room...');
    const approveRes = await request(`/admin/rooms/${deluxeRoom._id}/status`, {
      method: 'PATCH',
      headers: { Cookie: adminCookie },
      body: JSON.stringify({ status: 'approved' }),
    });

    if (approveRes.status === 200 && approveRes.json?.data?.status === 'approved') {
      logPass("Deluxe Room status updated to 'approved' via PATCH /api/admin/rooms/:id/status");
    } else {
      logFail('Admin approve Deluxe Room', approveRes.json);
    }

    // Admin Rejects Family Room
    console.log('[Action] Admin Rejects Family Room with reason...');
    const rejectReason = 'Rate exceeds homestay pricing ceiling for South Sikkim';
    const rejectRes = await request(`/admin/rooms/${familyRoom._id}/status`, {
      method: 'PATCH',
      headers: { Cookie: adminCookie },
      body: JSON.stringify({ status: 'rejected', rejectionReason: rejectReason }),
    });

    if (
      rejectRes.status === 200 &&
      rejectRes.json?.data?.status === 'rejected' &&
      (rejectRes.json?.data?.rejectionReason === rejectReason || rejectRes.json?.data?.reviewerNotes === rejectReason)
    ) {
      logPass("Family Room status updated to 'rejected' with reason stored");
    } else {
      logFail('Admin reject Family Room', rejectRes.json);
    }

    // ----------------------------------------------------------------
    // STEP 5: Public Website Visibility Rule (Section 28)
    // ----------------------------------------------------------------
    console.log('\n--- Step 5: Public Website Visibility Rule ---');
    const publicRoomsRes = await request(`/properties/${partnerProperty._id}/rooms`, {
      method: 'GET',
    });

    const publicRooms = publicRoomsRes.json?.data || [];
    const publicRoomNames = publicRooms.map((r) => r.name);

    if (publicRoomsRes.status === 200) {
      if (publicRoomNames.includes('Deluxe Room')) {
        logPass("Approved 'Deluxe Room' IS visible on public website endpoint", publicRoomNames.join(', '));
      } else {
        logFail("Approved 'Deluxe Room' is missing from public website", publicRoomNames);
      }

      if (!publicRoomNames.includes('Standard Room')) {
        logPass("Pending 'Standard Room' is NOT visible to public travelers");
      } else {
        logFail("Pending 'Standard Room' should NOT be visible publicly", publicRoomNames);
      }

      if (!publicRoomNames.includes('Family Room')) {
        logPass("Rejected 'Family Room' is NOT visible to public travelers");
      } else {
        logFail("Rejected 'Family Room' should NOT be visible publicly", publicRoomNames);
      }
    } else {
      logFail('GET /api/properties/:id/rooms', publicRoomsRes.json);
    }

    // Check public getPropertyBySlug
    const publicSlugRes = await request(`/properties/${partnerProperty.slug}`, {
      method: 'GET',
    });
    const slugRooms = publicSlugRes.json?.data?.rooms || [];
    const slugRoomNames = slugRooms.map((r) => r.name);

    if (slugRoomNames.includes('Deluxe Room') && !slugRoomNames.includes('Standard Room') && !slugRoomNames.includes('Family Room')) {
      logPass('GET /api/properties/:slug also returns ONLY approved room listings');
    } else {
      logFail('GET /api/properties/:slug room filtering', slugRoomNames);
    }

    // ----------------------------------------------------------------
    // STEP 6: Partner Edits Approved Listing -> Resets to Pending (Section 17)
    // ----------------------------------------------------------------
    console.log('\n--- Step 6: Partner Edits Approved Listing -> Resets to Pending ---');
    const editRes = await request(`/owner/rooms/${deluxeRoom._id}`, {
      method: 'PUT',
      headers: { Cookie: partnerCookie },
      body: JSON.stringify({
        price: 2700,
        name: 'Deluxe Room (Renovated)',
      }),
    });

    if (editRes.status === 200 && editRes.json?.data?.status === 'pending') {
      logPass("Editing an approved room listing resets its status to 'pending' (Section 17 rule)");
    } else {
      logFail('Edit approved room reset to pending', editRes.json);
    }

    // Verify it is temporarily removed from public view
    const publicAfterEditRes = await request(`/properties/${partnerProperty._id}/rooms`, {
      method: 'GET',
    });
    const publicAfterEditRooms = publicAfterEditRes.json?.data || [];
    if (publicAfterEditRooms.length === 0) {
      logPass('Edited room is immediately hidden from public view while awaiting re-approval');
    } else {
      logFail('Edited room should be hidden while pending', publicAfterEditRooms.map((r) => r.name));
    }

    // Admin re-approves
    const reApproveRes = await request(`/admin/rooms/${deluxeRoom._id}/status`, {
      method: 'PATCH',
      headers: { Cookie: adminCookie },
      body: JSON.stringify({ status: 'approved' }),
    });

    if (reApproveRes.status === 200 && reApproveRes.json?.data?.status === 'approved') {
      logPass('Admin re-approves the edited room');
    } else {
      logFail('Admin re-approve', reApproveRes.json);
    }

    const publicAfterReApprove = await request(`/properties/${partnerProperty._id}/rooms`, {
      method: 'GET',
    });
    if ((publicAfterReApprove.json?.data || []).some((r) => r._id === deluxeRoom._id)) {
      logPass('Re-approved room is visible on public website again');
    } else {
      logFail('Re-approved room visibility', publicAfterReApprove.json);
    }

    // ----------------------------------------------------------------
    // Cleanup
    // ----------------------------------------------------------------
    console.log('\n[Cleanup] Cleaning up test records...');
    await Room.deleteMany({ _id: { $in: [standardRoom._id, deluxeRoom._id, familyRoom._id] } });
    await Property.deleteMany({ _id: partnerProperty._id });
    await User.deleteMany({ _id: { $in: [adminUser._id, createdPartner._id] } });
    console.log('[Cleanup] Done.\n');

  } catch (error) {
    console.error('Test execution error:', error);
  } finally {
    await mongoose.disconnect();
  }

  console.log('================================================================');
  console.log(` TASK 12 TEST RESULTS: ${passedTests} PASSED, ${failedTests} FAILED `);
  console.log('================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTask12Tests();

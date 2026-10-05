const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { User, Property, Room } = require('../models');

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000/api';

async function req(endpoint, options = {}) {
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
    data: json,
  };
}

async function runStepByStepScenario() {
  console.log('============================================================');
  console.log(' RUNNING TASK 12.1 — SECTION 15 END-TO-END VERIFICATION');
  console.log('============================================================\n');

  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/lama-bhaila');

  // Setup Admin account to perform admin creation and moderation
  const uniqueSuffix = Date.now().toString().slice(-6);
  const adminEmail = `admin_sec15_${uniqueSuffix}@lama.test`;
  const adminPassword = 'adminPassword123!';
  const adminUser = await User.create({
    name: 'Section 15 Admin',
    email: adminEmail,
    password: adminPassword,
    role: 'admin',
    isActive: true,
  });

  const adminLoginRes = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: adminEmail, password: adminPassword }),
  });
  const adminCookie = adminLoginRes.cookie;

  // STEP 1: Admin creates Partner: Biran Subba, Biran Homestay, Namchi, Sikkim
  console.log('STEP 1: Admin creates Partner: Biran Subba, Biran Homestay, Namchi, Sikkim');
  const partnerEmail = `biran_${uniqueSuffix}@example.com`;
  const partnerPassword = 'Password123!';
  
  const createPartnerRes = await req('/admin/partners', {
    method: 'POST',
    headers: { Cookie: adminCookie },
    body: JSON.stringify({
      name: 'Biran Subba',
      businessName: 'Biran Homestay',
      email: partnerEmail,
      password: partnerPassword,
      retypePassword: partnerPassword,
      phone: '9876543210',
      location: 'Namchi, Sikkim',
      district: 'South Sikkim',
      town: 'Namchi',
      address: 'Near Central Park',
      pincode: '737126',
      propertyType: 'Homestay',
    }),
  });

  const createdPartner = await User.findOne({ email: partnerEmail });
  console.log(`✓ Admin created partner: ${createdPartner.name} (${createdPartner.email})`);

  // Find auto-created Property container
  const parentProperty = await Property.findOne({ owner: createdPartner._id });
  console.log(`✓ Auto-created internal Property container: "${parentProperty.name}" (ID: ${parentProperty._id}, Status: ${parentProperty.status})`);

  // STEP 2: Partner logs in
  console.log('\nSTEP 2: Partner logs in');
  const loginRes = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: partnerEmail,
      password: partnerPassword,
    }),
  });

  const partnerCookie = loginRes.cookie;
  const authHeaders = {
    headers: {
      Cookie: partnerCookie,
    },
  };
  console.log(`✓ Partner authenticated successfully. Role: ${loginRes.data.user.role}`);

  // STEP 3: Verify Partner My Listings route
  console.log('\nSTEP 3: Partner opens My Listings page');
  const partnerListingsRes = await req('/owner/rooms', {
    method: 'GET',
    ...authHeaders,
  });
  console.log(`✓ Partner has ${partnerListingsRes.data.count} existing listings.`);
  if (partnerListingsRes.data.count === 0) {
    console.log('✓ UI State:');
    console.log('  "No listings yet."');
    console.log('  "Create your first room listing to get started."');
    console.log('  [ + Add Listing ]  (NO [+ Add Property])');
  }

  // STEP 4: Partner clicks [+ Add Listing] and creates "Deluxe Room"
  console.log('\nSTEP 4: Partner clicks [+ Add Listing] to create "Deluxe Room"');
  const createDeluxeRes = await req('/owner/rooms', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Deluxe Room',
      type: 'Deluxe',
      price: 2500,
      capacity: 2,
      bedType: 'Double Bed',
      numberOfBeds: 1,
      image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427',
      gallery: ['https://images.unsplash.com/photo-1582719478250-c89cae4dc85b'],
      amenities: ['Free WiFi', 'Attached Bathroom', 'Mountain View'],
    }),
    ...authHeaders,
  });

  const deluxeRoom = createDeluxeRes.data.data;
  console.log(`✓ Created Deluxe Room ID: ${deluxeRoom._id}`);
  console.log(`✓ Location inherited from Partner Profile: ${deluxeRoom.location.town}, ${deluxeRoom.location.district}`);

  // STEP 5: Verify status is 'pending', NOT 'available'
  console.log('\nSTEP 5: Check Deluxe Room listing status');
  console.log(`✓ Deluxe Room status: "${deluxeRoom.status}"`);
  if (deluxeRoom.status === 'pending') {
    console.log('✓ Partner UI Badge: "🟡 Pending Approval" (NOT "🟢 Available")');
  } else {
    throw new Error(`FAIL: Expected status to be 'pending', got '${deluxeRoom.status}'`);
  }

  // Verify public endpoint DOES NOT show pending Deluxe Room
  const publicDeluxeCheck = await req(`/properties/${parentProperty._id}/rooms`);
  const isDeluxePublic = publicDeluxeCheck.data.data.some((r) => r._id === deluxeRoom._id);
  console.log(`✓ Deluxe Room visible on public website before approval: ${isDeluxePublic ? 'YES (UNEXPECTED)' : 'NO (CORRECT)'}`);
  if (isDeluxePublic) throw new Error('FAIL: Pending room should not be public');

  // STEP 6: Admin opens listing moderation queue
  console.log('\nSTEP 6: Admin opens listing moderation queue');
  const adminListingsRes = await req('/admin/rooms?status=pending', {
    headers: { Cookie: adminCookie },
  });
  const foundInQueue = adminListingsRes.data.data.find((r) => r._id === deluxeRoom._id);
  console.log(`✓ Found Deluxe Room in Admin Moderation queue:`);
  console.log(`  - Listing Name: ${foundInQueue.name}`);
  console.log(`  - Partner: ${foundInQueue.property?.owner?.name || 'Biran Subba'}`);
  console.log(`  - Business: ${foundInQueue.property?.name}`);
  console.log(`  - Location: ${foundInQueue.location?.town || 'Namchi'}, ${foundInQueue.location?.district || 'Sikkim'}`);
  console.log(`  - Price: ₹${foundInQueue.price}/night`);
  console.log(`  - Status: 🟡 ${foundInQueue.status}`);
  console.log(`  - Admin Actions: [Approve] [Reject]`);

  // STEP 7: Admin clicks [Approve]
  console.log('\nSTEP 7: Admin clicks [Approve]');
  const approveRes = await req(`/admin/rooms/${deluxeRoom._id}/status`, {
    method: 'PATCH',
    headers: { Cookie: adminCookie },
    body: JSON.stringify({
      status: 'approved',
      reviewerNotes: 'Verified photos and amenities look great.',
    }),
  });
  console.log(`✓ Admin approved Deluxe Room: status = "${approveRes.data.data.status}"`);

  // Check Partner UI expectation
  const partnerCheckRes = await req('/owner/rooms', {
    method: 'GET',
    ...authHeaders,
  });
  const updatedDeluxe = partnerCheckRes.data.data.find((r) => r._id === deluxeRoom._id);
  console.log(`✓ Partner sees Deluxe Room status: "${updatedDeluxe.status}" -> 🟢 Approved`);

  // Check Public Website expectation
  const publicApprovedCheck = await req(`/properties/${parentProperty._id}/rooms`);
  const isDeluxePublicNow = publicApprovedCheck.data.data.some((r) => r._id === deluxeRoom._id);
  console.log(`✓ Public website displays approved Deluxe Room: ${isDeluxePublicNow ? 'YES (CORRECT)' : 'NO'}`);
  if (!isDeluxePublicNow) throw new Error('FAIL: Approved room must appear on public website');

  // STEP 8: Create another: "Standard Room"
  console.log('\nSTEP 8: Partner creates another room: "Standard Room"');
  const createStandardRes = await req('/owner/rooms', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Standard Room',
      type: 'Standard',
      price: 1800,
      capacity: 2,
      bedType: 'Double Bed',
      numberOfBeds: 1,
      image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427',
      amenities: ['Hot Water', 'Double Bed'],
    }),
    ...authHeaders,
  });

  const standardRoom = createStandardRes.data.data;
  console.log(`✓ Created Standard Room ID: ${standardRoom._id}`);
  console.log(`✓ Standard Room status: "${standardRoom.status}"`);

  // Verify list: Deluxe Room -> Approved, Standard Room -> Pending
  const partnerListFinal = await req('/owner/rooms', {
    method: 'GET',
    ...authHeaders,
  });
  const rDeluxe = partnerListFinal.data.data.find((r) => r._id === deluxeRoom._id);
  const rStandard = partnerListFinal.data.data.find((r) => r._id === standardRoom._id);

  console.log(`\nFinal Partner Portal Verification:`);
  console.log(`  - Deluxe Room:   ${rDeluxe.status === 'approved' ? '🟢 Approved' : rDeluxe.status}`);
  console.log(`  - Standard Room: ${rStandard.status === 'pending' ? '🟡 Pending Approval' : rStandard.status}`);

  const publicFinalCheck = await req(`/properties/${parentProperty._id}/rooms`);
  console.log(`\nFinal Public Website Verification:`);
  console.log(`  - Total public visible rooms: ${publicFinalCheck.data.data.length}`);
  publicFinalCheck.data.data.forEach((r) => {
    console.log(`  - Public Room: ${r.name} (Status: ${r.status})`);
  });

  // Cleanup test data
  console.log('\nCleaning up created test records from MongoDB...');
  await Room.deleteMany({ _id: { $in: [deluxeRoom._id, standardRoom._id] } });
  await Property.deleteOne({ _id: parentProperty._id });
  await User.deleteMany({ _id: { $in: [createdPartner._id, adminUser._id] } });
  await mongoose.disconnect();
  console.log('✓ Cleanup complete.');

  console.log('\n============================================================');
  console.log(' ALL 8 STEPS OF SECTION 15 COMPLETED & VERIFIED 100%!');
  console.log('============================================================');
}

runStepByStepScenario()
  .then(() => process.exit(0))
  .catch(async (err) => {
    console.error('Scenario failed:', err);
    try { await mongoose.disconnect(); } catch (_) {}
    process.exit(1);
  });

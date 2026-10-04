/**
 * Task 7 Test Suite: Public Stays & Rooms Backend Integration
 *
 * Verifies:
 * - Test 1: Approved property visible (GET /api/properties returns 200 and includes approved property)
 * - Test 2: Pending property hidden (status=pending is excluded from public GET /api/properties)
 * - Test 3: Rejected property hidden (status=rejected is excluded from public GET /api/properties)
 * - Test 4: Draft property hidden (status=draft is excluded from public GET /api/properties)
 * - Test 5: Property details (GET /api/properties/:id returns 200 and matching data for approved stay)
 * - Test 6: Unapproved property details (GET /api/properties/:id returns 404 for pending/rejected/draft)
 * - Test 7: Rooms endpoint (GET /api/properties/:id/rooms returns only rooms belonging to that property)
 * - Test 8: Cross-property room access (GET /api/properties/:propA/rooms/:roomB returns 404)
 * - Test 9: Public persistence on Admin approval (Property approved reflects immediately in public GET)
 * - Test 10: No local fallback (HotelHomestay.jsx & StayDetails.jsx do not import from staysStore.js)
 */

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { User, Property, Room } = require('../models');

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000/api';

let passedTests = 0;
const totalTests = 10;

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

async function runTask7Tests() {
  console.log('================================================================');
  console.log(' STARTING TASK 7: PUBLIC STAYS & ROOMS BACKEND INTEGRATION TEST ');
  console.log('================================================================\n');

  try {
    // 0. Connect DB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/lama-bhaila');

    // Setup Test Owner and Properties
    const timestamp = Date.now();
    let testOwner = await User.findOne({ email: 'test_owner_task7@lamabhai.com' });
    if (!testOwner) {
      testOwner = await User.create({
        name: 'Task 7 Test Host',
        email: 'test_owner_task7@lamabhai.com',
        password: 'Password123!',
        phone: '9800000007',
        role: 'owner',
        partnerProfile: {
          agencyName: 'Task 7 Himalayan Homestays',
          accountStatus: 'approved',
          location: 'Yuksom, West Sikkim',
        },
      });
    }

    // Clean any prior task7 test properties
    await Property.deleteMany({ name: new RegExp(`Task 7 Test`, 'i') });
    await Room.deleteMany({ name: new RegExp(`Task 7 Room`, 'i') });

    // Create Approved Property A
    const propApprovedA = await Property.create({
      name: `Task 7 Test Approved Homestay A ${timestamp}`,
      slug: `task-7-approved-a-${timestamp}`,
      owner: testOwner._id,
      type: 'Homestay',
      status: 'approved',
      active: true,
      description: 'An authentic mountain homestay in Yuksom with organic garden view.',
      location: {
        address: 'Near Dubdi Monastery',
        town: 'Yuksom',
        district: 'West Sikkim',
      },
      price: 2400,
      image: 'https://res.cloudinary.com/demo/image/upload/v1/yuksom_cover.jpg',
      gallery: [
        { src: 'https://res.cloudinary.com/demo/image/upload/v1/yuksom_gal1.jpg' },
        { src: 'https://res.cloudinary.com/demo/image/upload/v1/yuksom_gal2.jpg' },
      ],
      amenities: ['WiFi', 'Home Cooked Meals', 'Mountain View'],
    });

    // Create Approved Property B (for cross-property testing)
    const propApprovedB = await Property.create({
      name: `Task 7 Test Approved Hotel B ${timestamp}`,
      slug: `task-7-approved-b-${timestamp}`,
      owner: testOwner._id,
      type: 'Hotel',
      status: 'approved',
      active: true,
      description: 'A cozy boutique hotel in Lachung overlooking snow peaks.',
      location: {
        address: 'Main Town Road',
        town: 'Lachung',
        district: 'North Sikkim',
      },
      price: 3800,
      image: 'https://res.cloudinary.com/demo/image/upload/v1/lachung_cover.jpg',
      gallery: [{ src: 'https://res.cloudinary.com/demo/image/upload/v1/lachung_gal1.jpg' }],
      amenities: ['Geyser', 'Heater', 'Restaurant'],
    });

    // Create Pending Property
    const propPending = await Property.create({
      name: `Task 7 Test Pending Stay ${timestamp}`,
      slug: `task-7-pending-${timestamp}`,
      owner: testOwner._id,
      type: 'Homestay',
      status: 'pending',
      active: true,
      description: 'Pending review by Lama Bhai moderation team.',
      location: {
        town: 'Pelling',
        district: 'West Sikkim',
      },
      price: 2000,
      image: 'https://res.cloudinary.com/demo/image/upload/v1/pelling_cover.jpg',
    });

    // Create Rejected Property
    const propRejected = await Property.create({
      name: `Task 7 Test Rejected Stay ${timestamp}`,
      slug: `task-7-rejected-${timestamp}`,
      owner: testOwner._id,
      type: 'Resort',
      status: 'rejected',
      active: true,
      description: 'Rejected due to missing trade license.',
      location: {
        town: 'Gangtok',
        district: 'East Sikkim',
      },
      price: 5000,
      image: 'https://res.cloudinary.com/demo/image/upload/v1/gangtok_cover.jpg',
    });

    // Create Draft Property
    const propDraft = await Property.create({
      name: `Task 7 Test Draft Stay ${timestamp}`,
      slug: `task-7-draft-${timestamp}`,
      owner: testOwner._id,
      type: 'Guest House',
      status: 'draft',
      active: true,
      description: 'Draft property being edited by host.',
      location: {
        town: 'Namchi',
        district: 'South Sikkim',
      },
      price: 1800,
      image: 'https://res.cloudinary.com/demo/image/upload/v1/namchi_cover.jpg',
    });

    // Create Rooms for Property A
    const roomA1 = await Room.create({
      property: propApprovedA._id,
      name: `Task 7 Room Deluxe Valley View ${timestamp}`,
      type: 'Deluxe Room',
      description: 'King bed with panoramic Dubdi valley view.',
      capacity: 2,
      bedConfiguration: '1 King Bed',
      price: 2600,
      amenities: ['Balcony', 'En-suite Bathroom', 'Electric Kettle'],
      image: 'https://res.cloudinary.com/demo/image/upload/v1/room_a1.jpg',
      availability: 'available',
      active: true,
    });

    const roomA2 = await Room.create({
      property: propApprovedA._id,
      name: `Task 7 Room Attic Suite ${timestamp}`,
      type: 'Family Room',
      description: 'Spacious wooden attic suite for family of four.',
      capacity: 4,
      bedConfiguration: '2 Queen Beds',
      price: 4200,
      amenities: ['Balcony', 'Heating', 'Mountain View'],
      image: 'https://res.cloudinary.com/demo/image/upload/v1/room_a2.jpg',
      availability: 'available',
      active: true,
    });

    // Link rooms to Property A
    propApprovedA.rooms = [roomA1._id, roomA2._id];
    await propApprovedA.save();

    // Create Room for Property B
    const roomB1 = await Room.create({
      property: propApprovedB._id,
      name: `Task 7 Room B Snowflake Suite ${timestamp}`,
      type: 'Suite',
      description: 'Luxury snow-view suite in Lachung.',
      capacity: 2,
      price: 4500,
      image: 'https://res.cloudinary.com/demo/image/upload/v1/room_b1.jpg',
      availability: 'available',
      active: true,
    });
    propApprovedB.rooms = [roomB1._id];
    await propApprovedB.save();

    // -------------------------------------------------------------------------
    // TEST 1 — Approved property visible
    // -------------------------------------------------------------------------
    try {
      const res = await request('/properties?limit=50');
      if (res.status === 200 && res.json && res.json.success && Array.isArray(res.json.data)) {
        const foundA = res.json.data.some((p) => p._id === propApprovedA._id.toString());
        const foundB = res.json.data.some((p) => p._id === propApprovedB._id.toString());
        if (foundA && foundB) {
          logPass('Test 1 — Approved property visible', `Properties A & B found in public GET /api/properties (Total returned: ${res.json.data.length})`);
        } else {
          logFail('Test 1 — Approved property visible', new Error(`Approved properties not found in public list: foundA=${foundA}, foundB=${foundB}`));
        }
      } else {
        logFail('Test 1 — Approved property visible', new Error(`Unexpected status ${res.status}: ${JSON.stringify(res.json)}`));
      }
    } catch (err) {
      logFail('Test 1 — Approved property visible', err);
    }

    // -------------------------------------------------------------------------
    // TEST 2 — Pending property hidden
    // -------------------------------------------------------------------------
    try {
      const res = await request('/properties?limit=100');
      const foundPending = res.json?.data?.some((p) => p._id === propPending._id.toString());
      if (res.status === 200 && !foundPending) {
        logPass('Test 2 — Pending property hidden', `Property ${propPending._id} with status=pending is not exposed publicly`);
      } else {
        logFail('Test 2 — Pending property hidden', new Error(`Pending property was found in public listing!`));
      }
    } catch (err) {
      logFail('Test 2 — Pending property hidden', err);
    }

    // -------------------------------------------------------------------------
    // TEST 3 — Rejected property hidden
    // -------------------------------------------------------------------------
    try {
      const res = await request('/properties?limit=100');
      const foundRejected = res.json?.data?.some((p) => p._id === propRejected._id.toString());
      if (res.status === 200 && !foundRejected) {
        logPass('Test 3 — Rejected property hidden', `Property ${propRejected._id} with status=rejected is not exposed publicly`);
      } else {
        logFail('Test 3 — Rejected property hidden', new Error(`Rejected property was found in public listing!`));
      }
    } catch (err) {
      logFail('Test 3 — Rejected property hidden', err);
    }

    // -------------------------------------------------------------------------
    // TEST 4 — Draft property hidden
    // -------------------------------------------------------------------------
    try {
      const res = await request('/properties?limit=100');
      const foundDraft = res.json?.data?.some((p) => p._id === propDraft._id.toString());
      if (res.status === 200 && !foundDraft) {
        logPass('Test 4 — Draft property hidden', `Property ${propDraft._id} with status=draft is not exposed publicly`);
      } else {
        logFail('Test 4 — Draft property hidden', new Error(`Draft property was found in public listing!`));
      }
    } catch (err) {
      logFail('Test 4 — Draft property hidden', err);
    }

    // -------------------------------------------------------------------------
    // TEST 5 — Property details
    // -------------------------------------------------------------------------
    try {
      const res = await request(`/properties/${propApprovedA._id}`);
      if (
        res.status === 200 &&
        res.json?.success &&
        res.json?.data?._id === propApprovedA._id.toString() &&
        res.json?.data?.name === propApprovedA.name &&
        Array.isArray(res.json?.data?.rooms) &&
        res.json.data.rooms.length === 2
      ) {
        logPass('Test 5 — Property details', `GET /api/properties/:id returned 200 with matching name and ${res.json.data.rooms.length} populated rooms`);
      } else {
        logFail('Test 5 — Property details', new Error(`Unexpected response for approved property details: status=${res.status}, json=${JSON.stringify(res.json)}`));
      }
    } catch (err) {
      logFail('Test 5 — Property details', err);
    }

    // -------------------------------------------------------------------------
    // TEST 6 — Unapproved property details
    // -------------------------------------------------------------------------
    try {
      const resPending = await request(`/properties/${propPending._id}`);
      const resRejected = await request(`/properties/${propRejected._id}`);
      const resDraft = await request(`/properties/${propDraft._id}`);

      if (resPending.status === 404 && resRejected.status === 404 && resDraft.status === 404) {
        logPass('Test 6 — Unapproved property details', `All unapproved properties (pending, rejected, draft) returned 404 on public details endpoint`);
      } else {
        logFail('Test 6 — Unapproved property details', new Error(`Expected 404 for all unapproved properties: pending=${resPending.status}, rejected=${resRejected.status}, draft=${resDraft.status}`));
      }
    } catch (err) {
      logFail('Test 6 — Unapproved property details', err);
    }

    // -------------------------------------------------------------------------
    // TEST 7 — Rooms
    // -------------------------------------------------------------------------
    try {
      const res = await request(`/properties/${propApprovedA._id}/rooms`);
      if (
        res.status === 200 &&
        res.json?.success &&
        Array.isArray(res.json?.data) &&
        res.json.data.length === 2
      ) {
        const allBelongToA = res.json.data.every((r) => r.property === propApprovedA._id.toString());
        if (allBelongToA) {
          logPass('Test 7 — Rooms', `GET /api/properties/:id/rooms returned 200 and only the 2 rooms belonging to Property A`);
        } else {
          logFail('Test 7 — Rooms', new Error(`Rooms returned did not belong to Property A!`));
        }
      } else {
        logFail('Test 7 — Rooms', new Error(`Unexpected rooms response: status=${res.status}, json=${JSON.stringify(res.json)}`));
      }
    } catch (err) {
      logFail('Test 7 — Rooms', err);
    }

    // -------------------------------------------------------------------------
    // TEST 8 — Cross-property room access
    // -------------------------------------------------------------------------
    try {
      // Attempt to access Property A + Room belonging to Property B
      const res = await request(`/properties/${propApprovedA._id}/rooms/${roomB1._id}`);
      if (res.status === 404) {
        logPass('Test 8 — Cross-property room access', `GET /api/properties/${propApprovedA._id}/rooms/${roomB1._id} safely rejected with 404 (Room belonging to Property B cannot be accessed under Property A)`);
      } else {
        logFail('Test 8 — Cross-property room access', new Error(`Expected 404 for cross-property room access, but got status ${res.status}: ${JSON.stringify(res.json)}`));
      }
    } catch (err) {
      logFail('Test 8 — Cross-property room access', err);
    }

    // -------------------------------------------------------------------------
    // TEST 9 — Public page persistence
    // -------------------------------------------------------------------------
    try {
      // Create a new pending property
      const newlySubmitted = await Property.create({
        name: `Task 7 Immediate Publish Test ${timestamp}`,
        slug: `task-7-publish-test-${timestamp}`,
        owner: testOwner._id,
        type: 'Homestay',
        status: 'pending',
        active: true,
        description: 'Testing live publication upon approval',
        location: { town: 'Ravangla', district: 'South Sikkim' },
        price: 2100,
        image: 'https://res.cloudinary.com/demo/image/upload/v1/ravangla_cover.jpg',
      });

      // Verify not yet in public GET
      const resBefore = await request('/properties?limit=100');
      const foundBefore = resBefore.json?.data?.some((p) => p._id === newlySubmitted._id.toString());

      // Approve property (simulating Admin approval action)
      newlySubmitted.status = 'approved';
      await newlySubmitted.save();

      // Immediately query public GET /api/properties
      const resAfter = await request('/properties?limit=100');
      const foundAfter = resAfter.json?.data?.some((p) => p._id === newlySubmitted._id.toString());

      if (!foundBefore && foundAfter) {
        logPass('Test 9 — Public page persistence', `Newly approved property immediately appears in public API listing without manual synchronization`);
      } else {
        logFail('Test 9 — Public page persistence', new Error(`Persistence check failed: beforeApprovalFound=${foundBefore}, afterApprovalFound=${foundAfter}`));
      }

      // Cleanup
      await Property.deleteOne({ _id: newlySubmitted._id });
    } catch (err) {
      logFail('Test 9 — Public page persistence', err);
    }

    // -------------------------------------------------------------------------
    // TEST 10 — No local fallback
    // -------------------------------------------------------------------------
    try {
      const hotelHomestayPath = path.join(__dirname, '../../src/pages/HotelHomestay.jsx');
      const stayDetailsPath = path.join(__dirname, '../../src/pages/StayDetails.jsx');

      const hotelHomestayCode = fs.readFileSync(hotelHomestayPath, 'utf8');
      const stayDetailsCode = fs.readFileSync(stayDetailsPath, 'utf8');

      const hasGetAllActiveStays = hotelHomestayCode.includes('getAllActiveStays');
      const hasGetActiveLocations = hotelHomestayCode.includes('getActiveLocations');
      const hasStaysStoreImport = hotelHomestayCode.includes('staysStore');
      const hasGetStayById = stayDetailsCode.includes('getStayById');
      const hasGetRoomsByProp = stayDetailsCode.includes('getRoomsByPropertyId');
      const hasStayDetailsStore = stayDetailsCode.includes('staysStore');

      if (
        !hasGetAllActiveStays &&
        !hasGetActiveLocations &&
        !hasStaysStoreImport &&
        !hasGetStayById &&
        !hasGetRoomsByProp &&
        !hasStayDetailsStore
      ) {
        logPass('Test 10 — No local fallback', `HotelHomestay.jsx and StayDetails.jsx strictly depend on backend APIs with 0 legacy staysStore dependencies`);
      } else {
        logFail(
          'Test 10 — No local fallback',
          new Error(
            `Found legacy staysStore references: hasGetAllActiveStays=${hasGetAllActiveStays}, hasGetActiveLocations=${hasGetActiveLocations}, hasGetStayById=${hasGetStayById}, hasGetRoomsByProp=${hasGetRoomsByProp}`
          )
        );
      }
    } catch (err) {
      logFail('Test 10 — No local fallback', err);
    }

    // Clean up created test models
    await Property.deleteMany({ name: new RegExp(`Task 7 Test`, 'i') });
    await Room.deleteMany({ name: new RegExp(`Task 7 Room`, 'i') });
    await mongoose.disconnect();

    console.log('\n================================================================');
    console.log(` TASK 7 TEST SUMMARY: ${passedTests}/${totalTests} TESTS PASSED`);
    console.log('================================================================\n');

    if (passedTests === totalTests) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  } catch (globalErr) {
    console.error('Fatal test error:', globalErr);
    process.exit(1);
  }
}

runTask7Tests();

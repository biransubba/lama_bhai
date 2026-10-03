const mongoose = require('mongoose');
const { User, Property, Room } = require('../models');

async function testOwnerPipeline() {
  console.log('--- Starting Phase 7: Owner Property Submission Pipeline Test Suite ---');
  const { server } = require('../server');

  // Wait 1.5s for DB connection
  await new Promise((r) => setTimeout(r, 1500));

  const authUrl = 'http://localhost:5000/api/auth';
  const ownerUrl = 'http://localhost:5000/api/owner';
  const unique = Date.now().toString().slice(-5);

  try {
    // 1. Register & Login Owner A
    const ownerAData = {
      name: 'Mingma Sherpa',
      email: `mingma_${unique}@lama.test`,
      password: 'password123',
      role: 'owner',
      agencyName: 'Yumthang Valley Eco Retreats',
      location: 'Lachung, North Sikkim',
    };
    const regOwnerARes = await fetch(`${authUrl}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ownerAData),
    });
    const regOwnerAJson = await regOwnerARes.json();
    const ownerACookie = regOwnerARes.headers.get('set-cookie')?.split(';')[0];
    console.log('Owner A Registered:', regOwnerAJson.user.name, 'Role:', regOwnerAJson.user.role);

    // 2. Register & Login Tourist
    const touristData = {
      name: 'Passang Tourist',
      email: `passang_${unique}@lama.test`,
      password: 'password123',
      role: 'tourist',
    };
    const regTouristRes = await fetch(`${authUrl}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(touristData),
    });
    const touristCookie = regTouristRes.headers.get('set-cookie')?.split(';')[0];

    // TEST 1: Tourist attempts to submit property (Expect 403)
    console.log('\n[1] Testing Tourist submitting property (Expect 403)...');
    const touristPropRes = await fetch(`${ownerUrl}/properties`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: touristCookie },
      body: JSON.stringify({
        name: 'Unauthorized Stay',
        type: 'Homestay',
        description: 'Should fail',
        location: { district: 'North Sikkim', town: 'Lachen' },
        price: 2000,
        image: 'https://example.com/image.jpg',
      }),
    });
    console.log('Status:', touristPropRes.status);
    if (touristPropRes.status !== 403) {
      throw new Error(`Security flaw: Tourist got status ${touristPropRes.status} instead of 403`);
    }
    console.log('✓ RBAC verified: Tourist blocked from owner pipeline.');

    // TEST 2: Owner A submits a new property
    console.log('\n[2] Testing Owner A creating property...');
    const propPayload = {
      name: 'Yumthang Alpine Eco Lodge',
      type: 'Homestay',
      description: 'Handcrafted timber homestay nestled on the meadows of Yumthang valley.',
      location: {
        district: 'North Sikkim',
        town: 'Lachung',
        address: 'Yumthang Route, Milestone 4',
      },
      price: 3200,
      image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb',
      amenities: ['Room heater / Bukhari', 'Hot water', 'Mountain view', 'Local meals'],
    };

    const createPropRes = await fetch(`${ownerUrl}/properties`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: ownerACookie },
      body: JSON.stringify(propPayload),
    });
    const createPropJson = await createPropRes.json();
    console.log('Status:', createPropRes.status);
    console.log('Property ID:', createPropJson.data?._id);
    console.log('Generated Slug:', createPropJson.data?.slug);
    console.log('Moderation Status:', createPropJson.data?.status);

    if (createPropRes.status !== 201 || createPropJson.data?.status !== 'pending') {
      throw new Error('Property submission failed or status was not set to pending');
    }
    const propId = createPropJson.data._id;
    console.log('✓ Property submission verified (defaults to pending moderation).');

    // TEST 3: Owner A lists their properties
    console.log('\n[3] Testing GET /api/owner/properties...');
    const myPropsRes = await fetch(`${ownerUrl}/properties`, {
      headers: { Cookie: ownerACookie },
    });
    const myPropsJson = await myPropsRes.json();
    console.log('Status:', myPropsRes.status);
    console.log('Properties Owned by Owner A:', myPropsJson.count);
    if (myPropsJson.count < 1) throw new Error('Owner properties query returned 0 items');
    console.log('✓ Owner listings query verified.');

    // TEST 4: Owner A adds room to property
    console.log('\n[4] Testing POST /api/owner/properties/:id/rooms...');
    const roomPayload = {
      name: 'Pine Wood Valley Suite',
      type: 'Deluxe Room',
      description: 'Cedar-scented suite overlooking the alpine stream.',
      capacity: 3,
      bedConfiguration: '1 King Bed + 1 Single Bed',
      price: 3200,
      amenities: ['Heater', 'Attached Bath', 'Balcony'],
    };
    const addRoomRes = await fetch(`${ownerUrl}/properties/${propId}/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: ownerACookie },
      body: JSON.stringify(roomPayload),
    });
    const addRoomJson = await addRoomRes.json();
    console.log('Status:', addRoomRes.status);
    console.log('Room ID:', addRoomJson.data?._id);
    console.log('Room Name:', addRoomJson.data?.name);
    if (addRoomRes.status !== 201) throw new Error('Adding room failed');
    const roomId = addRoomJson.data._id;
    console.log('✓ Room creation verified.');

    // TEST 5: Owner A updates room pricing & details
    console.log(`\n[5] Testing PUT /api/owner/rooms/${roomId}...`);
    const updateRoomRes = await fetch(`${ownerUrl}/rooms/${roomId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: ownerACookie },
      body: JSON.stringify({ price: 3600, capacity: 4 }),
    });
    const updateRoomJson = await updateRoomRes.json();
    console.log('Status:', updateRoomRes.status);
    console.log('Updated Price:', updateRoomJson.data?.price);
    if (updateRoomJson.data?.price !== 3600 || updateRoomJson.data?.capacity !== 4) {
      throw new Error('Room update verification failed');
    }
    console.log('✓ Room update verified.');

    // TEST 6: Cross-Owner Security Check (Owner B tries to edit Owner A's property)
    console.log('\n[6] Testing Cross-Owner Isolation (Owner B tries to modify Owner A property)...');
    const ownerBData = {
      name: 'Dorjee Bhutia',
      email: `dorjee_${unique}@lama.test`,
      password: 'password123',
      role: 'owner',
      agencyName: 'Pelling Eco Stays',
      location: 'West Sikkim',
    };
    const regOwnerBRes = await fetch(`${authUrl}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ownerBData),
    });
    const ownerBCookie = regOwnerBRes.headers.get('set-cookie')?.split(';')[0];

    const crossEditRes = await fetch(`${ownerUrl}/properties/${propId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: ownerBCookie },
      body: JSON.stringify({ name: 'Hacked Property Name' }),
    });
    console.log('Status:', crossEditRes.status);
    if (crossEditRes.status !== 403) {
      throw new Error(`Security flaw: Cross-owner edit permitted with status ${crossEditRes.status}`);
    }
    console.log('✓ Cross-owner isolation verified: Owner B rejected with 403.');

    // TEST 7: Owner A updates property
    console.log(`\n[7] Testing PUT /api/owner/properties/${propId}...`);
    const updatePropRes = await fetch(`${ownerUrl}/properties/${propId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: ownerACookie },
      body: JSON.stringify({ price: 3400, description: 'Updated eco lodge description.' }),
    });
    const updatePropJson = await updatePropRes.json();
    console.log('Status:', updatePropRes.status);
    console.log('Updated Property Price:', updatePropJson.data?.price);
    if (updatePropJson.data?.price !== 3400) throw new Error('Property update failed');
    console.log('✓ Property update verified.');

    // TEST 8: Owner A deactivates property and rooms
    console.log(`\n[8] Testing DELETE /api/owner/properties/${propId}...`);
    const delPropRes = await fetch(`${ownerUrl}/properties/${propId}`, {
      method: 'DELETE',
      headers: { Cookie: ownerACookie },
    });
    const delPropJson = await delPropRes.json();
    console.log('Status:', delPropRes.status);
    console.log('Message:', delPropJson.message);
    if (delPropRes.status !== 200) throw new Error('Property deactivation failed');

    const checkProp = await Property.findById(propId);
    const checkRoom = await Room.findById(roomId);
    if (checkProp.active !== false || checkRoom.active !== false) {
      throw new Error('Deactivation did not cascade active: false to property and rooms');
    }
    console.log('✓ Cascading deactivation verified.');

    console.log('\n======================================================');
    console.log(' ALL OWNER PIPELINE TESTS PASSED SUCCESSFULLY (8/8)!  ');
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

testOwnerPipeline();

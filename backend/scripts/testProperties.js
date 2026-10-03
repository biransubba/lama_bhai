const mongoose = require('mongoose');
const { User, Property, Room } = require('../models');

async function testPropertyAPIs() {
  console.log('--- Starting Phase 6: Public Property Listing APIs Test Suite ---');
  const { server } = require('../server');

  // Wait 1.5 seconds for MongoDB connection to initialize
  await new Promise((r) => setTimeout(r, 1500));

  const baseUrl = 'http://localhost:5000/api/properties';
  const unique = Date.now().toString().slice(-5);

  try {
    // 1. Create a verified test owner
    const testOwner = await User.create({
      name: 'Norbu Lepcha',
      email: `norbu_${unique}@lama.test`,
      password: 'password123',
      role: 'owner',
      partnerProfile: {
        agencyName: 'Khangchendzonga Homestays',
        location: 'North Sikkim',
        verificationStatus: 'Approved',
      },
    });

    // 2. Seed approved Sikkim property 1 (North Sikkim Homestay)
    const property1 = await Property.create({
      name: 'Lachen Mountain Homestay',
      slug: `lachen-mountain-homestay-${unique}`,
      type: 'Homestay',
      owner: testOwner._id,
      description:
        'Authentic Himalayan homestay hosted by a welcoming local Lachenpa family overlooking the snow peaks.',
      location: {
        district: 'North Sikkim',
        town: 'Lachen',
        address: 'Upper Lachen Valley Route',
      },
      price: 2400,
      image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb',
      amenities: ['Room heater / Bukhari', 'Hot water', 'Mountain view', 'Home-cooked local meals'],
      status: 'approved',
      active: true,
      featured: true,
      rating: 4.8,
      numReviews: 12,
    });

    // Add rooms to Property 1
    await Room.create([
      {
        property: property1._id,
        name: 'Valley View Wooden Room',
        type: 'Standard Room',
        capacity: 2,
        price: 2400,
        amenities: ['Room heater / Bukhari', 'Hot water'],
        availability: 'available',
      },
      {
        property: property1._id,
        name: 'Himalayan Family Suite',
        type: 'Suite',
        capacity: 4,
        price: 3800,
        amenities: ['Room heater / Bukhari', 'Private Balcony', 'Tea / Coffee Maker'],
        availability: 'available',
      },
    ]);

    // 3. Seed approved Sikkim property 2 (West Sikkim Resort)
    const property2 = await Property.create({
      name: 'Pelling Sunrise Heritage Resort',
      slug: `pelling-sunrise-resort-${unique}`,
      type: 'Resort',
      owner: testOwner._id,
      description: 'Serene mountain retreat with front-row sunrise vistas of Mt. Khangchendzonga.',
      location: {
        district: 'West Sikkim',
        town: 'Pelling',
        address: 'Near Pemayangtse Monastery',
      },
      price: 4500,
      image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945',
      amenities: ['Wi-Fi', 'Mountain view', 'Restaurant', 'Bonfire'],
      status: 'approved',
      active: true,
      featured: false,
      rating: 4.2,
      numReviews: 8,
    });

    // 4. Seed an UNAPPROVED pending property to ensure it NEVER appears in public searches
    const pendingProperty = await Property.create({
      name: 'Gangtok Backpacker Hostel',
      slug: `gangtok-hostel-${unique}`,
      type: 'Hotel',
      owner: testOwner._id,
      description: 'Budget stay in Gangtok awaiting moderation.',
      location: {
        district: 'East Sikkim',
        town: 'Gangtok',
        address: 'MG Marg',
      },
      price: 800,
      image: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5',
      status: 'pending',
      active: true,
    });

    // TEST 1: General listing (should include property 1 & 2, NOT pending)
    console.log('\n[1] Testing GET /api/properties (Approved public listings)...');
    const resAll = await fetch(baseUrl);
    const jsonAll = await resAll.json();
    console.log('Status:', resAll.status);
    console.log(`Found ${jsonAll.count} properties. Total in DB: ${jsonAll.total}`);
    const foundPending = jsonAll.data.some((p) => p.slug === pendingProperty.slug);
    if (foundPending) throw new Error('Security flaw: Pending property leaked to public listing!');
    console.log('✓ Public filtering verified: Pending property correctly excluded.');

    // TEST 2: Filter by Sikkim district
    console.log('\n[2] Testing GET /api/properties?district=North Sikkim...');
    const resDistrict = await fetch(`${baseUrl}?district=North Sikkim`);
    const jsonDistrict = await resDistrict.json();
    console.log('Status:', resDistrict.status);
    console.log(`Matching properties in North Sikkim: ${jsonDistrict.count}`);
    const allNorth = jsonDistrict.data.every((p) => p.location.district === 'North Sikkim');
    if (!allNorth) throw new Error('District filter returned non-matching results');
    console.log('✓ District filter verified.');

    // TEST 3: Filter by Price Range
    console.log('\n[3] Testing GET /api/properties?minPrice=3000...');
    const resPrice = await fetch(`${baseUrl}?minPrice=3000`);
    const jsonPrice = await resPrice.json();
    console.log('Status:', resPrice.status);
    console.log(`Matching properties >= 3000: ${jsonPrice.count}`);
    const allAbove3000 = jsonPrice.data.every((p) => p.price >= 3000);
    if (!allAbove3000) throw new Error('Price filter returned items below minPrice');
    console.log('✓ Price filter verified.');

    // TEST 4: Keyword Search
    console.log('\n[4] Testing GET /api/properties?search=Pelling...');
    const resSearch = await fetch(`${baseUrl}?search=Pelling`);
    const jsonSearch = await resSearch.json();
    console.log('Status:', resSearch.status);
    console.log(`Found ${jsonSearch.count} property matching "Pelling"`);
    if (jsonSearch.count === 0 || !jsonSearch.data[0].name.includes('Pelling')) {
      throw new Error('Search did not return Pelling property');
    }
    console.log('✓ Keyword search verified.');

    // TEST 5: Featured Properties
    console.log('\n[5] Testing GET /api/properties/featured...');
    const resFeatured = await fetch(`${baseUrl}/featured`);
    const jsonFeatured = await resFeatured.json();
    console.log('Status:', resFeatured.status);
    console.log(`Found ${jsonFeatured.count} featured property`);
    if (jsonFeatured.count === 0) throw new Error('Featured properties query returned empty');
    console.log('✓ Featured properties query verified.');

    // TEST 6: Single Property Detail with Populated Rooms
    console.log(`\n[6] Testing GET /api/properties/${property1.slug}...`);
    const resDetail = await fetch(`${baseUrl}/${property1.slug}`);
    const jsonDetail = await resDetail.json();
    console.log('Status:', resDetail.status);
    console.log('Property Title:', jsonDetail.data.name);
    console.log('Owner Agency:', jsonDetail.data.owner?.partnerProfile?.agencyName);
    console.log('Populated Rooms Count:', jsonDetail.data.rooms?.length);
    if (jsonDetail.data.rooms?.length !== 2) {
      throw new Error(`Expected 2 rooms populated, found: ${jsonDetail.data.rooms?.length}`);
    }
    console.log('✓ Populated detail view verified.');

    // TEST 7: Property Rooms Endpoint
    console.log(`\n[7] Testing GET /api/properties/${property1._id}/rooms...`);
    const resRooms = await fetch(`${baseUrl}/${property1._id}/rooms`);
    const jsonRooms = await resRooms.json();
    console.log('Status:', resRooms.status);
    console.log('Rooms found for property:', jsonRooms.count);
    if (jsonRooms.count !== 2) throw new Error('Rooms endpoint returned incorrect count');
    console.log('✓ Property rooms endpoint verified.');

    // TEST 8: Unapproved Property Access by Public Guest (Expect 404)
    console.log(`\n[8] Testing Public Guest GET /api/properties/${pendingProperty.slug} (Expect 404)...`);
    const resPending = await fetch(`${baseUrl}/${pendingProperty.slug}`);
    console.log('Status:', resPending.status);
    if (resPending.status !== 404) {
      throw new Error(`Security flaw: Expected 404 for unapproved property, got ${resPending.status}`);
    }
    console.log('✓ Unapproved property properly secured from public visitors.');

    console.log('\n======================================================');
    console.log(' ALL PROPERTY LISTING TESTS PASSED SUCCESSFULLY (8/8)!');
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

testPropertyAPIs();

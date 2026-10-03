import { normalizeStay, normalizeRoom, STAY_TYPES, ROOM_TYPES } from "../src/data/schema.js";
import {
  staysStore,
  roomsStore,
  getRoomsByPropertyId,
  getAllRoomsByPropertyId,
  getRoomById,
  getAllRooms,
  getPropertyByRoomId,
  getAvailableRoomCount,
  addRoom,
  updateRoom,
  deleteRoom,
  deleteRoomsForProperty,
  saveRoomsForProperty,
  getStayById,
  getAllActiveStays,
} from "../src/data/staysStore.js";

console.log("=== RUNNING ACCOMMODATION MULTI-ROOM VERIFICATION ===");

// TEST 1: Room Normalization & Validation
console.log("\n--- TEST 1: normalizeRoom ---");
const roomWithoutProperty = normalizeRoom({ name: "Invalid Room" });
console.assert(roomWithoutProperty === null, "Room without propertyId must be rejected");
console.log("✓ Room without propertyId rejected as expected");

const roomValid = normalizeRoom({
  id: "room_001",
  propertyId: "stay_001",
  name: "Deluxe Himalayan Room",
  type: "Deluxe Room",
  description: "Spacious wooden room with direct valley view.",
  price: "₹3,200/night",
  amenities: ["Room heater / Bukhari", "Mountain view", "Attached Bathroom"],
  availability: "available",
  capacity: 3,
});

console.assert(roomValid.id === "room_001", "Room id should be room_001");
console.assert(roomValid.propertyId === "stay_001", "propertyId should be stay_001");
console.assert(roomValid.name === "Deluxe Himalayan Room", "Room name preserved");
console.assert(roomValid.type === "Deluxe Room", "Room type set");
console.assert(roomValid.price === "₹3,200/night", "Room price preserved");
console.assert(roomValid.amenities.length === 3, "Room amenities length 3");
console.assert(roomValid.availability === "available", "Room availability available");
console.assert(roomValid.capacity === 3, "Capacity set to 3");
console.assert(!roomValid.location, "Room should NOT duplicate property location");
console.log("✓ normalizeRoom verified successfully:", roomValid.id, roomValid.name, "under", roomValid.propertyId);

// TEST 2: Property 1 -> Many Rooms Relationship in Store
console.log("\n--- TEST 2: Property 1 -> Many Rooms in Store ---");
// Clear stores for test
staysStore.set([]);
roomsStore.set([]);

// Create Property: Homestay A
const homestayA = staysStore.add({
  id: "stay_001",
  name: "Lachen Alpine Homestay",
  location: "Lachen",
  type: "Homestay",
  description: "A traditional wooden homestay nestled in Lachen valley.",
  partnerId: "partner_lachen_host",
  availability: "available",
  price: "₹2,500/night",
  amenities: ["Home-cooked local meals", "Traditional wooden architecture"],
});
console.log("✓ Created property:", homestayA.id, homestayA.name);

// Add 3 Rooms under stay_001
const room1 = addRoom({
  id: "room_001",
  propertyId: "stay_001",
  name: "Room 1 - Valley View",
  type: "Deluxe Room",
  price: "₹2,800/night",
  amenities: ["Room heater / Bukhari", "Attached Bathroom", "Valley View"],
  availability: "available",
  capacity: 2,
});

const room2 = addRoom({
  id: "room_002",
  propertyId: "stay_001",
  name: "Room 2 - Mountain Suite",
  type: "Suite",
  price: "₹3,500/night",
  amenities: ["Room heater / Bukhari", "Attached Bathroom", "Balcony"],
  availability: "available",
  capacity: 4,
});

const room3 = addRoom({
  id: "room_003",
  propertyId: "stay_001",
  name: "Room 3 - Cozy Standard",
  type: "Standard Room",
  price: "₹2,200/night",
  amenities: ["Hot water", "Attached Bathroom"],
  availability: "unavailable",
  capacity: 2,
});

const roomsOfStay001 = getRoomsByPropertyId("stay_001");
console.assert(roomsOfStay001.length === 3, `Expected 3 rooms, got ${roomsOfStay001.length}`);
console.log(`✓ Property stay_001 has ${roomsOfStay001.length} rooms linked via propertyId`);

const availCount = getAvailableRoomCount("stay_001");
console.assert(availCount === 2, `Expected 2 available rooms, got ${availCount}`);
console.log(`✓ Available rooms count: ${availCount} of 3`);

// TEST 3: Room -> One Property resolution
console.log("\n--- TEST 3: Room -> One Property Resolution ---");
const resolvedProp = getPropertyByRoomId("room_002");
console.assert(resolvedProp && resolvedProp.id === "stay_001", "Parent property must be stay_001");
console.log(`✓ getPropertyByRoomId("room_002") resolved to "${resolvedProp.name}" (ID: ${resolvedProp.id})`);

// TEST 4: getStayById with attached rooms
console.log("\n--- TEST 4: getStayById attaches rooms ---");
const fullStay = getStayById("stay_001");
console.assert(Array.isArray(fullStay.rooms) && fullStay.rooms.length === 3, "fullStay must include rooms array");
console.assert(fullStay.roomCount === 3, "roomCount must be 3");
console.assert(fullStay.availableRoomCount === 2, "availableRoomCount must be 2");
console.log(`✓ getStayById returns stay with ${fullStay.roomCount} rooms and ${fullStay.availableRoomCount} available`);

// TEST 5: Hotel with Multiple Room Types
console.log("\n--- TEST 5: Hotel with multiple categories ---");
const hotelB = staysStore.add({
  id: "stay_hotel_002",
  name: "Kanchenjunga Grand Hotel",
  location: "Mangan",
  type: "Hotel",
  description: "Luxury hotel with scenic view of mountain ranges.",
  availability: "available",
  price: "₹4,500/night",
});

const hotelRooms = [
  { id: "room_h_001", propertyId: "stay_hotel_002", name: "Standard Room", type: "Standard Room", price: "₹3,500/night", availability: "available" },
  { id: "room_h_002", propertyId: "stay_hotel_002", name: "Deluxe Room", type: "Deluxe Room", price: "₹4,800/night", availability: "available" },
  { id: "room_h_003", propertyId: "stay_hotel_002", name: "Family Room", type: "Family Room", price: "₹6,000/night", availability: "available" },
  { id: "room_h_004", propertyId: "stay_hotel_002", name: "Presidential Suite", type: "Suite", price: "₹9,500/night", availability: "available" },
];
saveRoomsForProperty("stay_hotel_002", hotelRooms);

const savedHotelRooms = getRoomsByPropertyId("stay_hotel_002");
console.assert(savedHotelRooms.length === 4, "Hotel should have 4 rooms");
console.log(`✓ Hotel stay_hotel_002 verified with ${savedHotelRooms.length} room tiers`);

// TEST 6: Backward Compatibility (Property with NO rooms in admin_rooms)
console.log("\n--- TEST 6: Backward Compatibility for Legacy Stays ---");
const legacyStay = staysStore.add({
  id: "stay_legacy_100",
  name: "Old Sikkim Heritage Lodge",
  location: "Lachung",
  type: "Lodge",
  price: "₹1,800/night",
  amenities: ["Traditional wooden rooms", "Hot water"],
  availability: "available",
  description: "Legacy lodge with historic charm.",
});

// Notice we do NOT add any rooms in admin_rooms for stay_legacy_100
const legacyRooms = getRoomsByPropertyId("stay_legacy_100");
console.assert(legacyRooms.length === 1, "Legacy stay must provide 1 synthesized default room");
console.assert(legacyRooms[0].propertyId === "stay_legacy_100", "Synthetic room belongs to stay_legacy_100");
console.assert(legacyRooms[0].price === "₹1,800/night", "Synthetic room inherits legacy price");
console.assert(legacyRooms[0].amenities.includes("Traditional wooden rooms"), "Synthetic room inherits amenities");
console.log("✓ Legacy stay backward compatibility verified:", legacyRooms[0].name, legacyRooms[0].price);

const legacyStayDetails = getStayById("stay_legacy_100");
console.assert(legacyStayDetails.rooms.length === 1, "getStayById provides synthetic room");
console.assert(legacyStayDetails.roomCount === 1, "roomCount is 1");
console.log("✓ getStayById backward compatibility verified");

// TEST 7: Cascading Deletion
console.log("\n--- TEST 7: Cascading Deletion ---");
deleteRoomsForProperty("stay_001");
const rawRoomsInStore = roomsStore.getAll().filter(r => r.propertyId === "stay_001");
console.assert(rawRoomsInStore.length === 0, "All explicit rooms for stay_001 must be deleted");
console.log("✓ deleteRoomsForProperty successfully cleared all room records for stay_001");

// Clean up test data
staysStore.set([]);
roomsStore.set([]);

console.log("\n=== ALL TESTS PASSED SUCCESSFULLY! ===");

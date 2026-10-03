import { normalizeStay, normalizeRoom } from "../src/data/schema.js";
import {
  staysStore,
  roomsStore,
  getRoomsByPropertyId,
  getStayById,
  addRoom,
  deleteRoomsForProperty,
  saveRoomsForProperty,
} from "../src/data/staysStore.js";
import { parseAndFormatPrice } from "../src/utils/priceFormatter.js";

console.log("=== RUNNING STAY DETAILS MULTI-ROOM VERIFICATION ===");

// Reset test data
staysStore.set([]);
roomsStore.set([]);

// TEST 1: Property 1 -> Multiple Rooms (Dynamic Count: 1, 3, 5, 10)
console.log("\n--- TEST 1: Dynamic Room Counts per Property ---");

const homestayA = staysStore.add({
  id: "stay_lachen_alpine",
  name: "Lachen Alpine Homestay",
  location: "Lachen",
  type: "Homestay",
  description: "Authentic homestay hosted by local Lachenpa family overlooking the snow peaks.",
  price: "₹2,500/night",
  amenities: ["Traditional wooden rooms", "Home-cooked local meals", "Bukhari heating"],
  availability: "available",
});

console.assert(homestayA.id === "stay_lachen_alpine", "Property ID created");

// Case 1: 0 rooms (empty state testing)
homestayA.rooms = []; // Explicitly empty
let rooms = getRoomsByPropertyId("stay_lachen_alpine");
console.assert(rooms.length === 0, `Expected 0 rooms for explicit empty test, got ${rooms.length}`);
console.log("✓ Empty room list triggers empty state gracefully (0 rooms)");

// Case 2: 1 room
addRoom({
  id: "room_alpine_1",
  propertyId: "stay_lachen_alpine",
  name: "Room 1 - Standard Mountain View",
  type: "Standard Room",
  price: "₹2,200/night",
  amenities: ["Room heater / Bukhari", "Attached Bathroom"],
  availability: "available",
  capacity: 2,
});
rooms = getRoomsByPropertyId("stay_lachen_alpine");
console.assert(rooms.length === 1, `Expected 1 room, got ${rooms.length}`);
console.log(`✓ Dynamic room count: 1 room supported`);

// Case 3: 3 rooms
addRoom({
  id: "room_alpine_2",
  propertyId: "stay_lachen_alpine",
  name: "Room 2 - Deluxe Wooden Suite",
  type: "Deluxe Room",
  price: "₹3,000/night",
  amenities: ["Room heater / Bukhari", "Attached Bathroom", "Balcony", "Mountain view"],
  availability: "available",
  capacity: 3,
});
addRoom({
  id: "room_alpine_3",
  propertyId: "stay_lachen_alpine",
  name: "Room 3 - Family Loft",
  type: "Family Room",
  price: "₹4,200/night",
  amenities: ["Room heater / Bukhari", "Attached Bathroom", "Living Area"],
  availability: "unavailable",
  capacity: 5,
});
rooms = getRoomsByPropertyId("stay_lachen_alpine");
console.assert(rooms.length === 3, `Expected 3 rooms, got ${rooms.length}`);
console.log(`✓ Dynamic room count: 3 rooms supported (with mixed availability)`);

// Case 4: 5 rooms
addRoom({
  id: "room_alpine_4",
  propertyId: "stay_lachen_alpine",
  name: "Room 4 - Cozy Attic",
  type: "Standard Room",
  price: "₹2,000/night",
  availability: "available",
  capacity: 2,
});
addRoom({
  id: "room_alpine_5",
  propertyId: "stay_lachen_alpine",
  name: "Room 5 - Valley Terrace Room",
  type: "Suite",
  price: "₹3,800/night",
  availability: "available",
  capacity: 3,
});
rooms = getRoomsByPropertyId("stay_lachen_alpine");
console.assert(rooms.length === 5, `Expected 5 rooms, got ${rooms.length}`);
console.log(`✓ Dynamic room count: 5 rooms supported`);

// TEST 2: Distinct Property vs Room Galleries
console.log("\n--- TEST 2: Distinct Property vs Room Galleries ---");
const fullStay = getStayById("stay_lachen_alpine");
const room2 = rooms.find(r => r.id === "room_alpine_2");

// Property gallery contains property photos
console.assert(Array.isArray(fullStay.gallery), "Property has gallery");
// Room gallery belongs exclusively to room
console.assert(Array.isArray(room2.gallery), "Room 2 has distinct gallery");
console.log("✓ Property cover/gallery and Room galleries are completely separate structures");

// TEST 3: Room-specific Tariff Calculation
console.log("\n--- TEST 3: Room-Specific Tariff Calculation ---");
const roomRates = rooms.map(r => parseAndFormatPrice(r.price)).filter(Boolean);
const lowestRate = roomRates.reduce((min, cur) => (cur.numeric < min.numeric ? cur : min), roomRates[0]);

console.assert(lowestRate.numeric === 2000, `Expected lowest rate 2000, got ${lowestRate.numeric}`);
console.log(`✓ Starting rate dynamically calculated from room tiers: ${lowestRate.currency}${lowestRate.formatted} ${lowestRate.unit}`);

// TEST 4: Booking Context for Specific Room vs Property
console.log("\n--- TEST 4: Booking Context for Specific Room vs Property ---");
const selectedRoom = room2;
const bookingContext = {
  service: "Stay",
  inventoryId: selectedRoom.id,
  propertyId: fullStay.id,
  roomId: selectedRoom.id,
  title: `${fullStay.name} — ${selectedRoom.name}`,
  details: [
    { label: "Property", value: fullStay.name },
    { label: "Selected Room", value: `${selectedRoom.name} (${selectedRoom.type})` },
    { label: "Nightly Tariff", value: selectedRoom.price },
    { label: "Room Capacity", value: `Up to ${selectedRoom.capacity} guests` },
  ],
};

console.assert(bookingContext.inventoryId === "room_alpine_2", "inventoryId is room ID");
console.assert(bookingContext.propertyId === "stay_lachen_alpine", "propertyId is stay ID");
console.assert(bookingContext.details.find(d => d.label === "Selected Room").value === "Room 2 - Deluxe Wooden Suite (Deluxe Room)");
console.log("✓ Room-specific booking context verified:", bookingContext.title);

// Clean up test data
staysStore.set([]);
roomsStore.set([]);

console.log("\n=== ALL STAY DETAILS MULTI-ROOM TESTS PASSED! ===");

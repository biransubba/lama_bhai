/**
 * Automated Test Suite for Lama Bhai Tourism — Offers Management
 * Tests:
 * 1. Creation of offers across various scopes (entire service, category, specific items).
 * 2. Editing offer properties, dates, and scope.
 * 3. Activating / deactivating offers (toggle).
 * 4. Date validity filtering (Active today vs. Upcoming in future vs. Expired in past).
 * 5. Inventory matching accuracy (ensuring offers display ONLY for inventory they actually apply to).
 * 6. Summary metrics calculation based strictly on stored records.
 * 7. Deletion and persistence across localStorage.
 */

import assert from "node:assert";

// Mock browser environment for Node.js
const storageMap = new Map();
global.localStorage = {
  getItem: (key) => (storageMap.has(key) ? storageMap.get(key) : null),
  setItem: (key, val) => storageMap.set(key, String(val)),
  removeItem: (key) => storageMap.delete(key),
  clear: () => storageMap.clear(),
};
global.window = {
  localStorage: global.localStorage,
  dispatchEvent: () => true,
};
global.CustomEvent = class CustomEvent {
  constructor(name, opts) {
    this.name = name;
    this.opts = opts;
  }
};

// Import offersStore
const {
  getAllOffers,
  getOfferById,
  addOffer,
  updateOffer,
  deleteOffer,
  toggleOfferActive,
  isCurrentlyActive,
  getOfferStatus,
  getActiveOffers,
  getActiveOffersFor,
  getOffersSummary,
} = await import("../src/data/offersStore.js");

console.log("=== RUNNING OFFERS MANAGEMENT TEST SUITE ===");

// TEST 1: Initial state is clean
console.log("\n[Test 1] Verify initial state has zero dummy offers");
assert.strictEqual(getAllOffers().length, 0, "Offers should initially be empty");
const initialSummary = getOffersSummary();
assert.strictEqual(initialSummary.totalCount, 0);
assert.strictEqual(initialSummary.liveActiveCount, 0);
console.log("✓ Initial state is clean.");

// Dates setup
const today = new Date().toISOString().slice(0, 10);
const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
const lastWeek = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
const nextMonth = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);

// TEST 2: Create Offer 1 - Entire Service Scope (All Stays, Live Active)
console.log("\n[Test 2] Create Offer 1: Entire Service Scope (All Stays)");
const offer1 = addOffer({
  id: "offer_test_all_stays",
  title: "Monsoon Mountain Hospitality Special",
  badgeText: "10% Off",
  appliesToService: "Stay",
  scopeType: "all",
  discountType: "percentage",
  discountValue: "10%",
  startDate: lastWeek,
  endDate: nextMonth,
  active: true,
  description: "Valid across all homestays and hotels in Sikkim for minimum 2-night bookings.",
});
assert(offer1, "Offer 1 should be created");
assert.strictEqual(offer1.scopeType, "all");
assert.strictEqual(getOfferStatus(offer1), "Active");
assert(isCurrentlyActive(offer1), "Offer 1 must be currently active");

// TEST 3: Create Offer 2 - Category Scope (Cars: SUV only)
console.log("\n[Test 3] Create Offer 2: Category Scope (Cars: SUV category)");
const offer2 = addOffer({
  id: "offer_test_suv_category",
  title: "Rugged Mountain 4x4 Package",
  badgeText: "₹500 Off",
  appliesToService: "Car",
  scopeType: "category",
  appliesToCategory: "SUV",
  discountType: "fixed",
  discountValue: "₹500 Off",
  startDate: yesterday,
  endDate: nextMonth,
  active: true,
  description: "Special fuel perk for high-altitude SUV bookings to North Sikkim.",
});
assert(offer2, "Offer 2 should be created");
assert.strictEqual(offer2.scopeType, "category");
assert.strictEqual(offer2.appliesToCategory, "SUV");
assert(isCurrentlyActive(offer2), "Offer 2 must be currently active");

// TEST 4: Create Offer 3 - Specific Items Scope (Only for Apple Orchard Homestay)
console.log("\n[Test 4] Create Offer 3: Specific Items Scope (Only Apple Orchard Homestay)");
const offer3 = addOffer({
  id: "offer_test_specific_stay",
  title: "Apple Orchard Free Breakfast Perk",
  badgeText: "Free Breakfast",
  appliesToService: "Stay",
  scopeType: "item",
  appliesToItems: ["Apple Orchard Homestay"],
  appliesToTarget: "Apple Orchard Homestay",
  discountType: "perk",
  discountValue: "Complimentary Breakfast",
  startDate: lastWeek,
  endDate: nextMonth,
  active: true,
  description: "Fresh farm-to-table breakfast served daily.",
});
assert(offer3, "Offer 3 should be created");
assert.strictEqual(offer3.scopeType, "item");
assert(offer3.appliesToItems.includes("Apple Orchard Homestay"));

// TEST 5: Create Offer 4 - Scheduled Upcoming (startDate in future)
console.log("\n[Test 5] Create Offer 4: Scheduled Upcoming (Future dates)");
const offer4 = addOffer({
  id: "offer_test_future",
  title: "Spring Rhododendron Festival Deal",
  badgeText: "Early Bird",
  appliesToService: "All",
  scopeType: "all",
  startDate: tomorrow,
  endDate: nextMonth,
  active: true,
});
assert.strictEqual(getOfferStatus(offer4), "Upcoming", "Status should be Upcoming");
assert.strictEqual(isCurrentlyActive(offer4), false, "Upcoming offer must NOT be active today");

// TEST 6: Create Offer 5 - Expired (endDate in past)
console.log("\n[Test 6] Create Offer 5: Expired (Past dates)");
const offer5 = addOffer({
  id: "offer_test_expired",
  title: "Winter Snow Festival 2025",
  badgeText: "Winter Deal",
  appliesToService: "Stay",
  scopeType: "all",
  startDate: "2025-01-01",
  endDate: "2025-02-01",
  active: true,
});
assert.strictEqual(getOfferStatus(offer5), "Expired", "Status should be Expired");
assert.strictEqual(isCurrentlyActive(offer5), false, "Expired offer must NOT be active today");

// TEST 7: Create Offer 6 - Manually Deactivated (active: false)
console.log("\n[Test 7] Create Offer 6: Manually Deactivated (Disabled)");
const offer6 = addOffer({
  id: "offer_test_disabled",
  title: "Flash Sale Paused",
  appliesToService: "Stay",
  scopeType: "all",
  active: false,
});
assert.strictEqual(getOfferStatus(offer6), "Inactive");
assert.strictEqual(isCurrentlyActive(offer6), false);

console.log("✓ Created offers across all scopes and date validity states.");

// TEST 8: Test getActiveOffersFor Scoping & Matching Precision
console.log("\n[Test 8] Test Inventory Scoping Precision (Requirement 5)");

// Query Stays: Apple Orchard Homestay
// Expected: matches Offer 1 (All Stays) AND Offer 3 (Specific Apple Orchard)
// Must NOT match Offer 2 (Car SUV), Offer 4 (Upcoming), Offer 5 (Expired), or Offer 6 (Disabled)
const appleOrchardOffers = getActiveOffersFor("Stay", "Apple Orchard Homestay", "Homestay");
assert.strictEqual(appleOrchardOffers.length, 2, "Apple Orchard should match Offer 1 and Offer 3");
const appleOrchardIds = appleOrchardOffers.map((o) => o.id);
assert(appleOrchardIds.includes("offer_test_all_stays"), "Must include All Stays offer");
assert(appleOrchardIds.includes("offer_test_specific_stay"), "Must include Apple Orchard specific offer");

// Query Another Stay: Mountain View Resort
// Expected: matches Offer 1 (All Stays), but NOT Offer 3 (which was only for Apple Orchard)
const mountainViewOffers = getActiveOffersFor("Stay", "Mountain View Resort", "Resort");
assert.strictEqual(mountainViewOffers.length, 1, "Mountain View should only match All Stays offer");
assert.strictEqual(mountainViewOffers[0].id, "offer_test_all_stays");

// Query Car: Toyota Innova Crysta (Category: SUV)
// Expected: matches Offer 2 (Car SUV)
// Must NOT match Stay offers!
const innovaOffers = getActiveOffersFor("Car", "Toyota Innova Crysta", "SUV");
assert.strictEqual(innovaOffers.length, 1, "Innova (SUV) should match SUV category offer");
assert.strictEqual(innovaOffers[0].id, "offer_test_suv_category");

// Query Car: Force Traveller (Category: Traveller)
// Expected: 0 offers (since Offer 2 is strictly category SUV!)
const travellerOffers = getActiveOffersFor("Car", "Force Traveller 3350", "Traveller");
assert.strictEqual(travellerOffers.length, 0, "Traveller must NOT match SUV category offer");

// Query Bike: Royal Enfield Himalayan (Category: Mountain touring)
// Expected: 0 offers (no bike offers active)
const bikeOffers = getActiveOffersFor("Bike", "Royal Enfield Himalayan 450", "Mountain touring");
assert.strictEqual(bikeOffers.length, 0, "Bike should have 0 offers");

console.log("✓ Verified inventory scoping precision. Offers appear ONLY for inventory they actually apply to.");

// TEST 9: Edit and Toggle Active Status
console.log("\n[Test 9] Test Edit and Toggle Active Status");
const updatedOffer1 = updateOffer("offer_test_all_stays", {
  badgeText: "15% Monsoon Special",
  discountValue: "15%",
});
assert.strictEqual(updatedOffer1.badgeText, "15% Monsoon Special");
assert.strictEqual(getOfferById("offer_test_all_stays").badgeText, "15% Monsoon Special");

// Toggle active on offer2
toggleOfferActive("offer_test_suv_category");
const toggledOffer2 = getOfferById("offer_test_suv_category");
assert.strictEqual(toggledOffer2.active, false, "Offer 2 should be toggled to inactive");
assert.strictEqual(isCurrentlyActive(toggledOffer2), false);

// Now query Innova again — should return 0 since offer was deactivated!
const innovaAfterToggle = getActiveOffersFor("Car", "Toyota Innova Crysta", "SUV");
assert.strictEqual(innovaAfterToggle.length, 0, "Deactivated offer must not appear");

// Toggle it back on
toggleOfferActive("offer_test_suv_category");
assert.strictEqual(getOfferById("offer_test_suv_category").active, true);
assert.strictEqual(getActiveOffersFor("Car", "Toyota Innova Crysta", "SUV").length, 1);

console.log("✓ Edit and Toggle functionality verified.");

// TEST 10: Summary Metrics
console.log("\n[Test 10] Test Summary Metrics calculation");
const summary = getOffersSummary();
assert.strictEqual(summary.totalCount, 6, "Total offers should be 6");
assert.strictEqual(summary.liveActiveCount, 3, "Live active offers should be 3 (offer1, offer2, offer3)");
assert.strictEqual(summary.upcomingCount, 1, "Upcoming offers should be 1 (offer4)");
assert.strictEqual(summary.expiredCount, 1, "Expired offers should be 1 (offer5)");
assert.strictEqual(summary.inactiveCount, 1, "Inactive offers should be 1 (offer6)");

console.log("✓ Summary metrics calculated strictly from actual stored records:", summary);

// TEST 11: Deletion and Persistence
console.log("\n[Test 11] Test Deletion and Persistence in localStorage");
deleteOffer("offer_test_expired");
deleteOffer("offer_test_disabled");
assert.strictEqual(getAllOffers().length, 4);

const rawStored = storageMap.get("admin_offers");
assert(rawStored, "Offers must be serialized to localStorage key 'admin_offers'");
const parsed = JSON.parse(rawStored);
assert.strictEqual(parsed.length, 4, "localStorage parsed count should be 4");

// Clean up test offers
deleteOffer("offer_test_all_stays");
deleteOffer("offer_test_suv_category");
deleteOffer("offer_test_specific_stay");
deleteOffer("offer_test_future");
assert.strictEqual(getAllOffers().length, 0, "All test offers cleaned up");

console.log("✓ Deletion and persistence verified.");
console.log("\n=== ALL OFFERS TESTS PASSED SUCCESSFULLY! ===");

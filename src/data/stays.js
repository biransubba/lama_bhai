import { STAY_TYPES, ROOM_TYPES } from "./schema.js";
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
} from "./staysStore.js";

// Stays inventory: locations and property categories.
// No dummy/sample homestays are seeded. Stays appear only when added by the admin.

export const stayLocations = ["Lachen", "Lachung", "Dzongu", "Mangan", "Thangu"];

export const propertyTypes = STAY_TYPES;

export const roomTypes = ROOM_TYPES;

// Properties list is empty by default; only real admin-created stays exist.
export const properties = [];

export {
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
};

export function getPropertiesByLocation(location) {
  return [];
}

export function getStayById(id) {
  return null;
}

export function getAvailableCount(location) {
  return 0;
}
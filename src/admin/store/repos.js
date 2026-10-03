import { createRepo } from "../utils/adminRepo.js";
import { carModelsRepo, carUnitsRepo } from "../../data/vehicles.js";
import { bikeModelsRepo, bikeUnitsRepo } from "../../data/bikes.js";
import { destinationsRepo } from "../../data/destinations.js";
import { journeysRepo } from "../../data/journeys.js";
import { staysStore, roomsStore } from "../../data/staysStore.js";
import { offersStore } from "../../data/offersStore.js";
import { partnersRepo } from "../../data/partners.js";

export { carModelsRepo, carUnitsRepo };
export { bikeModelsRepo, bikeUnitsRepo };
export { destinationsRepo };
export { journeysRepo };
export const staysRepo = staysStore;
export const roomsRepo = roomsStore;
export const offersRepo = offersStore;
export { partnersRepo };
export const mediaRepo = createRepo("admin_media", []);


import React, { createContext, useContext, useState, useEffect } from "react";
import { getAllPartners, getApprovedPartners, getPartnerById, partnersRepo } from "../../data/partners.js";
import { staysStore, roomsStore } from "../../data/staysStore.js";
import { offersStore } from "../../data/offersStore.js";
import { getAllBookingRequests } from "../../utils/bookingStorage.js";

const PartnerAuthContext = createContext(null);

const STORAGE_KEY = "lama_active_partner_id";

export function PartnerAuthProvider({ children }) {
  const [partnerId, setPartnerId] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY) || null;
    } catch {
      return null;
    }
  });

  const [partnersList, setPartnersList] = useState(getAllPartners());
  const [staysList, setStaysList] = useState(staysStore.getAll());
  const [roomsList, setRoomsList] = useState(roomsStore.getAll());
  const [offersList, setOffersList] = useState(offersStore.getAll());
  const [bookingsList, setBookingsList] = useState(getAllBookingRequests());

  function refreshAll() {
    setPartnersList(getAllPartners());
    setStaysList(staysStore.getAll());
    setRoomsList(roomsStore.getAll());
    setOffersList(offersStore.getAll());
    setBookingsList(getAllBookingRequests());
  }

  useEffect(() => {
    function onStorageChange() {
      refreshAll();
    }
    window.addEventListener("storage", onStorageChange);
    window.addEventListener("admin-storage-changed", onStorageChange);
    window.addEventListener("booking-cancelled", onStorageChange);
    window.addEventListener("photos-changed", onStorageChange);
    return () => {
      window.removeEventListener("storage", onStorageChange);
      window.removeEventListener("admin-storage-changed", onStorageChange);
      window.removeEventListener("booking-cancelled", onStorageChange);
      window.removeEventListener("photos-changed", onStorageChange);
    };
  }, []);

  const currentPartner = partnerId
    ? partnersList.find((p) => p.id === partnerId) || null
    : null;

  const isApproved = Boolean(
    currentPartner &&
      (currentPartner.status === "Approved" || currentPartner.status === "approved")
  );

  // Stays strictly scoped to this partner ONLY if approved
  const partnerStays = isApproved && currentPartner
    ? staysList.filter(
        (s) =>
          s.partnerId === currentPartner.id ||
          (currentPartner.assignedPropertyIds || []).includes(s.id)
      )
    : [];

  const partnerStayIds = new Set(partnerStays.map((s) => s.id));
  const partnerStayNames = new Set(partnerStays.map((s) => s.name?.toLowerCase().trim()).filter(Boolean));

  // Rooms strictly scoped to this partner's assigned properties ONLY if approved
  // Relationship: partnerId -> propertyId -> roomId
  const partnerRooms = isApproved && currentPartner
    ? roomsList.filter((r) => r && r.propertyId && partnerStayIds.has(r.propertyId))
    : [];

  const partnerRoomIds = new Set(partnerRooms.map((r) => r.id));

  // Offers strictly scoped to this partner or their stays ONLY if approved
  const partnerOffers = isApproved && currentPartner
    ? offersList.filter((o) => {
        if (o.partnerId === currentPartner.id) return true;
        if (o.appliesToTarget && (partnerStayIds.has(o.appliesToTarget) || partnerStayNames.has(o.appliesToTarget?.toLowerCase().trim()))) {
          return true;
        }
        if (Array.isArray(o.appliesToItems)) {
          return o.appliesToItems.some((item) => {
            const itemLower = String(item).toLowerCase().trim();
            return partnerStayIds.has(item) || partnerStayNames.has(itemLower);
          });
        }
        return false;
      })
    : [];

  // Bookings strictly scoped to this partner's stays or rooms ONLY if approved
  const partnerBookings = isApproved && currentPartner
    ? bookingsList.filter(
        (b) =>
          b.service === "Stay" &&
          (partnerStayIds.has(b.inventoryId) ||
           partnerStayIds.has(b.propertyId) ||
           (b.roomId && partnerRoomIds.has(b.roomId)) ||
           partnerRoomIds.has(b.inventoryId))
      )
    : [];

  function loginAsPartner(id) {
    try {
      localStorage.setItem(STORAGE_KEY, id);
      sessionStorage.setItem(STORAGE_KEY, id);
    } catch (e) {
      console.warn("Storage write error", e);
    }
    setPartnerId(id);
    refreshAll();
  }

  function logoutPartner() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn("Storage remove error", e);
    }
    setPartnerId(null);
  }

  const approvedPartners = partnersList.filter(
    (p) => p.status === "Approved" || p.status === "approved"
  );

  function updatePartnerProfile(updates) {
    if (!currentPartner) return false;
    partnersRepo.update("id", currentPartner.id, updates);
    refreshAll();
    return true;
  }

  return (
    <PartnerAuthContext.Provider
      value={{
        partnerId,
        currentPartner,
        isApproved,
        approvedPartners,
        allPartners: partnersList,
        partnerStays,
        partnerRooms,
        partnerRoomIds,
        partnerOffers,
        partnerBookings,
        loginAsPartner,
        logoutPartner,
        updatePartnerProfile,
        refreshAll,
      }}
    >
      {children}
    </PartnerAuthContext.Provider>
  );
}

export function usePartnerAuth() {
  const ctx = useContext(PartnerAuthContext);
  if (!ctx) {
    throw new Error("usePartnerAuth must be used within PartnerAuthProvider");
  }
  return ctx;
}

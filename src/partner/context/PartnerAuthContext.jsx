import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api } from "../../utils/api.js";
import { getAllPartners, getApprovedPartners, getPartnerById, partnersRepo } from "../../data/partners.js";
import { staysStore, roomsStore } from "../../data/staysStore.js";
import { offersStore } from "../../data/offersStore.js";
import { getAllBookingRequests } from "../../utils/bookingStorage.js";

const PartnerAuthContext = createContext(null);

const LEGACY_STORAGE_KEY = "lama_active_partner_id";

export function PartnerAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  const [partnersList, setPartnersList] = useState(getAllPartners());
  const [staysList, setStaysList] = useState(staysStore.getAll());
  const [roomsList, setRoomsList] = useState(roomsStore.getAll());
  const [offersList, setOffersList] = useState(offersStore.getAll());
  const [bookingsList, setBookingsList] = useState(getAllBookingRequests());

  // Clean up obsolete mock partner auth key from storage
  useEffect(() => {
    try {
      localStorage.removeItem(LEGACY_STORAGE_KEY);
      sessionStorage.removeItem(LEGACY_STORAGE_KEY);
    } catch (_) {}
  }, []);

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

  // Fetch current session from GET /api/auth/me on mount / refresh
  const checkAuth = useCallback(async () => {
    try {
      setLoading(true);
      setAuthError(null);
      const res = await api.auth.getMe();
      if (res && res.success && res.user) {
        // Enforce owner / admin role restriction
        if (res.user.role === "owner" || res.user.role === "admin") {
          setUser(res.user);
        } else {
          setUser(null);
          setAuthError("Access denied: Account role must be Partner/Owner or Admin.");
        }
      } else {
        setUser(null);
      }
    } catch (err) {
      // 401 Not authenticated is normal when logged out
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Log in using backend POST /api/auth/login
  const login = async (email, password) => {
    setLoading(true);
    setAuthError(null);
    try {
      const res = await api.auth.login({ email, password });
      if (!res || !res.success || !res.user) {
        throw new Error(res?.error || "Login failed. Please check your credentials.");
      }

      // Check role authorization: Partner portal requires 'owner' or 'admin'
      if (res.user.role !== "owner" && res.user.role !== "admin") {
        // Terminate session immediately for unauthorized roles
        try {
          await api.auth.logout();
        } catch (_) {}
        const roleErr = new Error("Access denied: This portal is reserved for verified Host & Tourism Partners. Tourist accounts cannot log in here.");
        roleErr.isRoleError = true;
        throw roleErr;
      }

      // Verify the session through /api/auth/me to confirm cookie transport
      const meRes = await api.auth.getMe();
      const verifiedUser = meRes?.user || res.user;

      setUser(verifiedUser);
      return { success: true, user: verifiedUser };
    } catch (err) {
      setUser(null);
      setAuthError(err.message || "Failed to log in");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Log out using backend POST /api/auth/logout
  const logout = async () => {
    setLoading(true);
    try {
      await api.auth.logout();
    } catch (e) {
      console.warn("Backend logout error:", e);
    } finally {
      setUser(null);
      try {
        localStorage.removeItem(LEGACY_STORAGE_KEY);
        sessionStorage.removeItem(LEGACY_STORAGE_KEY);
      } catch (_) {}
      setLoading(false);
    }
  };

  // Backward-compatible alias for existing components
  const logoutPartner = logout;
  const loginAsPartner = login;

  // Normalized partner profile based on authenticated backend user
  const currentPartner = user
    ? {
        id: user._id || user.id,
        _id: user._id || user.id,
        name: user.name || "Partner Host",
        email: user.email || "",
        phone: user.phone || "",
        agency:
          user.partnerProfile?.agencyName ||
          user.agencyName ||
          user.name ||
          "Local Homestay Host",
        location: user.partnerProfile?.location || "Sikkim",
        status:
          user.role === "admin"
            ? "Approved"
            : user.partnerProfile?.verificationStatus || "Pending",
        notes: user.partnerProfile?.notes || "",
        reviewerNotes: user.partnerProfile?.reviewerNotes || "",
        role: user.role,
        isActive: user.isActive !== false,
        assignedPropertyIds: user.assignedPropertyIds || [],
      }
    : null;

  const authenticated = Boolean(
    user && (user.role === "owner" || user.role === "admin")
  );

  const isApproved = Boolean(
    user &&
      (user.role === "admin" ||
        user.partnerProfile?.verificationStatus === "Approved" ||
        user.partnerProfile?.verificationStatus === "Pending" ||
        !user.partnerProfile?.verificationStatus)
  );

  const isVerifiedHost = Boolean(
    user &&
      (user.role === "admin" ||
        user.partnerProfile?.verificationStatus === "Approved")
  );

  const partnerProfile = user?.partnerProfile || null;
  const partnerId = currentPartner?.id || null;

  // Stays strictly scoped to this partner ONLY if approved
  const partnerStays = isApproved && currentPartner
    ? staysList.filter(
        (s) =>
          s.partnerId === currentPartner.id ||
          s.partnerId === currentPartner._id ||
          (currentPartner.assignedPropertyIds || []).includes(s.id)
      )
    : [];

  const partnerStayIds = new Set(partnerStays.map((s) => s.id));
  const partnerStayNames = new Set(
    partnerStays.map((s) => s.name?.toLowerCase().trim()).filter(Boolean)
  );

  // Rooms strictly scoped to this partner's assigned properties ONLY if approved
  const partnerRooms = isApproved && currentPartner
    ? roomsList.filter((r) => r && r.propertyId && partnerStayIds.has(r.propertyId))
    : [];

  const partnerRoomIds = new Set(partnerRooms.map((r) => r.id));

  // Offers strictly scoped to this partner or their stays ONLY if approved
  const partnerOffers = isApproved && currentPartner
    ? offersList.filter((o) => {
        if (o.partnerId === currentPartner.id) return true;
        if (
          o.appliesToTarget &&
          (partnerStayIds.has(o.appliesToTarget) ||
            partnerStayNames.has(o.appliesToTarget?.toLowerCase().trim()))
        ) {
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
        user,
        partnerProfile,
        loading,
        authenticated,
        authError,
        partnerId,
        currentPartner,
        isApproved,
        isVerifiedHost,
        approvedPartners,
        allPartners: partnersList,
        partnerStays,
        partnerRooms,
        partnerRoomIds,
        partnerOffers,
        partnerBookings,
        login,
        logout,
        loginAsPartner,
        logoutPartner,
        checkAuth,
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


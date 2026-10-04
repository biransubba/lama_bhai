import React from "react";
import { BrowserRouter, Routes, Route, Outlet, Navigate } from "react-router-dom";
import NotFound from "./pages/NotFound.jsx";
import Navbar from "./components/Navbar.jsx";
import Home from "./pages/Home.jsx";
import CarBooking from "./pages/CarBooking.jsx";
import CarModelDetails from "./pages/CarModelDetails.jsx";
import HotelHomestay from "./pages/HotelHomestay.jsx";
import StaysByLocation from "./pages/StaysByLocation.jsx";
import RentalBike from "./pages/RentalBike.jsx";
import BikeModelDetails from "./pages/BikeModelDetails.jsx";
import PlanTrip from "./pages/PlanTrip.jsx";
import Permit from "./pages/Permit.jsx";
import Destinations from "./pages/Destinations.jsx";
import DestinationDetails from "./pages/DestinationDetails.jsx";
import Journeys from "./pages/Journeys.jsx";
import VehicleDetails from "./pages/VehicleDetails.jsx";
import BikeDetails from "./pages/BikeDetails.jsx";
import StayDetails from "./pages/StayDetails.jsx";
import JourneyDetails from "./pages/JourneyDetails.jsx";
import ManageBooking from "./pages/ManageBooking.jsx";


import AdminLayout from "./admin/components/AdminLayout.jsx";
import AdminDashboard from "./admin/pages/AdminDashboard.jsx";
import AdminCars from "./admin/pages/AdminCars.jsx";
import AdminBikes from "./admin/pages/AdminBikes.jsx";
import AdminStays from "./admin/pages/AdminStays.jsx";
import AdminPartners from "./admin/pages/AdminPartners.jsx";
import AdminDestinations from "./admin/pages/AdminDestinations.jsx";
import AdminJourneys from "./admin/pages/AdminJourneys.jsx";
import AdminOffers from "./admin/pages/AdminOffers.jsx";
import AdminMedia from "./admin/pages/AdminMedia.jsx";
import AdminBookingRequests from "./admin/pages/AdminBookingRequests.jsx";
import AdminTripPlanner from "./admin/pages/AdminTripPlanner.jsx";
import AdminPermitSettings from "./admin/pages/AdminPermitSettings.jsx";
import AdminSettings from "./admin/pages/AdminSettings.jsx";
import AdminExploreWays from "./admin/pages/AdminExploreWays.jsx";
import AdminLiveRoutes from "./admin/pages/AdminLiveRoutes.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";

import { PartnerAuthProvider } from "./partner/context/PartnerAuthContext.jsx";
import PartnerLayout from "./partner/components/PartnerLayout.jsx";
import PartnerLogin from "./partner/pages/PartnerLogin.jsx";
import PartnerDashboard from "./partner/pages/PartnerDashboard.jsx";
import PartnerProperties from "./partner/pages/PartnerProperties.jsx";
import PartnerAvailability from "./partner/pages/PartnerAvailability.jsx";
import PartnerPhotos from "./partner/pages/PartnerPhotos.jsx";
import PartnerBookings from "./partner/pages/PartnerBookings.jsx";
import PartnerProfile from "./partner/pages/PartnerProfile.jsx";
import PartnerOffers from "./partner/pages/PartnerOffers.jsx";
import Footer from "./components/Footer.jsx";

function PublicLayout() {
  return (
    <>
      <Navbar />
      <Outlet />
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/car-booking" element={<CarBooking />} />
          <Route path="/car-booking/:modelSlug" element={<CarModelDetails />} />
          <Route path="/hotel-homestay" element={<HotelHomestay />} />
          <Route path="/hotel-homestay/:location" element={<StaysByLocation />} />
          <Route path="/rental-bike" element={<RentalBike />} />
          <Route path="/rental-bike/:modelSlug" element={<BikeModelDetails />} />
          <Route path="/plan-trip" element={<PlanTrip />} />
          <Route path="/permit" element={<Permit />} />
          <Route path="/destinations" element={<Destinations />} />
          <Route path="/destinations/:slug" element={<DestinationDetails />} />
          <Route path="/journeys" element={<Journeys />} />
          <Route path="/journeys/:slug" element={<JourneyDetails />} />
          <Route path="/vehicles/:id" element={<VehicleDetails />} />
          <Route path="/bikes/:id" element={<BikeDetails />} />
          <Route path="/stays/:id" element={<StayDetails />} />
          <Route path="/stays/:id/rooms/:roomId" element={<StayDetails />} />
          <Route path="/manage-booking" element={<ManageBooking />} />
        </Route>


        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="cars" element={<AdminCars />} />
          <Route path="car" element={<Navigate to="/admin/cars" replace />} />
          <Route path="bikes" element={<AdminBikes />} />
          <Route path="bike" element={<Navigate to="/admin/bikes" replace />} />
          <Route path="stays" element={<AdminStays />} />
          <Route path="stay" element={<Navigate to="/admin/stays" replace />} />
          <Route path="partners" element={<AdminPartners />} />
          <Route path="partner" element={<Navigate to="/admin/partners" replace />} />
          <Route path="destinations" element={<AdminDestinations />} />
          <Route path="destination" element={<Navigate to="/admin/destinations" replace />} />
          <Route path="explore" element={<AdminExploreWays />} />
          <Route path="explore-ways" element={<Navigate to="/admin/explore" replace />} />
          <Route path="journeys" element={<AdminJourneys />} />
          <Route path="journey" element={<Navigate to="/admin/journeys" replace />} />
          <Route path="trip-planner" element={<AdminTripPlanner />} />
          <Route path="planner" element={<Navigate to="/admin/trip-planner" replace />} />
          <Route path="permits" element={<AdminPermitSettings />} />
          <Route path="permit" element={<Navigate to="/admin/permits" replace />} />
          <Route path="offers" element={<AdminOffers />} />
          <Route path="offer" element={<Navigate to="/admin/offers" replace />} />
          <Route path="media" element={<AdminMedia />} />
          <Route path="bookings" element={<AdminBookingRequests />} />
          <Route path="booking" element={<Navigate to="/admin/bookings" replace />} />
          <Route path="booking-requests" element={<Navigate to="/admin/bookings" replace />} />
          <Route path="live-routes" element={<AdminLiveRoutes />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="setting" element={<Navigate to="/admin/settings" replace />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>

        <Route
          element={
            <PartnerAuthProvider>
              <Outlet />
            </PartnerAuthProvider>
          }
        >
          <Route path="/partner/login" element={<PartnerLogin />} />
          <Route path="/partner" element={<PartnerLayout />}>
            <Route index element={<PartnerDashboard />} />
            <Route path="properties" element={<PartnerProperties />} />
            <Route path="stays" element={<Navigate to="/partner/properties" replace />} />
            <Route path="availability" element={<PartnerAvailability />} />
            <Route path="photos" element={<PartnerPhotos />} />
            <Route path="bookings" element={<PartnerBookings />} />
            <Route path="profile" element={<PartnerProfile />} />
            <Route path="offers" element={<PartnerOffers />} />
            <Route path="*" element={<Navigate to="/partner" replace />} />
          </Route>
        </Route>
        <Route path="/partners" element={<Navigate to="/partner" replace />} />
        <Route path="/owner" element={<Navigate to="/partner" replace />} />
        <Route path="/owner/*" element={<Navigate to="/partner" replace />} />
        <Route path="/host" element={<Navigate to="/partner" replace />} />
        <Route path="/host/*" element={<Navigate to="/partner" replace />} />
        <Route path="/api/owner" element={<Navigate to="/partner" replace />} />
        <Route path="/api/owner/*" element={<Navigate to="/partner" replace />} />
        <Route path="/api/admin" element={<Navigate to="/admin" replace />} />
        <Route path="/api/admin/*" element={<Navigate to="/admin" replace />} />

        {/* Global Fallback for unknown URLs */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
    </ErrorBoundary>
  );
}
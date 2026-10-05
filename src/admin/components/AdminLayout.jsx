import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  SquaresFour,
  Car,
  Bicycle,
  HouseLine,
  UsersThree,
  MapPin,
  Compass,
  Tag,
  ImageSquare,
  CalendarCheck,
  Gear,
  ArrowSquareOut,
  MapTrifold,
  ShieldCheck,
  Sparkle,
  Broadcast,
  Bed,
} from "phosphor-react";
import "../styles/admin.css";

const navItems = [
  { label: "Dashboard", path: "/admin", icon: <SquaresFour size={18} weight="duotone" /> },
  { label: "Cars", path: "/admin/cars", icon: <Car size={18} weight="duotone" /> },
  { label: "Bikes", path: "/admin/bikes", icon: <Bicycle size={18} weight="duotone" /> },
  { label: "Listings Moderation", path: "/admin/stays", icon: <Bed size={18} weight="duotone" /> },
  { label: "Partners", path: "/admin/partners", icon: <UsersThree size={18} weight="duotone" /> },
  { label: "Destinations", path: "/admin/destinations", icon: <MapPin size={18} weight="duotone" /> },
  { label: "Live Routes", path: "/admin/live-routes", icon: <Broadcast size={18} weight="duotone" /> },
  { label: "Explore Cards", path: "/admin/explore", icon: <Sparkle size={18} weight="duotone" /> },
  { label: "Journeys", path: "/admin/journeys", icon: <Compass size={18} weight="duotone" /> },
  { label: "Trip Planner", path: "/admin/trip-planner", icon: <MapTrifold size={18} weight="duotone" /> },
  { label: "Permits", path: "/admin/permits", icon: <ShieldCheck size={18} weight="duotone" /> },
  { label: "Offers", path: "/admin/offers", icon: <Tag size={18} weight="duotone" /> },
  { label: "Media", path: "/admin/media", icon: <ImageSquare size={18} weight="duotone" /> },
  { label: "Booking Requests", path: "/admin/bookings", icon: <CalendarCheck size={18} weight="duotone" /> },
  { label: "Settings", path: "/admin/settings", icon: <Gear size={18} weight="duotone" /> },
];

export default function AdminLayout() {
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar__brand">
          Lama Bhai <span>Main Admin</span>
        </div>
        <nav className="admin-sidebar__nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/admin"}
              className={({ isActive }) =>
                `admin-sidebar__link ${isActive ? "admin-sidebar__link--active" : ""}`
              }
              style={{ display: "flex", alignItems: "center", gap: "10px" }}
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="admin-sidebar__footer">
          <NavLink
            to="/partner"
            target="_blank"
            rel="noopener noreferrer"
            className="admin-sidebar__footer-link"
          >
            <span>Host Partner Portal</span>
            <ArrowSquareOut size={13} weight="bold" />
          </NavLink>
          <NavLink
            to="/"
            className="admin-sidebar__footer-link admin-sidebar__footer-link--exit"
          >
            <span>Exit to public site</span>
            <ArrowSquareOut size={13} weight="bold" />
          </NavLink>
        </div>
      </aside>
      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
}
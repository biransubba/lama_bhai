import React from "react";
import { Link } from "react-router-dom";
import { IdentificationCard, ArrowRight } from "phosphor-react";
import "./PermitAssist.css";

export default function PermitAssist() {
  return (
    <section className="permit-assist">
      <div className="permit-assist__inner">
        <IdentificationCard size={36} weight="duotone" className="permit-assist__icon" />
        <div className="permit-assist__text">
          <h2 className="permit-assist__heading">Permit assistance</h2>
          <p className="permit-assist__desc">
            Key high-altitude circuits and border areas across Sikkim fall under Restricted or Protected Area regulations.
            Indian nationals need an Inner Line Permit (ILP), and foreign nationals need a
            Protected Area Permit (PAP), arranged in advance for specific routes.
          </p>
        </div>
        <Link to="/permit" className="permit-assist__cta">
          Check permit requirements <ArrowRight size={18} weight="bold" />
        </Link>
      </div>
    </section>
  );
}
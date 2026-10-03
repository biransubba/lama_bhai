import React from "react";
import {
  Sparkle,
  Compass,
  Car,
  HouseLine,
  ShieldCheck,
  MapTrifold,
  Headset,
  CheckCircle,
} from "phosphor-react";
import "./WhyLamaBhai.css";

const reasons = [
  {
    id: "expertise",
    icon: Compass,
    title: "Native Sikkim Expertise",
    tag: "100% Local Roots",
    desc: "We know every mountain curve, seasonal road closure, and high-altitude transition firsthand — not from a map or brochure.",
    highlight: "Gangtok & North Sikkim team",
  },
  {
    id: "transport",
    icon: Car,
    title: "Terrain-Ready Mountain Fleet",
    tag: "4x4 & High Clearance",
    desc: "High-clearance Mahindra Boleros, Scorpios, and Innovas paired with seasoned, certified local mountain drivers.",
    highlight: "Built for alpine roads",
  },
  {
    id: "stays",
    icon: HouseLine,
    title: "Handpicked Family Stays",
    tag: "Curated Homestays",
    desc: "Authentic wooden cottages and welcoming Sikkimese host families serving home-cooked organic meals and hot local tea.",
    highlight: "Directly vetted & clean",
  },
  {
    id: "permits",
    icon: ShieldCheck,
    title: "Official Permit Clearance",
    tag: "Guaranteed PAP Support",
    desc: "Hassle-free document handling for North Sikkim, Nathula, and high-pass border checkposts without confusing paperwork.",
    highlight: "Indian & Foreign tourists",
  },
  {
    id: "planning",
    icon: MapTrifold,
    title: "Clear, Unrushed Itineraries",
    tag: "Custom Circuits",
    desc: "Trip plans tailored to acclimatization, seasonal weather, and your schedule — with zero hidden middleman commissions.",
    highlight: "Flexible & honest pricing",
  },
  {
    id: "support",
    icon: Headset,
    title: "Dedicated Ground Support",
    tag: "Always Connected",
    desc: "Direct phone and WhatsApp connection to our local team throughout your journey across every district and pass.",
    highlight: "24/7 on-ground assistance",
  },
];

export default function WhyLamaBhai() {
  return (
    <section className="why" id="why-lama-bhai" aria-label="Why travel with Lama Bhai">
      <div className="why__inner">
        {/* Section Header consistent with ExploreWays & Destinations */}
        <div className="why__header">
          <span className="why__eyebrow">
            <Sparkle size={14} weight="fill" /> Local Roots &amp; Mountain Trust
          </span>
          <h2 className="why__heading">Why travel with Lama Bhai?</h2>
          <p className="why__subtitle">
            Born and rooted in Sikkim. We don't run automated call centers — we are real local people on the ground arranging authentic mountain journeys.
          </p>
        </div>

        {/* 6-Card Bento Grid */}
        <div className="why__grid">
          {reasons.map((r) => {
            const Icon = r.icon;
            return (
              <div className="why-card" key={r.id}>
                <div className="why-card__top">
                  <div className="why-card__icon-box">
                    <Icon size={24} weight="duotone" />
                  </div>
                  <span className="why-card__tag">{r.tag}</span>
                </div>

                <div className="why-card__body">
                  <h3 className="why-card__title">{r.title}</h3>
                  <p className="why-card__desc">{r.desc}</p>
                </div>

                <div className="why-card__footer">
                  <CheckCircle size={15} weight="fill" className="why-card__check-icon" />
                  <span className="why-card__highlight">{r.highlight}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
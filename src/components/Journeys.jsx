import React from "react";
import { Link } from "react-router-dom";
import { MapPinLine, IdentificationCard, ArrowUpRight } from "phosphor-react";
import { journeys } from "../data/journeys.js";
import DestinationImage from "./DestinationImage.jsx";
import "./Journeys.css";

export default function Journeys() {
  return (
    <section className="journeys" id="journeys">

      <div className="journeys__inner">
        <h2 className="journeys__heading">Popular Sikkim journeys</h2>

        <div className="journeys__grid">
          {journeys.map((j) => (
            <Link to={`/journeys/${j.slug}`} className="journey-card" key={j.slug}>
              <DestinationImage src={j.image} alt={j.name} />
              <h3 className="journey-card__name">{j.name}</h3>
              <p className="journey-card__desc">{j.shortDescription}</p>

              <div className="journey-card__destinations">
                {j.destinations.map((d) => (
                  <span key={d} className="journey-card__tag">
                    <MapPinLine size={13} /> {d}
                  </span>
                ))}
              </div>

              <div className="journey-card__permit">
                <IdentificationCard size={15} /> {j.permitNote}
              </div>

              <span className="journey-card__cta">
                Explore journey <ArrowUpRight size={16} weight="bold" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
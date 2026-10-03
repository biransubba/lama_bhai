import React from "react";
import { Tag, Check } from "phosphor-react";
import "./OfferBadge.css";

// Reusable — shows nothing if there are no active offers for this item.
// Prominently displays discount/perk, campaign title, and key terms (e.g. 2 nights booking)
export default function OfferBadge({ offers, showTerms = true }) {
  if (!offers || offers.length === 0) return null;

  return (
    <div className="offer-badge-list">
      {offers.map((o) => {
        // High-converting hook: prioritize badgeText (e.g. "15% off for dinner"), then discountValue, then title
        const hook = o.badgeText || o.discountValue || o.title;
        const hasSeparateTitle = o.title && o.title.toLowerCase().trim() !== hook.toLowerCase().trim();

        return (
          <div
            className="offer-badge-wrapper"
            key={o.id}
            title={`${o.title}: ${hook}${o.description ? ` (${o.description})` : ""}`}
          >
            <span className="offer-badge">
              <Tag size={12} weight="fill" className="offer-badge__icon" />
              <strong className="offer-badge__hook">{hook}</strong>
              {hasSeparateTitle && (
                <span className="offer-badge__title">• {o.title}</span>
              )}
            </span>

            {showTerms && o.description && (
              <span className="offer-badge__terms-pill" title={o.description}>
                <Check size={11} weight="bold" style={{ marginRight: 3 }} />
                {o.description.length > 40 ? o.description.slice(0, 40) + "…" : o.description}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
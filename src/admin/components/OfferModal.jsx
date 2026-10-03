import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  Tag,
  Check,
  Calendar,
  Sparkle,
  Percent,
  CurrencyInr,
  Gift,
  HouseLine,
  Car,
  Bicycle,
  Compass,
  MagnifyingGlass,
  Info,
} from "phosphor-react";
import { carModelsRepo } from "../../data/vehicles.js";
import { bikeModelsRepo } from "../../data/bikes.js";
import {
  OFFER_SERVICES,
  OFFER_SCOPE_TYPES,
  VEHICLE_CATEGORIES,
  BIKE_CATEGORIES,
} from "../../data/schema.js";

export default function OfferModal({ initialData = null, onSave, onClose }) {
  const isEditing = Boolean(initialData && initialData.id);

  // Form states
  const [title, setTitle] = useState(initialData?.title || "");
  const [badgeText, setBadgeText] = useState(initialData?.badgeText || "Special Offer");
  const [appliesToService, setAppliesToService] = useState(
    initialData?.appliesToService === "Bike" ? "Bike" : "Car"
  );
  const [scopeType, setScopeType] = useState(initialData?.scopeType || "all");
  const [appliesToCategory, setAppliesToCategory] = useState(initialData?.appliesToCategory || "");
  const [appliesToItems, setAppliesToItems] = useState(
    Array.isArray(initialData?.appliesToItems)
      ? initialData.appliesToItems
      : initialData?.appliesToTarget && initialData.appliesToTarget !== "All"
      ? [initialData.appliesToTarget]
      : []
  );

  const [discountType, setDiscountType] = useState(initialData?.discountType || "none");
  const [discountValue, setDiscountValue] = useState(initialData?.discountValue || "");
  const [startDate, setStartDate] = useState(initialData?.startDate || "");
  const [endDate, setEndDate] = useState(initialData?.endDate || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [active, setActive] = useState(
    initialData ? initialData.active === true || initialData.active === "true" : true
  );

  const [itemSearch, setItemSearch] = useState("");
  const [error, setError] = useState("");

  // Inventory Sources (Vehicles & Bikes only for Main Admin)
  const allCars = useMemo(() => carModelsRepo.getAll(), []);
  const allBikes = useMemo(() => bikeModelsRepo.getAll(), []);

  // Available categories based on selected service
  const availableCategories = useMemo(() => {
    switch (appliesToService) {
      case "Car":
        return VEHICLE_CATEGORIES;
      case "Bike":
        return BIKE_CATEGORIES;
      default:
        return VEHICLE_CATEGORIES;
    }
  }, [appliesToService]);

  // Available items based on selected service
  const availableItems = useMemo(() => {
    switch (appliesToService) {
      case "Car":
        return allCars.map((c) => ({ id: c.name, name: c.name, extra: c.category, category: c.category }));
      case "Bike":
        return allBikes.map((b) => ({ id: b.name, name: b.name, extra: b.category, category: b.category }));
      default:
        return [];
    }
  }, [appliesToService, allCars, allBikes]);

  // Filtered items in the picker
  const filteredItems = useMemo(() => {
    if (!itemSearch.trim()) return availableItems;
    const q = itemSearch.toLowerCase().trim();
    return availableItems.filter(
      (it) => it.name.toLowerCase().includes(q) || (it.extra && it.extra.toLowerCase().includes(q))
    );
  }, [availableItems, itemSearch]);

  // When service changes, reset category and items if incompatible
  function handleServiceChange(newService) {
    setAppliesToService(newService);
    setAppliesToCategory("");
    setAppliesToItems([]);
    if (newService === "All") {
      setScopeType("all");
    }
  }

  function toggleItemSelection(itemName) {
    if (appliesToItems.includes(itemName)) {
      setAppliesToItems(appliesToItems.filter((i) => i !== itemName));
    } else {
      setAppliesToItems([...appliesToItems, itemName]);
    }
  }

  function handleSelectAllItems() {
    setAppliesToItems(availableItems.map((i) => i.name));
  }

  function handleClearAllItems() {
    setAppliesToItems([]);
  }

  function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Please enter a title for the offer.");
      return;
    }

    if (startDate && endDate && endDate < startDate) {
      setError("Valid Until date cannot be earlier than Valid From date.");
      return;
    }

    if (scopeType === "category" && !appliesToCategory) {
      setError("Please select an applicable category.");
      return;
    }

    if (scopeType === "item" && appliesToItems.length === 0) {
      setError("Please select at least one specific item for this offer.");
      return;
    }

    const payload = {
      ...(initialData || {}),
      title: title.trim(),
      badgeText: badgeText.trim() || "Special Offer",
      appliesToService,
      scopeType,
      appliesToCategory: scopeType === "category" ? appliesToCategory : "",
      appliesToItems: scopeType === "item" ? appliesToItems : [],
      appliesToTarget: scopeType === "item" && appliesToItems.length === 1 ? appliesToItems[0] : "",
      discountType,
      discountValue: discountValue.trim() || null,
      startDate: startDate || "",
      endDate: endDate || "",
      description: description.trim(),
      active: Boolean(active),
    };

    onSave(payload);
  }

  return (
    <div className="offer-modal-overlay" onClick={onClose}>
      <div
        className="offer-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="offer-modal-header">
          <div className="offer-modal-header-left">
            <div className="offer-modal-icon-badge">
              <Tag size={22} weight="fill" />
            </div>
            <div>
              <h2 className="offer-modal-title">
                {isEditing ? "Edit Promotional Offer" : "Create New Promotional Offer"}
              </h2>
              <span className="offer-modal-subtitle">
                Publish special rates, seasonal packages, and perks on public listings
              </span>
            </div>
          </div>
          <button className="offer-modal-close-btn" onClick={onClose} type="button" aria-label="Close modal">
            <X size={20} weight="bold" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="offer-modal-body">
          {error && (
            <div
              style={{
                background: "#ffebee",
                color: "#c62828",
                padding: "10px 14px",
                borderRadius: "8px",
                fontSize: "0.85rem",
                border: "1px solid #ffcdd2",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Info size={16} weight="bold" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Basic Information & Badge */}
          <div className="offer-modal-section">
            <h3 className="offer-modal-section-title">
              <Sparkle size={16} color="var(--color-peach-deep)" weight="fill" />
              Offer Details &amp; Display Badge
            </h3>
            <div className="offer-form-grid-2">
              <div className="offer-form-field">
                <label className="offer-form-label">
                  Offer Title <span className="offer-form-label-req">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Monsoon Early Bird, Valley View Special"
                  className="offer-form-input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="offer-form-field">
                <label className="offer-form-label">
                  Pill Badge Text <span className="offer-form-label-req">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. 15% Off, Free Dinner, Season Deal"
                  className="offer-form-input"
                  value={badgeText}
                  onChange={(e) => setBadgeText(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* Section 2: Applicable Service & Scope */}
          <div className="offer-modal-section">
            <h3 className="offer-modal-section-title">
              <Tag size={16} color="var(--color-peach-deep)" weight="fill" />
              Target Service &amp; Inventory Scope
            </h3>

            {/* Applicable Service */}
            <div className="offer-form-field">
              <label className="offer-form-label">
                Applicable Service <span className="offer-form-label-req">*</span>
              </label>
              <div className="offer-service-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
                {[
                  { id: "Car", label: "Cars / Mountain Cabs", icon: <Car size={18} weight="duotone" /> },
                  { id: "Bike", label: "Adventure Bikes", icon: <Bicycle size={18} weight="duotone" /> },
                ].map((svc) => (
                  <button
                    key={svc.id}
                    type="button"
                    className={`offer-service-btn ${appliesToService === svc.id ? "offer-service-btn--active" : ""}`}
                    onClick={() => handleServiceChange(svc.id)}
                  >
                    {svc.icon}
                    <span>{svc.label}</span>
                  </button>
                ))}
              </div>
              <span style={{ fontSize: "0.76rem", color: "var(--color-text-muted)", marginTop: "6px", display: "block" }}>
                💡 <em>Homestay and stay offers are managed directly by verified property partners in their host portal.</em>
              </span>
            </div>

            {/* Scope Level (Only if not All Services) */}
            {appliesToService !== "All" && (
              <div className="offer-form-field">
                <label className="offer-form-label">
                  Inventory Scope Level <span className="offer-form-label-req">*</span>
                </label>
                <div className="offer-scope-grid">
                  <label className={`offer-scope-card ${scopeType === "all" ? "offer-scope-card--active" : ""}`}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <input
                        type="radio"
                        name="scopeType"
                        value="all"
                        checked={scopeType === "all"}
                        onChange={() => setScopeType("all")}
                        style={{ accentColor: "var(--color-peach-deep)" }}
                      />
                      <strong style={{ fontSize: "0.85rem", color: "var(--color-navy)" }}>Entire Service</strong>
                    </div>
                    <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted)" }}>
                      All {appliesToService} items
                    </span>
                  </label>

                  <label className={`offer-scope-card ${scopeType === "category" ? "offer-scope-card--active" : ""}`}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <input
                        type="radio"
                        name="scopeType"
                        value="category"
                        checked={scopeType === "category"}
                        onChange={() => setScopeType("category")}
                        style={{ accentColor: "var(--color-peach-deep)" }}
                      />
                      <strong style={{ fontSize: "0.85rem", color: "var(--color-navy)" }}>By Category</strong>
                    </div>
                    <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted)" }}>
                      E.g. Homestay, SUV
                    </span>
                  </label>

                  <label className={`offer-scope-card ${scopeType === "item" ? "offer-scope-card--active" : ""}`}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <input
                        type="radio"
                        name="scopeType"
                        value="item"
                        checked={scopeType === "item"}
                        onChange={() => setScopeType("item")}
                        style={{ accentColor: "var(--color-peach-deep)" }}
                      />
                      <strong style={{ fontSize: "0.85rem", color: "var(--color-navy)" }}>Specific Items</strong>
                    </div>
                    <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted)" }}>
                      Select individual item(s)
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* Conditional Category Selector with Peach Dropdown */}
            {appliesToService !== "All" && scopeType === "category" && (
              <div className="offer-form-field">
                <label className="offer-form-label">
                  Select Applicable Category <span className="offer-form-label-req">*</span>
                </label>
                <select
                  className="offer-form-select"
                  value={appliesToCategory}
                  onChange={(e) => setAppliesToCategory(e.target.value)}
                  required
                >
                  <option value="">Choose category...</option>
                  {availableCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Conditional Specific Items Checklist */}
            {appliesToService !== "All" && scopeType === "item" && (
              <div className="offer-form-field">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2px" }}>
                  <label className="offer-form-label" style={{ margin: 0 }}>
                    Select Applicable Items ({appliesToItems.length} selected){" "}
                    <span className="offer-form-label-req">*</span>
                  </label>
                  <div style={{ display: "flex", gap: "8px", fontSize: "0.75rem" }}>
                    <button type="button" onClick={handleSelectAllItems} className="admin-link-btn" style={{ fontWeight: 600 }}>
                      Select All
                    </button>
                    <span>•</span>
                    <button type="button" onClick={handleClearAllItems} className="admin-link-btn" style={{ color: "var(--color-text-muted)" }}>
                      Clear
                    </button>
                  </div>
                </div>

                {/* Search item box */}
                <div style={{ position: "relative" }}>
                  <MagnifyingGlass
                    size={14}
                    style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }}
                  />
                  <input
                    type="text"
                    placeholder={`Search ${appliesToService.toLowerCase()} items...`}
                    className="offer-form-input"
                    value={itemSearch}
                    onChange={(e) => setItemSearch(e.target.value)}
                    style={{ paddingLeft: "32px", fontSize: "0.82rem", height: "36px" }}
                  />
                </div>

                {/* Items checklist box */}
                <div className="offer-items-picker">
                  {filteredItems.length === 0 ? (
                    <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", fontStyle: "italic", padding: "6px 0" }}>
                      No matching items found.
                    </span>
                  ) : (
                    filteredItems.map((item) => {
                      const isSelected = appliesToItems.includes(item.name);
                      return (
                        <label key={item.id} className="offer-item-row">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleItemSelection(item.name)}
                            style={{ accentColor: "var(--color-peach-deep)" }}
                          />
                          <strong style={{ color: "var(--color-navy)" }}>{item.name}</strong>
                          {item.extra && (
                            <span style={{ color: "var(--color-text-muted)", fontSize: "0.75rem" }}>
                              ({item.extra})
                            </span>
                          )}
                        </label>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Promotional Discount or Value Perk */}
          <div className="offer-modal-section">
            <h3 className="offer-modal-section-title">
              <Percent size={16} color="var(--color-peach-deep)" weight="fill" />
              Promotion or Value-Add Specification
            </h3>
            <div className="offer-form-grid-2">
              <div className="offer-form-field">
                <label className="offer-form-label">
                  Promotion / Value-Add Type
                </label>
                <select
                  className="offer-form-select"
                  value={discountType}
                  onChange={(e) => {
                    setDiscountType(e.target.value);
                    if (e.target.value === "none") setDiscountValue("");
                  }}
                >
                  <option value="none">Informational / Seasonal Package</option>
                  <option value="percentage">Percentage Discount (%)</option>
                  <option value="fixed">Fixed Rupee Discount (₹)</option>
                  <option value="perk">Complimentary Perk / Value-Add</option>
                </select>
              </div>

              <div className="offer-form-field">
                <label className="offer-form-label">
                  Discount or Perk Specification
                </label>
                <input
                  type="text"
                  placeholder={
                    discountType === "percentage"
                      ? "e.g. 15% Off"
                      : discountType === "fixed"
                      ? "e.g. ₹500 Off"
                      : discountType === "perk"
                      ? "e.g. Free Traditional Breakfast"
                      : "e.g. 3D/2N Complete Package"
                  }
                  className="offer-form-input"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  disabled={discountType === "none"}
                />
              </div>
            </div>
            <span style={{ fontSize: "0.74rem", color: "var(--color-text-muted)", margin: "0" }}>
              Optional. Do not invent promotional amounts if unconfirmed.
            </span>
          </div>

          {/* Section 4: Validity Dates */}
          <div className="offer-modal-section">
            <h3 className="offer-modal-section-title">
              <Calendar size={16} color="var(--color-peach-deep)" weight="fill" />
              Validity Schedule
            </h3>
            <div className="offer-form-grid-2">
              <div className="offer-form-field">
                <label className="offer-form-label">
                  Valid From Date <span className="offer-form-label-opt">(Optional)</span>
                </label>
                <input
                  type="date"
                  className="offer-form-input"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="offer-form-field">
                <label className="offer-form-label">
                  Valid Until Date <span className="offer-form-label-opt">(Optional)</span>
                </label>
                <input
                  type="date"
                  className="offer-form-input"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Section 5: Terms & Inclusions */}
          <div className="offer-modal-section">
            <h3 className="offer-modal-section-title">
              <Info size={16} color="var(--color-peach-deep)" weight="fill" />
              Offer Terms &amp; Inclusions
            </h3>
            <div className="offer-form-field">
              <textarea
                rows={3}
                placeholder="e.g. Valid on bookings of 2 nights or more. Includes organic homestay breakfast and permit facilitation..."
                className="offer-form-textarea"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          {/* Section 6: Activation & Footnote */}
          <label className={`offer-toggle-card ${active ? "offer-toggle-card--active" : ""}`}>
            <input
              type="checkbox"
              id="admin-offer-active"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              style={{ width: "18px", height: "18px", cursor: "pointer", accentColor: "var(--color-peach-deep)" }}
            />
            <div>
              <strong style={{ fontSize: "0.88rem", color: "var(--color-navy)", display: "block" }}>
                Publish &amp; Activate on website (within configured date range)
              </strong>
              <span style={{ fontSize: "0.76rem", color: "var(--color-text-muted)" }}>
                When active, offer badges and perks appear on targeted cards and detail pages.
              </span>
            </div>
          </label>

          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "8px",
              fontSize: "0.78rem",
              color: "var(--color-text-muted)",
              padding: "0 4px",
            }}
          >
            <Info size={16} style={{ flexShrink: 0, marginTop: "1px" }} />
            <span>
              Base inventory tariffs remain unaltered unless an explicit pricing behavior is configured.
            </span>
          </div>

          {/* Actions */}
          <div className="offer-modal-footer">
            <button type="button" className="admin-btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="admin-btn-primary">
              <Check size={16} weight="bold" /> {isEditing ? "Save Changes" : "Publish Offer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

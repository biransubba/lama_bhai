import React from "react";
import { X } from "phosphor-react";
import Dropdown from "./Dropdown.jsx";
import "./FilterBar.css";

export default function FilterBar({ filters, onClear, hasActiveFilters }) {
  return (
    <div className="filter-bar">
      <div className="filter-bar__fields">
        {filters.map((f) => (
          <div className="filter-bar__field" key={f.label}>
            <Dropdown
              label={f.label}
              options={f.options}
              value={f.value}
              onChange={f.onChange}
              placeholder="All"
              light
            />
          </div>
        ))}
      </div>
      {hasActiveFilters && (
        <button type="button" className="filter-bar__clear" onClick={onClear}>
          <X size={14} weight="bold" /> Clear filters
        </button>
      )}
    </div>
  );
}
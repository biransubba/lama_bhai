import React, { useState, useRef, useEffect } from "react";
import { CaretDown, Plus, ArrowLeft } from "phosphor-react";
import "./Dropdown.css";

function getOptionValue(opt) {
  if (opt && typeof opt === "object") return opt.value !== undefined ? opt.value : "";
  return opt !== undefined && opt !== null ? String(opt) : "";
}

function getOptionLabel(opt) {
  if (opt && typeof opt === "object") return opt.label !== undefined ? opt.label : String(opt.value);
  return opt !== undefined && opt !== null ? String(opt) : "";
}

export default function Dropdown({
  label,
  icon,
  options = [],
  value = "",
  onChange,
  placeholder = "Select",
  light = false,
  allowCustom = false,
  customPlaceholder = "Enter new value...",
  hideEmptyOption = false,
  className = "",
}) {
  const [open, setOpen] = useState(false);
  const [isCustomMode, setIsCustomMode] = useState(() => {
    return Boolean(
      allowCustom &&
        value &&
        !options.some((opt) => getOptionValue(opt) === String(value))
    );
  });
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(optVal) {
    setIsCustomMode(false);
    onChange(optVal);
    setOpen(false);
  }

  function handleEnableCustom() {
    setIsCustomMode(true);
    setOpen(false);
  }

  function handleCancelCustom() {
    setIsCustomMode(false);
    const firstVal = options.length > 0 ? getOptionValue(options[0]) : "";
    onChange(firstVal);
  }

  const selectedOpt = options.find((opt) => getOptionValue(opt) === String(value));
  const displayLabel = selectedOpt ? getOptionLabel(selectedOpt) : (value || placeholder);

  return (
    <div
      className={`dropdown ${light ? "dropdown--light" : ""} ${open ? "dropdown--open" : ""} ${className}`}
      ref={ref}
    >
      {label && (
        <span className="dropdown__label">
          {icon} {label}
        </span>
      )}

      {isCustomMode ? (
        <div className="dropdown__custom-wrap">
          <input
            type="text"
            className="dropdown__custom-input"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={customPlaceholder}
            autoFocus
          />
          <button
            type="button"
            className="dropdown__custom-cancel"
            onClick={handleCancelCustom}
            title="Choose from list"
          >
            <ArrowLeft size={14} weight="bold" /> List
          </button>
        </div>
      ) : (
        <>
          <button
            type="button"
            className="dropdown__trigger"
            onClick={() => setOpen((o) => !o)}
            aria-haspopup="listbox"
            aria-expanded={open}
          >
            <span>{displayLabel}</span>
            <CaretDown
              size={14}
              weight="bold"
              className={`dropdown__caret ${open ? "dropdown__caret--open" : ""}`}
            />
          </button>

          {open && (
            <div className="dropdown__panel" role="listbox">
              {!hideEmptyOption && (
                <button
                  type="button"
                  role="option"
                  aria-selected={value === ""}
                  className={`dropdown__pill ${value === "" ? "dropdown__pill--active" : ""}`}
                  onClick={() => handleSelect("")}
                >
                  {placeholder}
                </button>
              )}
              {options.map((opt, idx) => {
                const optVal = getOptionValue(opt);
                const optLabel = getOptionLabel(opt);
                const isSelected = String(value) === String(optVal);
                return (
                  <button
                    type="button"
                    key={`${optVal}_${idx}`}
                    role="option"
                    aria-selected={isSelected}
                    className={`dropdown__pill ${isSelected ? "dropdown__pill--active" : ""}`}
                    onClick={() => handleSelect(optVal)}
                  >
                    {optLabel}
                  </button>
                );
              })}
              {allowCustom && (
                <button
                  type="button"
                  className="dropdown__pill dropdown__pill--custom"
                  onClick={handleEnableCustom}
                >
                  <Plus size={14} weight="bold" /> Add new location...
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
import React from "react";
import { MagnifyingGlass } from "phosphor-react";
import "./EmptyState.css";

export default function EmptyState({ message = "No results match your filters." }) {
  return (
    <div className="empty-state">
      <MagnifyingGlass size={28} weight="duotone" />
      <p>{message}</p>
    </div>
  );
}
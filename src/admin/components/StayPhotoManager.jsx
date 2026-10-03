import React from "react";
import PhotoManagerModal from "./PhotoManagerModal.jsx";
import { staysRepo } from "../store/repos.js";

export default function StayPhotoManager({ stay, onClose, onSaveSuccess }) {
  return (
    <PhotoManagerModal
      entity={stay}
      entityType="Stay"
      idKey="id"
      repo={staysRepo}
      onClose={onClose}
      onSaveSuccess={onSaveSuccess}
    />
  );
}

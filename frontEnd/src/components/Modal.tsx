import React from "react";
import { X } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children?: React.ReactNode;
};

export function Modal({ open, onClose, title, children }: Props) {
  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 style={{ margin: 0, fontSize: "1.25rem", color: "var(--text)" }}>{title}</h3>
          <button 
            id="modal-close-btn"
            type="button" 
            className="ghost-button" 
            onClick={onClose}
            style={{ padding: 6, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%" }}
          >
            <X size={16} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

export default Modal;

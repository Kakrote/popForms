import { Modal } from "./Modal";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  busy?: boolean;
  tone?: "danger" | "default";
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  busy = false,
  tone = "default",
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onCancel} title={title}>
      <div className="stack">
        <p className="muted">{description}</p>
        <div className="modal-actions">
          <button type="button" className="ghost-button" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </button>
          <button type="button" className={tone === "danger" ? "danger-button" : undefined} onClick={onConfirm} disabled={busy}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default ConfirmDialog;
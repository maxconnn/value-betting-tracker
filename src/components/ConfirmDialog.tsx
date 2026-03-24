interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Удалить',
  cancelLabel = 'Отмена',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[28px] border border-white/60 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.22)]">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-rose-600">
            Confirm action
          </p>
          <h3 className="text-2xl font-bold text-slate-950">{title}</h3>
          <p className="text-sm leading-6 text-slate-600">{description}</p>
        </div>

        <div className="dialog-actions mt-6">
          <button className="dialog-cancel-button" type="button" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            className="dialog-confirm-button"
            type="button"
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

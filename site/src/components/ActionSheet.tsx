'use client';

export interface ActionSheetOption {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  tone?: 'default' | 'accent' | 'destructive';
}

export default function ActionSheet({
  open,
  title,
  options,
  onClose,
}: {
  open: boolean;
  title?: string;
  options: ActionSheetOption[];
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet-container" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-card">
          {title && <div className="sheet-title">{title}</div>}
          {options.map((opt, i) => (
            <button
              key={i}
              className={`sheet-option sheet-option-${opt.tone ?? 'default'}`}
              onClick={() => {
                onClose();
                opt.onClick();
              }}
            >
              {opt.icon}
              {opt.label}
            </button>
          ))}
        </div>
        <button className="sheet-cancel" onClick={onClose}>
          Zrušit
        </button>
      </div>
    </div>
  );
}

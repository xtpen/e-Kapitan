import React, { useId } from 'react';

export interface SwitchProps {
  label: React.ReactNode;
  description?: React.ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  icon?: React.ReactNode;
  disabled?: boolean;
}

/**
 * On/off setting: the whole row is the target (≥ 56px), role="switch" with aria-checked.
 * The thumb slides with the press curve; colors are tokens, so it follows the theme.
 */
export const Switch: React.FC<SwitchProps> = ({ label, description, checked, onChange, icon, disabled }) => {
  const id = useId();
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={`${id}-l`}
      aria-describedby={description ? `${id}-d` : undefined}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="group w-full min-h-14 flex items-center gap-4 py-3 text-left cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
    >
      {icon && (
        <span aria-hidden="true" className="w-10 h-10 shrink-0 rounded-full grid place-items-center bg-navy-tint text-navy-ink [&_svg]:w-5 [&_svg]:h-5 [&_svg]:stroke-[1.9]">
          {icon}
        </span>
      )}
      <span className="flex-1 min-w-0">
        <span id={`${id}-l`} className="block font-semibold text-ink">
          {label}
        </span>
        {description && (
          <span id={`${id}-d`} className="block text-meta text-muted mt-0.5">
            {description}
          </span>
        )}
      </span>
      <span
        aria-hidden="true"
        className={`relative w-12 h-7 shrink-0 rounded-full transition-colors duration-200 ease-out-strong
          group-focus-visible:outline-3 group-focus-visible:outline-navy-ink group-focus-visible:outline-offset-2
          ${checked ? 'bg-navy' : 'bg-field-line/60'}`}
      >
        <span
          className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-surface shadow-[0_1px_3px_rgb(0_0_0/0.25)] transition-transform duration-200 ease-out-strong
            group-active:scale-95 ${checked ? 'translate-x-5' : 'translate-x-0'}`}
        />
      </span>
    </button>
  );
};

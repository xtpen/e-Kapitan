import React, { useId } from 'react';

/*
 * Form fields. See DESIGN.md section 5.6.
 * Always a visible label above the control. Never use a placeholder as the label.
 */

const control =
  'w-full min-h-12 px-3.5 py-3 bg-surface text-ink text-base rounded-control border-[1.5px] transition-colors ' +
  'placeholder:text-muted/80 focus:outline-none focus:border-navy focus:ring-[3px] focus:ring-navy/20 ' +
  'disabled:bg-surface-muted disabled:text-muted';

const controlState = (invalid?: boolean) => (invalid ? 'border-danger-fg' : 'border-field-line');

export interface FieldProps {
  label: React.ReactNode;
  /** Help text under the control, e.g. "JPG, PNG or PDF, up to 5 MB." */
  help?: React.ReactNode;
  /** Error message. Say what to do: "Enter your mobile number." */
  error?: string;
  optional?: boolean;
  className?: string;
  /** Render prop gets the id and aria props to spread on the control. */
  children: (props: { id: string; 'aria-describedby'?: string; 'aria-invalid'?: boolean }) => React.ReactNode;
}

export const Field: React.FC<FieldProps> = ({ label, help, error, optional, className = '', children }) => {
  const id = useId();
  const helpId = help ? `${id}-help` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [errorId, helpId].filter(Boolean).join(' ') || undefined;
  return (
    <div className={className}>
      <label htmlFor={id} className="block font-semibold text-meta text-ink mt-4 mb-1.5">
        {label}
        {optional && <span className="font-normal text-muted"> (optional)</span>}
      </label>
      {children({ id, 'aria-describedby': describedBy, 'aria-invalid': error ? true : undefined })}
      {error && (
        <p id={errorId} className="text-meta text-danger-fg mt-1.5">
          {error}
        </p>
      )}
      {help && (
        <p id={helpId} className="text-meta text-muted mt-1.5">
          {help}
        </p>
      )}
    </div>
  );
};

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className = '', ...rest }, ref) => (
    <input
      ref={ref}
      className={`${control} ${controlState(!!rest['aria-invalid'])} file:mr-3 file:rounded-lg file:border-0 file:bg-navy-tint file:px-3 file:py-1.5 file:font-semibold file:text-navy ${className}`}
      {...rest}
    />
  ),
);
Input.displayName = 'Input';

/** Password field with a Show/Hide toggle (44px target, labelled for screen readers). */
export const PasswordInput = React.forwardRef<HTMLInputElement, Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'>>(
  ({ className = '', ...rest }, ref) => {
    const [visible, setVisible] = React.useState(false);
    return (
      <div className="relative">
        <input
          ref={ref}
          type={visible ? 'text' : 'password'}
          className={`${control} ${controlState(!!rest['aria-invalid'])} pr-20 ${className}`}
          {...rest}
        />
        <button
          type="button"
          onClick={() => setVisible(v => !v)}
          aria-pressed={visible}
          aria-label={visible ? 'Hide password' : 'Show password'}
          className="absolute right-1 top-1/2 -translate-y-1/2 min-h-11 px-3 rounded-lg text-meta font-semibold text-primary-strong hover:bg-surface-muted cursor-pointer"
        >
          {visible ? 'Hide' : 'Show'}
        </button>
      </div>
    );
  },
);
PasswordInput.displayName = 'PasswordInput';

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className = '', children, ...rest }, ref) => (
    <select ref={ref} className={`${control} ${controlState(!!rest['aria-invalid'])} cursor-pointer ${className}`} {...rest}>
      {children}
    </select>
  ),
);
Select.displayName = 'Select';

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className = '', ...rest }, ref) => (
    <textarea
      ref={ref}
      className={`${control} ${controlState(!!rest['aria-invalid'])} min-h-24 sm:min-h-[120px] ${className}`}
      {...rest}
    />
  ),
);
Textarea.displayName = 'Textarea';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: React.ReactNode;
  description?: React.ReactNode;
  error?: string;
}

/** Large checkbox with a clickable label (whole row is a 44px+ target). */
export const Checkbox: React.FC<CheckboxProps> = ({ label, description, error, className = '', id, ...rest }) => {
  const autoId = useId();
  const cid = id ?? autoId;
  return (
    <div className={className}>
      <label htmlFor={cid} className="flex items-start gap-3 cursor-pointer py-2">
        <input
          id={cid}
          type="checkbox"
          className="mt-0.5 w-6 h-6 shrink-0 cursor-pointer accent-primary"
          aria-invalid={error ? true : undefined}
          {...rest}
        />
        <span>
          <span className="font-semibold">{label}</span>
          {description && <span className="block text-meta text-muted mt-0.5">{description}</span>}
        </span>
      </label>
      {error && <p className="text-meta text-danger-fg ml-9">{error}</p>}
    </div>
  );
};

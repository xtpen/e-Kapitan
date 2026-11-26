import React, { useEffect, useId, useState } from 'react';
import { CircleAlert, Eye, EyeOff } from 'lucide-react';
import { useT } from '../../i18n';

/*
 * Form fields. See DESIGN.md section 5.6.
 * Always a visible label above the control. Never use a placeholder as the label.
 */

const control =
  'w-full min-h-12 px-3.5 py-3 bg-surface text-ink text-base rounded-control border-[1.5px] transition-colors ' +
  'placeholder:text-muted/80 focus:outline-none focus:border-navy-ink focus:ring-[3px] focus:ring-navy-ink/20 ' +
  'disabled:bg-surface-muted disabled:text-muted';

const controlState = (invalid?: boolean) => (invalid ? 'border-danger-fg' : 'border-field-line');

export interface FieldProps {
  label: React.ReactNode;
  /** Help text under the control, e.g. "JPG, PNG or PDF, up to 5 MB." */
  help?: React.ReactNode;
  /** Error message. Say what to do: "Enter your mobile number." */
  error?: string;
  optional?: boolean;
  /** Marks the label with a red asterisk and the control with aria-required. */
  required?: boolean;
  className?: string;
  /** Render prop gets the id and aria props to spread on the control. */
  children: (props: { id: string; 'aria-describedby'?: string; 'aria-invalid'?: boolean; 'aria-required'?: boolean }) => React.ReactNode;
}

/**
 * Something that appears under a control (an error): it opens its own row smoothly instead of
 * pushing the form down in one jump, and closes the same way. Keeps the last text while closing.
 */
export const Expand: React.FC<{ show: boolean; children: React.ReactNode; className?: string }> = ({ show, children, className = '' }) => {
  const [content, setContent] = useState(children);
  useEffect(() => {
    if (show) setContent(children);
  }, [show, children]);
  return (
    <div
      aria-hidden={!show}
      inert={!show}
      className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out-strong motion-reduce:transition-none
        ${show ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'} ${className}`}
    >
      <div className="overflow-hidden">{show ? children : content}</div>
    </div>
  );
};

export const Field: React.FC<FieldProps> = ({ label, help, error, optional, required, className = '', children }) => {
  const t = useT();
  const id = useId();
  const helpId = help ? `${id}-help` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [errorId, helpId].filter(Boolean).join(' ') || undefined;
  return (
    <div className={className}>
      <label htmlFor={id} className="block font-semibold text-meta text-ink mt-4 mb-1.5">
        {label}
        {required && (
          <span aria-hidden="true" className="text-danger-fg ml-0.5">
            *
          </span>
        )}
        {optional && <span className="font-normal text-muted"> ({t('optional')})</span>}
      </label>
      {children({
        id,
        'aria-describedby': describedBy,
        'aria-invalid': error ? true : undefined,
        'aria-required': required || undefined,
      })}
      <Expand show={!!error}>
        <p id={errorId} className="flex items-start gap-1.5 text-meta text-danger-fg pt-1.5">
          <CircleAlert className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={2} aria-hidden="true" />
          {error}
        </p>
      </Expand>
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
      className={`${control} ${controlState(!!rest['aria-invalid'])} file:mr-3 file:rounded-lg file:border-0 file:bg-navy-tint file:px-3 file:py-1.5 file:font-semibold file:text-navy-ink ${className}`}
      {...rest}
    />
  ),
);
Input.displayName = 'Input';

/** Password field with an eye toggle (44px target, labelled for screen readers). The icons cross-fade. */
export const PasswordInput = React.forwardRef<HTMLInputElement, Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'>>(
  ({ className = '', ...rest }, ref) => {
    const [visible, setVisible] = React.useState(false);
    return (
      <div className="relative">
        <input
          ref={ref}
          type={visible ? 'text' : 'password'}
          className={`${control} ${controlState(!!rest['aria-invalid'])} pr-13 ${className}`}
          {...rest}
        />
        <button
          type="button"
          onClick={() => setVisible(v => !v)}
          aria-pressed={visible}
          aria-label={visible ? 'Hide password' : 'Show password'}
          className="absolute right-1 top-1/2 -translate-y-1/2 w-11 h-11 grid place-items-center rounded-lg text-muted hover:text-navy-ink hover:bg-navy-tint/60 cursor-pointer
            transition-[color,background-color,scale] duration-150 ease-out-strong active:scale-[0.92]"
        >
          <Eye
            aria-hidden="true"
            className={`col-start-1 row-start-1 w-5 h-5 transition-[opacity,scale] duration-200 ease-out-strong ${visible ? 'opacity-0 scale-75' : 'opacity-100 scale-100'}`}
            strokeWidth={1.8}
          />
          <EyeOff
            aria-hidden="true"
            className={`col-start-1 row-start-1 w-5 h-5 transition-[opacity,scale] duration-200 ease-out-strong ${visible ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}
            strokeWidth={1.8}
          />
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

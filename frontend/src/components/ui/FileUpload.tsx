import React, { useRef, useState } from 'react';
import { FileText, Image as ImageIcon, UploadCloud, X } from 'lucide-react';

export interface FileUploadProps {
  /** From Field's render prop, so the label and help/error text are linked. */
  id?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
  accept?: string;
  multiple?: boolean;
  files: File[];
  onChange: (files: File[]) => void;
  /** Short hint inside the drop zone, e.g. "PDF or Word". Size limits go in Field's help. */
  hint?: string;
}

const formatSize = (bytes: number) =>
  bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

/**
 * Drop zone + "Choose file" button with a list of picked files. See DESIGN.md section 5.6.
 * The real <input type="file"> stays in the DOM (visually hidden) so keyboard and screen readers work.
 */
export const FileUpload: React.FC<FileUploadProps> = ({
  id,
  accept,
  multiple,
  files,
  onChange,
  hint,
  ...aria
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const invalid = !!aria['aria-invalid'];

  const take = (list: FileList | null) => {
    const picked = Array.from(list ?? []);
    if (picked.length === 0) return;
    onChange(multiple ? [...files, ...picked] : picked.slice(0, 1));
  };

  const remove = (index: number) => {
    const next = files.filter((_, i) => i !== index);
    onChange(next);
    if (inputRef.current) inputRef.current.value = '';
    inputRef.current?.focus();
  };

  const showZone = multiple || files.length === 0;

  return (
    <div className="@container">
      {/* Visually hidden but focusable: the label below opens it, keyboard users tab to it. */}
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        multiple={multiple}
        className="peer sr-only"
        onChange={e => {
          take(e.target.files);
          e.target.value = '';
        }}
        {...aria}
      />

      {showZone && (
        <label
          htmlFor={id}
          onDragOver={e => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => {
            e.preventDefault();
            setDragging(false);
            take(e.dataTransfer.files);
          }}
          className={`group flex flex-col @md:flex-row items-center gap-3 @md:gap-4 rounded-control border-[1.5px] border-dashed px-4 py-5 @md:py-4 text-center @md:text-left cursor-pointer transition-colors
            peer-focus-visible:outline-3 peer-focus-visible:outline-navy peer-focus-visible:outline-offset-2
            ${dragging ? 'border-navy bg-navy-tint' : invalid ? 'border-danger-fg bg-surface' : 'border-field-line bg-surface hover:border-navy hover:bg-navy-tint/60'}`}
        >
          <span
            aria-hidden="true"
            className="w-12 h-12 rounded-tile grid place-items-center shrink-0 bg-primary-tint text-primary-strong transition-transform group-hover:-translate-y-0.5"
          >
            <UploadCloud className="w-6 h-6" strokeWidth={1.8} />
          </span>
          <span className="flex-1 min-w-0">
            <span className="block font-semibold text-ink">
              {dragging ? 'Drop it here' : multiple && files.length > 0 ? 'Add another file' : 'Drag a file here'}
            </span>
            <span className="block text-meta text-muted">{hint ?? 'or choose one from your device'}</span>
          </span>
          <span
            aria-hidden="true"
            className="inline-flex items-center justify-center min-h-11 px-[18px] rounded-control border-2 border-navy bg-surface text-navy font-semibold text-meta whitespace-nowrap transition-colors group-hover:bg-navy group-hover:text-white"
          >
            Choose file
          </span>
        </label>
      )}

      {files.length > 0 && (
        <ul className={`grid gap-2 ${showZone ? 'mt-2.5' : ''}`} aria-label="Selected files">
          {files.map((f, i) => {
            const isImage = f.type.startsWith('image/');
            const Icon = isImage ? ImageIcon : FileText;
            return (
              <li
                key={`${f.name}-${i}`}
                className="flex items-center gap-3 rounded-control border-[1.5px] border-primary-tint-line bg-primary-tint/50 pl-3 pr-1.5 py-1.5"
              >
                <span aria-hidden="true" className="w-9 h-9 rounded-lg grid place-items-center bg-surface text-primary-strong shrink-0">
                  <Icon className="w-5 h-5" strokeWidth={1.8} />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block font-semibold text-ink truncate">{f.name}</span>
                  <span className="block text-caption text-muted">{formatSize(f.size)}</span>
                </span>
                {!multiple && (
                  <label
                    htmlFor={id}
                    className="text-meta font-semibold text-primary-strong hover:underline underline-offset-4 cursor-pointer px-2 min-h-11 inline-flex items-center"
                  >
                    Change
                  </label>
                )}
                <button
                  type="button"
                  onClick={() => remove(i)}
                  aria-label={`Remove ${f.name}`}
                  className="w-11 h-11 grid place-items-center rounded-control text-muted hover:text-danger-fg hover:bg-danger-bg cursor-pointer"
                >
                  <X className="w-5 h-5" aria-hidden="true" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

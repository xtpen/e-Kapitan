import React from 'react';
import { useT } from '../../i18n';
import { LEGAL_DOCS, type LegalDocId } from './legalDocs';

/** The body of a legal document: "Last updated", then numbered headings with paragraphs and lists. */
export const LegalBody: React.FC<{ id: LegalDocId }> = ({ id }) => {
  const doc = LEGAL_DOCS[id];
  const t = useT();
  return (
    <div className="text-ink leading-relaxed">
      <p className="text-meta text-muted">{t('Last updated {date}', { date: doc.updated })}</p>
      <ol className="mt-4 grid gap-6">
        {doc.sections.map((s, i) => (
          <li key={s.heading}>
            <h2 className="text-[1.0625rem] font-semibold text-ink leading-tight">
              <span className="text-muted tabular-nums mr-1.5">{i + 1}.</span>
              {s.heading}
            </h2>
            <div className="mt-2 grid gap-2">
              {s.body.map((b, j) =>
                typeof b === 'string' ? (
                  <p key={j}>{b}</p>
                ) : (
                  <ul key={j} className="grid gap-1.5 pl-5 list-disc marker:text-muted">
                    {b.list.map(item => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ),
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
};

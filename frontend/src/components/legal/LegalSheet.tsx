import React from 'react';
import { useT } from '../../i18n';
import { Sheet } from '../resident/kit';
import { LegalBody } from './LegalDocument';
import { LEGAL_DOCS, type LegalDocId } from './legalDocs';

/**
 * A legal document over the current screen (landing page footer, sign-up form), so reading it
 * never loses what the person was doing. Bottom sheet on phones, dialog on wider screens.
 */
export const LegalSheet: React.FC<{ id: LegalDocId | null; onClose: () => void }> = ({ id, onClose }) => {
  const t = useT();
  const shown = React.useRef<LegalDocId>('privacy_policy');
  if (id) shown.current = id; // keep the text while the sheet slides away
  return (
    <Sheet open={!!id} onClose={onClose} title={t(LEGAL_DOCS[shown.current].title)}>
      <LegalBody id={shown.current} />
    </Sheet>
  );
};

import React, { useEffect, useRef, useState } from 'react';
import { MessageSquareText, Send } from 'lucide-react';
import { useBarangay } from '../../context/BarangayContext';
import { Button, Card, PageHeader } from '../ui';
import { BARANGAY } from '../../config/barangay';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  time: string;
  source?: 'gemini-ai' | 'knowledge-base';
}


const WELCOME =
  `Mabuhay! Ako si **Ka-Barangay AI**, ang inyong gabay sa mga serbisyo ng Barangay ${BARANGAY}, San Pablo City.\n\n` +
  'Magtanong tungkol sa mga dokumento (Clearance, Residency, Indigency), requirements, bayarin, o oras ng barangay hall. You can also ask in English.';

/** Used when the assistant service can't be reached. Only facts already stated elsewhere in the app. */
const OFFLINE_REPLY =
  `**Gabay sa serbisyo ng Barangay ${BARANGAY}:**\n\n` +
  '• **Barangay Clearance:** ₱50.00. Libre para sa first-time jobseekers (RA 11261). Dalhin ang valid ID.\n' +
  '• **Certificate of Residency:** Dalhin ang patunay ng tirahan sa barangay.\n' +
  '• **Certificate of Indigency:** Libre. Para sa medical o financial aid.\n' +
  '• **Kunin ang dokumento:** Lunes hanggang Biyernes, 1:00 PM hanggang 4:00 PM sa Barangay Hall.\n' +
  '• **Opisina:** Lunes hanggang Biyernes, 8:00 AM hanggang 5:00 PM.';

const SUGGESTED = [
  'What do I need for a barangay clearance?',
  'How can I request a certificate of residency?',
  'Is the certificate of indigency free?',
  'How do I report a noise complaint?',
  'What are the barangay office hours?',
];

const now = () => new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

/** Renders **bold** and line breaks from the assistant's plain-text replies. No HTML is injected. */
const RichText: React.FC<{ text: string }> = ({ text }) => (
  <>
    {text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
      part.startsWith('**') && part.endsWith('**') ? (
        <b key={i} className="font-semibold">
          {part.slice(2, -2)}
        </b>
      ) : (
        <React.Fragment key={i}>{part}</React.Fragment>
      ),
    )}
  </>
);

/**
 * Ka-Barangay AI ("Ask Kap" on the public site). No mockup; built from DESIGN.md patterns.
 * Answers come from /api/ai-assistant, with a fixed offline reply if it can't be reached.
 */
export const KaBarangayAI: React.FC = () => {
  const { setActiveTab, currentRole } = useBarangay();
  const isGuest = currentRole === 'guest';

  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'msg-1', sender: 'assistant', text: WELCOME, time: now(), source: 'knowledge-base' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep the newest message in view (scrolls the message list only, not the page).
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const send = async (text?: string) => {
    const query = (text ?? input).trim();
    if (!query || loading) return;

    setMessages(prev => [...prev, { id: `user-${Date.now()}`, sender: 'user', text: query, time: now() }]);
    setInput('');
    setLoading(true);

    let reply: ChatMessage;
    try {
      const res = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query, chatHistory: messages.map(m => ({ role: m.sender, content: m.text })) }),
      });
      if (!res.ok) throw new Error(`AI assistant returned ${res.status}`);
      const data = await res.json();
      reply = { id: `bot-${Date.now()}`, sender: 'assistant', text: data.reply, time: now(), source: data.source };
    } catch (err) {
      console.warn('AI assistant unreachable, using the offline answer.', err);
      reply = { id: `bot-${Date.now()}`, sender: 'assistant', text: OFFLINE_REPLY, time: now(), source: 'knowledge-base' };
    }
    setMessages(prev => [...prev, reply]);
    setLoading(false);
    inputRef.current?.focus();
  };

  const shortcuts = isGuest
    ? [
        { label: 'Report a concern', tab: 'file_report' },
        { label: 'Track your request', tab: 'report_status' },
      ]
    : [
        { label: 'Request a document', tab: 'services' },
        { label: 'File a report', tab: 'complaints' },
      ];

  const suggestions = (
    <ul className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible -mx-1 px-1 pb-1 lg:pb-0">
      {SUGGESTED.map(q => (
        <li key={q} className="shrink-0 lg:shrink">
          <button
            type="button"
            onClick={() => send(q)}
            disabled={loading}
            className="w-full text-left min-h-11 px-4 py-2 rounded-control border-[1.5px] border-line bg-surface text-meta font-semibold text-navy hover:bg-navy-tint whitespace-nowrap lg:whitespace-normal cursor-pointer disabled:cursor-not-allowed disabled:text-muted"
          >
            {q}
          </button>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="max-w-[1200px]">
      <PageHeader
        title={isGuest ? 'Ask Kap' : 'Ka-Barangay AI'}
        description="Quick answers on requirements, fees and office hours. English, Tagalog or Taglish."
      />

      <div className="grid lg:grid-cols-[1.6fr_1fr] gap-5 items-start">
        {/* Chat */}
        <section
          aria-label="Chat with Kap"
          className="bg-surface border border-line rounded-card flex flex-col h-[calc(100dvh-260px)] min-h-[440px] lg:h-[620px] overflow-hidden"
        >
          <div ref={listRef} className="flex-1 overflow-y-auto p-4 sm:p-6 grid content-start gap-4" aria-live="polite" aria-label="Conversation">
            {messages.map(m => {
              const mine = m.sender === 'user';
              return (
                <div key={m.id} className={`flex items-start gap-2.5 ${mine ? 'justify-end' : ''}`}>
                  {!mine && (
                    <div aria-hidden="true" className="w-9 h-9 shrink-0 rounded-full grid place-items-center bg-primary-tint text-primary-strong">
                      <MessageSquareText className="w-5 h-5" strokeWidth={1.8} />
                    </div>
                  )}
                  <div className={`max-w-[85%] sm:max-w-[75%] ${mine ? 'text-right' : ''}`}>
                    <span className="sr-only">{mine ? 'You said:' : 'Kap said:'}</span>
                    <div
                      className={`inline-block text-left px-4 py-3 rounded-tile whitespace-pre-line
                        ${mine ? 'bg-navy text-white rounded-tr-sm' : 'bg-surface border border-line rounded-tl-sm'}`}
                    >
                      <RichText text={m.text} />
                    </div>
                    <p className="text-label text-muted mt-1 px-1">
                      {m.time}
                      {!mine && m.source === 'gemini-ai' && ' · AI answer, check with the hall'}
                    </p>
                  </div>
                </div>
              );
            })}
            {loading && (
              <p role="status" className="flex items-center gap-2.5 text-meta text-muted">
                <span aria-hidden="true" className="w-9 h-9 rounded-full grid place-items-center bg-primary-tint text-primary-strong">
                  <MessageSquareText className="w-5 h-5 animate-pulse" strokeWidth={1.8} />
                </span>
                Kap is looking that up…
              </p>
            )}
          </div>

          {/* Suggestions sit above the input on phones and tablets */}
          <div className="lg:hidden border-t border-line-soft px-4 pt-3">{suggestions}</div>

          <form
            className="border-t border-line p-3 sm:p-4 flex gap-2.5"
            onSubmit={e => {
              e.preventDefault();
              send();
            }}
          >
            <label htmlFor="kap-input" className="sr-only">
              Your question
            </label>
            <input
              id="kap-input"
              ref={inputRef}
              autoComplete="off"
              placeholder="Example: Magkano ang barangay clearance?"
              value={input}
              onChange={e => setInput(e.target.value)}
              className="flex-1 min-w-0 min-h-12 px-3.5 py-3 bg-surface text-ink text-base rounded-control border-[1.5px] border-field-line placeholder:text-muted/80 focus:outline-none focus:border-navy focus:ring-[3px] focus:ring-navy/20"
            />
            <Button type="submit" disabled={!input.trim() || loading} icon={<Send className="w-5 h-5" aria-hidden="true" />}>
              <span className="hidden sm:inline">Send</span>
              <span className="sr-only sm:hidden">Send</span>
            </Button>
          </form>
        </section>

        {/* Aside */}
        <div className="grid gap-3 sm:gap-5">
          <Card className="hidden lg:block">
            <h2 className="text-h3 font-semibold text-navy mb-3">Try asking</h2>
            {suggestions}
          </Card>
          <Card tone="callout">
            <h2 className="text-h3 font-semibold text-navy">Information only</h2>
            <p className="text-meta text-ink mt-1">
              Kap gives general guidance. It cannot issue documents or make decisions. For anything official, visit the barangay hall,
              Monday to Friday, 8:00 AM to 5:00 PM.
            </p>
          </Card>
          <Card>
            <h2 className="text-h3 font-semibold text-navy mb-3">Ready to go ahead?</h2>
            <div className="grid gap-2.5">
              {shortcuts.map(s => (
                <Button key={s.tab} variant="secondary" fullWidth onClick={() => setActiveTab(s.tab)}>
                  {s.label}
                </Button>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

import React, { useEffect, useRef, useState } from 'react';
import { MessageCircle, Send } from 'lucide-react';
import { IconCircle, Page, PageTitle, Section } from '../resident/kit';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  time: string;
  source?: 'gemini-ai' | 'knowledge-base';
}

const WELCOME = "Hi! I'm **Kap**. Ask me about papers, fees or office hours. English or Tagalog is fine.";

/** Used when the assistant service can't be reached. Only facts already stated elsewhere in the app. */
const OFFLINE_REPLY =
  "**I can't connect right now. Here are the basics:**\n\n" +
  '• **Barangay Clearance:** ₱50.00. Free for first-time job seekers. Bring a valid ID.\n' +
  '• **Certificate of Residency:** Bring proof that you live in the barangay.\n' +
  '• **Certificate of Indigency:** Free. For medical or money help.\n' +
  '• **Pick up documents:** Weekdays, 1:00 PM to 4:00 PM at the barangay hall.\n' +
  '• **Hall hours:** Weekdays, 8:00 AM to 5:00 PM.';

const SUGGESTED = ['What do I bring for a clearance?', 'Is the indigency certificate free?', 'When is the hall open?', 'How do I report noise?'];

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

const KapIcon: React.FC<{ pulse?: boolean }> = ({ pulse }) => (
  <IconCircle tone="blue" size="sm" className={pulse ? 'animate-pulse' : ''}>
    <MessageCircle />
  </IconCircle>
);

/**
 * Ask Kap: a simple chat for guests and residents.
 * Answers come from /api/ai-assistant, with a fixed offline reply if it can't be reached.
 */
export const KaBarangayAI: React.FC = () => {
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

  const showSuggestions = messages.length === 1 && !loading;

  return (
    <Page>
      <PageTitle title="Ask Kap" sub="Quick answers about papers, fees and hours." />

      <Section
        flush
        className="flex flex-col h-[calc(100dvh-270px-env(safe-area-inset-bottom))] lg:h-[calc(100dvh-240px)] min-h-[400px] lg:max-h-[820px]"
      >
        {/* Messages */}
        <div ref={listRef} className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 grid content-start gap-3" aria-live="polite" aria-label="Conversation">
          {messages.map(m => {
            const mine = m.sender === 'user';
            return (
              <div key={m.id} className={`flex items-end gap-2 ${mine ? 'justify-end' : ''}`}>
                {!mine && <KapIcon />}
                <div className={`max-w-[85%] sm:max-w-[75%] ${mine ? 'text-right' : ''}`}>
                  <span className="sr-only">{mine ? 'You said:' : 'Kap said:'}</span>
                  <div
                    className={`inline-block text-left px-4 py-2.5 rounded-2xl whitespace-pre-line
                      ${mine ? 'bg-navy text-white rounded-br-md' : 'bg-surface-muted text-ink rounded-bl-md'}`}
                  >
                    <RichText text={m.text} />
                  </div>
                  <p className="text-caption text-muted mt-1 px-1">
                    {m.time}
                    {!mine && m.source === 'gemini-ai' && ' · Check with the hall to be sure.'}
                  </p>
                </div>
              </div>
            );
          })}

          {showSuggestions && (
            <ul aria-label="Suggested questions" className="flex flex-wrap gap-2 pl-10">
              {SUGGESTED.map(q => (
                <li key={q}>
                  <button
                    type="button"
                    onClick={() => send(q)}
                    className="min-h-11 px-4 py-2 rounded-full border-[1.5px] border-line bg-surface text-meta font-semibold text-navy-ink text-left cursor-pointer transition-colors hover:border-navy-ink"
                  >
                    {q}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {loading && (
            <div role="status" className="flex items-end gap-2">
              <KapIcon pulse />
              <span className="px-4 py-2.5 rounded-2xl rounded-bl-md bg-surface-muted text-muted">Kap is typing…</span>
            </div>
          )}
        </div>

        {/* Input, pinned to the bottom of the card */}
        <form
          className="flex items-center gap-2 px-3 sm:px-4 py-3 border-t border-line-soft"
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
            placeholder="Type your question"
            value={input}
            onChange={e => setInput(e.target.value)}
            className="flex-1 min-w-0 min-h-12 px-4 py-3 bg-surface-muted text-ink text-base rounded-full border-[1.5px] border-transparent placeholder:text-muted focus:outline-none focus:border-navy-ink focus:ring-[3px] focus:ring-navy-ink/20"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            aria-label="Send"
            className="w-12 h-12 shrink-0 rounded-full grid place-items-center bg-navy text-white cursor-pointer transition-[background-color,scale] duration-150 active:scale-95
              disabled:bg-surface-muted disabled:text-muted disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" aria-hidden="true" />
          </button>
        </form>
      </Section>
    </Page>
  );
};

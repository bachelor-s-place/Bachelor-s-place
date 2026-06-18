'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useAuth } from '@/context/AuthContext';

interface Inquiry {
  id: string;
  property_id: string;
  property_title?: string;
  tenant_name?: string;
  landlord_name?: string;
}
interface Msg {
  id: string;
  sender_id: string;
  sender_name?: string;
  body: string;
  created_at: string;
}

export default function InquiryThreadPage() {
  useAuthGuard();
  const { id } = useParams();
  const { user } = useAuth();

  const [inquiry, setInquiry] = useState<Inquiry | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await apiFetch(`/inquiries/${id}`);
      setInquiry(res.data?.inquiry ?? null);
      setMessages(res.data?.messages ?? []);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : (err as { message?: string })?.message;
      setError(errMsg || 'Failed to load inquiry');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { Promise.resolve().then(() => load()); }, [load]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = body.trim();
    if (!text) return;
    setSending(true);
    try {
      const res = await apiFetch(`/inquiries/${id}/messages`, {
        method: 'POST',
        body: JSON.stringify({ message: text }),
      });
      setMessages(prev => [...prev, res.data.message]);
      setBody('');
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : (err as { message?: string })?.message;
      setError(errMsg || 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  const container: React.CSSProperties = {
    flex: 1,
    width: '100%',
    maxWidth: '720px',
    margin: '0 auto',
    padding: '2.5rem 1.5rem',
    display: 'flex',
    flexDirection: 'column',
  };
  const centerState: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  if (loading) return <main style={container}><div style={centerState}><p style={{ color: 'rgba(255,255,255,0.6)' }}>Loading…</p></div></main>;
  if (error || !inquiry) return <main style={container}><div style={centerState}><p style={{ color: '#ff5f56' }}>{error || 'Inquiry not found'}</p></div></main>;

  return (
    <main style={container}>
      <Link href="/inquiries" style={{ color: 'rgba(255,255,255,0.55)', textDecoration: 'none', fontSize: '0.85rem' }}>← All inquiries</Link>

      <div style={{ margin: '1rem 0 0.25rem', color: '#fff', fontSize: '1.2rem', fontWeight: 700 }}>
        {inquiry.property_title || 'Property'}
      </div>
      <Link href={`/properties/${inquiry.property_id}`} style={{ color: '#6c63ff', fontSize: '0.85rem', textDecoration: 'none' }}>
        View listing →
      </Link>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.78rem', marginTop: '0.5rem' }}>
        Contact details are shared only after a squad locks this property.
      </p>

      <div style={{
        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px',
        padding: '1rem', margin: '1rem 0', minHeight: '240px', maxHeight: '55vh', overflowY: 'auto',
      }}>
        {messages.length === 0 && <p style={{ color: 'rgba(255,255,255,0.4)' }}>No messages yet.</p>}
        {messages.map(m => {
          const mine = m.sender_id === user?.id;
          return (
            <div key={m.id} style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start', marginBottom: '0.6rem' }}>
              <div style={{
                maxWidth: '78%', padding: '0.55rem 0.85rem', borderRadius: '12px',
                background: mine ? '#6c63ff' : 'rgba(255,255,255,0.08)', color: '#fff', fontSize: '0.9rem',
              }}>
                {!mine && <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.55)', marginBottom: '2px' }}>{m.sender_name}</div>}
                {m.body}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={send} style={{ display: 'flex', gap: '0.5rem' }}>
        <input
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="Type a message…"
          style={{
            flex: 1, padding: '0.7rem 0.9rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.15)',
            background: 'rgba(255,255,255,0.06)', color: '#fff', colorScheme: 'dark',
          }}
        />
        <button type="submit" disabled={sending || !body.trim()} style={{
          padding: '0.7rem 1.2rem', borderRadius: '10px', border: 'none', background: '#6c63ff', color: '#fff',
          fontWeight: 600, cursor: 'pointer', opacity: sending || !body.trim() ? 0.6 : 1,
        }}>
          {sending ? '…' : 'Send'}
        </button>
      </form>
    </main>
  );
}

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useAuth } from '@/context/AuthContext';

interface Inquiry {
  id: string;
  property_id: string;
  property_title?: string;
  tenant_id: string;
  tenant_name?: string;
  landlord_id: string;
  landlord_name?: string;
  last_message?: string;
  last_message_at: string;
}

export default function InquiriesPage() {
  useAuthGuard();
  const { user } = useAuth();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch('/inquiries')
      .then(res => setInquiries(res.data?.inquiries ?? []))
      .catch(err => setError(err.message || 'Failed to load inquiries'))
      .finally(() => setLoading(false));
  }, []);

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

  return (
    <main style={container}>
      <h1 style={{ color: '#fff', fontSize: '1.6rem', fontWeight: 700, marginBottom: '0.25rem' }}>Inquiries</h1>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
        Questions about listings. Contact details are shared only after a squad locks a property.
      </p>

      {loading && <div style={centerState}><p style={{ color: 'rgba(255,255,255,0.6)' }}>Loading…</p></div>}
      {error && <div style={centerState}><p style={{ color: '#ff5f56' }}>{error}</p></div>}
      {!loading && !error && inquiries.length === 0 && (
        <div style={centerState}><p style={{ color: 'rgba(255,255,255,0.5)' }}>No inquiries yet.</p></div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {inquiries.map(q => {
          const iAmLandlord = q.landlord_id === user?.id;
          const other = iAmLandlord ? q.tenant_name : q.landlord_name;
          return (
            <Link key={q.id} href={`/inquiries/${q.id}`} style={{ textDecoration: 'none' }}>
              <div style={{
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px', padding: '0.9rem 1.1rem',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
                  <span style={{ color: '#fff', fontWeight: 600 }}>{q.property_title || 'Property'}</span>
                  <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>
                    {iAmLandlord ? 'from ' : 'with '}{other || 'user'}
                  </span>
                </div>
                {q.last_message && (
                  <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.85rem', marginTop: '0.3rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {q.last_message}
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </main>
  );
}

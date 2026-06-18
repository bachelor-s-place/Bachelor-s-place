'use client';

import { useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import styles from '@/app/login/page.module.css';

export default function LandlordOnboarding() {
  useAuthGuard();
  const { user, refreshUser } = useAuth();

  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const hasContact = !!user?.has_contact;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (phone.trim().length < 8) {
      setError('Please enter a valid phone number.');
      return;
    }
    setSaving(true);
    try {
      await apiFetch('/users/me/contact', {
        method: 'PUT',
        body: JSON.stringify({
          phone: phone.trim(),
          whatsapp: whatsapp.trim() ? whatsapp.trim() : undefined,
        }),
      });
      await refreshUser();
      setSaved(true);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : (err as { message?: string })?.message;
      setError(errMsg || 'Failed to save contact details.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 4rem)', padding: '1.5rem' }}>
      <div className={styles.loginCard} style={{ maxWidth: '460px', width: '100%' }}>
        <h1 className={styles.title}>Welcome, {user?.name}!</h1>
        <p className={styles.subtitle} style={{ marginBottom: '1.75rem' }}>
          Two quick steps before you can list: add a contact number and verify your identity.
        </p>

        {/* Step 1 — Contact details */}
        <div style={{ marginBottom: '1.75rem' }}>
          <h2 style={{ color: '#fff', fontSize: '1rem', marginBottom: '0.75rem' }}>
            1. Contact details {(hasContact || saved) && <span style={{ color: '#27c93f' }}>✓</span>}
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', marginBottom: '1rem' }}>
            Shared with a squad only after they pay the token to lock your property. Never shown publicly.
          </p>

          <form onSubmit={handleSave}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Phone number</label>
              <input
                className={styles.input}
                type="tel"
                placeholder="e.g. 9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>WhatsApp number <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}>(optional)</span></label>
              <input
                className={styles.input}
                type="tel"
                placeholder="If different from your phone"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
              />
            </div>

            {error && <div style={{ color: '#ff5f56', fontSize: '0.82rem', marginBottom: '0.75rem' }}>{error}</div>}

            <button className={styles.submitBtn} type="submit" disabled={saving}>
              {saving ? 'Saving…' : saved || hasContact ? 'Update contact' : 'Save contact'}
            </button>
            {(saved || hasContact) && (
              <p style={{ color: '#27c93f', fontSize: '0.8rem', textAlign: 'center', marginTop: '0.6rem' }}>
                Contact saved. You can list properties now.
              </p>
            )}
          </form>
        </div>

        {/* Step 2 — KYC */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1.5rem' }}>
          <h2 style={{ color: '#fff', fontSize: '1rem', marginBottom: '0.75rem' }}>2. Verify identity (KYC)</h2>
          <Link href="/landlord/kyc" className={styles.submitBtn} style={{ display: 'inline-block', textDecoration: 'none', width: '100%', textAlign: 'center' }}>
            Complete KYC Now
          </Link>
          <Link
            href="/landlord/properties"
            style={{ display: 'block', marginTop: '1rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.45)', textDecoration: 'none', textAlign: 'center' }}
          >
            Skip for now →
          </Link>
        </div>
      </div>
    </div>
  );
}

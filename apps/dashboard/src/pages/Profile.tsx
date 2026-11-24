import { useRef, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Camera, Mail, User as UserIcon, Building2, Globe, Clock, Lock } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';
import type { Me } from '../lib/types';

const TIMEZONES = [
  'UTC', 'America/Los_Angeles', 'America/Denver', 'America/Chicago', 'America/New_York',
  'Europe/London', 'Europe/Berlin', 'Asia/Kolkata', 'Asia/Singapore', 'Asia/Tokyo', 'Australia/Sydney',
].map((tz) => ({ value: tz, label: tz.replace('_', ' ') }));

function initials(name: string, email: string) {
  const source = name?.trim() || email;
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

export default function Profile() {
  const { me } = useOutletContext<{ me: Me }>();
  const { show } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [name, setName] = useState(me.name ?? '');
  const [company, setCompany] = useState('');
  const [website, setWebsite] = useState('');
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
  const [saving, setSaving] = useState(false);

  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwSaving, setPwSaving] = useState(false);

  function onAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await new Promise((r) => setTimeout(r, 400));
    setSaving(false);
    show('Profile updated.');
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwError('');
    if (newPw.length < 8) return setPwError('New password must be at least 8 characters.');
    if (newPw !== confirmPw) return setPwError('Passwords do not match.');
    setPwSaving(true);
    await new Promise((r) => setTimeout(r, 400));
    setPwSaving(false);
    setCurrentPw(''); setNewPw(''); setConfirmPw('');
    show('Password updated.');
  }

  return (
    <>
      <div className="mb-10">
        <h1 className="text-[32px] font-bold tracking-[-0.02em] text-text">Profile</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-muted">Manage your personal information and account security.</p>
      </div>

      <form onSubmit={saveProfile} className="mb-12 flex flex-col gap-6 rounded-lg border border-line bg-surface p-5 shadow-card sm:p-7">
        <div className="flex items-center gap-4">
          <div className="relative">
            {avatarPreview ? (
              <img src={avatarPreview} alt="" className="h-16 w-16 rounded-full object-cover" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[image:var(--accent-grad)] text-[20px] font-bold text-white">
                {initials(name, me.email)}
              </div>
            )}
            <button
              type="button"
              aria-label="Upload avatar"
              onClick={() => fileRef.current?.click()}
              className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-surface bg-surface-2 text-muted outline-none transition-colors hover:text-text focus-visible:ring-2 focus-visible:ring-accent/50"
            >
              <Camera size={13} />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onAvatarChange} />
          </div>
          <div>
            <p className="text-[14.5px] font-semibold text-text">{name || 'Your name'}</p>
            <p className="text-[13px] text-muted">{me.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Full name" icon={<UserIcon size={16} />} value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Email" icon={<Mail size={16} />} value={me.email} readOnly disabled hint="Contact support to change your email address." />
          <Input label="Company name" icon={<Building2 size={16} />} value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Acme Inc." />
          <Input label="Website" icon={<Globe size={16} />} type="url" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://example.com" />
          <Select
            label="Timezone"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            options={TIMEZONES}
            className="sm:col-span-1"
          />
        </div>

        <div>
          <Button type="submit" loading={saving}>Save changes</Button>
        </div>
      </form>

      <form onSubmit={savePassword} className="flex flex-col gap-4 rounded-lg border border-line bg-surface p-5 shadow-card sm:p-7">
        <div className="flex items-center gap-2">
          <Lock size={16} className="text-accent" />
          <h2 className="text-[16px] font-semibold text-text">Change password</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Input label="Current password" type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} autoComplete="current-password" required />
          <Input label="New password" type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} autoComplete="new-password" minLength={8} required />
          <Input label="Confirm new password" type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} autoComplete="new-password" minLength={8} required />
        </div>
        {pwError && <p className="text-[13px] text-err">{pwError}</p>}
        <div>
          <Button type="submit" variant="secondary" loading={pwSaving}>Update password</Button>
        </div>
      </form>
    </>
  );
}

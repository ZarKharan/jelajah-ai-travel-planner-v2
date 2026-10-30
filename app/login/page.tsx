'use client';
import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Compass, Eye, EyeOff, LockKeyhole, UserRound } from 'lucide-react';
import { createClient } from '../../lib/supabase/client';

export default function LoginPage() {
  const router = useRouter(); const params = useSearchParams();
  const [username, setUsername] = useState(''); const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  async function submit(e: FormEvent) {
    e.preventDefault(); setBusy(true); setError('');
    try {
      const supabase = createClient();
      const email = username.trim().toLowerCase().includes('@') ? username.trim().toLowerCase() : `${username.trim().toLowerCase().replace(/[^a-z0-9._-]/g, '')}@jelajah.local`;
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      router.replace('/dashboard'); router.refresh();
    } catch (err) { setError(err instanceof Error ? err.message : 'Login gagal. Periksa username dan password.'); }
    finally { setBusy(false); }
  }
  return <main className="auth-shell"><section className="auth-visual"><Link href="/" className="auth-brand"><span><Compass/></span> jelajah<span className="brand-dot">.</span></Link><div className="auth-visual-copy"><span className="eyebrow">YOUR NEXT STORY STARTS HERE</span><h1>Perjalanan hebat dimulai dari <em>satu langkah.</em></h1><p>Temukan tempat baru, susun perjalanan yang personal, dan kumpulkan cerita di setiap destinasi.</p></div><div className="auth-visual-foot">Explore more. Worry less.</div></section><section className="auth-form-side"><form className="auth-card" onSubmit={submit}><div className="auth-icon"><Compass/></div><span className="section-kicker">WELCOME BACK</span><h2>Masuk ke Jelajah</h2><p className="auth-muted">Lanjutkan petualangan yang sudah kamu rencanakan.</p>{params.get('setup') && <div className="auth-alert">Hubungkan Supabase terlebih dahulu melalui environment variables.</div>}<label className="auth-field"><span>Username atau email</span><div><UserRound/><input required value={username} onChange={e=>setUsername(e.target.value)} placeholder="username kamu" autoComplete="username"/></div></label><label className="auth-field"><span>Password</span><div><LockKeyhole/><input required minLength={8} type={showPassword?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Minimal 8 karakter" autoComplete="current-password"/><button type="button" onClick={()=>setShowPassword(!showPassword)} aria-label="Tampilkan password">{showPassword?<EyeOff/>:<Eye/>}</button></div></label>{error && <div className="auth-error">{error}</div>}<button className="auth-submit" disabled={busy}>{busy?'Memeriksa akun...':'Masuk'} <span>→</span></button><p className="auth-switch">Belum punya akun? <Link href="/register">Buat akun baru</Link></p><p className="auth-legal">Dengan masuk, kamu menyetujui penggunaan layanan Jelajah.</p></form></section></main>;
}

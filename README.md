# Jelajah v0.6 — Smart Travel Experience

Next.js 14 + TypeScript + Tailwind CSS + Leaflet + Google Gemini API + Supabase Auth/Postgres.

## 1. Prasyarat
- Node.js 20 LTS (disarankan)
- Project Supabase
- Google Gemini API key

## 2. Instalasi
```bash
npm install
cp .env.example .env.local
npm run dev
```

Jika lockfile perlu disegarkan setelah menambah Supabase SDK, jalankan `npm install @supabase/ssr @supabase/supabase-js` (bukan `npm ci` pada lockfile lama).
Windows PowerShell: `Copy-Item .env.example .env.local`.

Isi `.env.local`:
```dotenv
GEMINI_API_KEY=your_new_gemini_api_key
GEMINI_MODEL=your_available_gemini_model
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```
Jangan commit `.env.local`, service-role key, atau API key.

## 3. Setup database dan autentikasi
1. Buat project di https://supabase.com/dashboard.
2. Buka SQL Editor, jalankan seluruh `supabase/schema.sql`.
3. Buka Project Settings > API, salin Project URL dan anon/public key ke `.env.local`.
4. Untuk mode username+password tanpa email pengguna, aplikasi memetakan username ke alamat internal `username@jelajah.local`. Di Supabase Authentication > Providers > Email, nonaktifkan **Confirm email** untuk prototipe username-only ini. Jangan gunakan alamat internal tersebut untuk komunikasi email. Untuk produksi publik, lebih baik minta email sungguhan atau implementasikan verifikasi email.
5. Jalankan ulang `npm run dev`.

Auth menggunakan Supabase Auth (password dikelola dan di-hash oleh Supabase), cookie session SSR, dan middleware yang melindungi `/dashboard`. SQL mengaktifkan Row Level Security sehingga data tiap user dibatasi oleh `auth.uid()`.

## 4. Deploy Vercel
Tambahkan ke Project > Settings > Environment Variables:
- `GEMINI_API_KEY`
- `GEMINI_MODEL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
Pilih Production (dan Preview bila diperlukan), kemudian Redeploy.

## 5. Fitur v0.6
- Editorial landing page, login, dan register.
- Supabase Auth dengan username/password dan SSR session protection.
- Database schema untuk profil, trips, destinasi yang dikunjungi, achievement, dan inventory; RLS per pengguna.
- Dashboard perjalanan existing, Leaflet map, Gemini itinerary dan assistant.
- Deteksi lokasi browser dan cuaca saat ini/prakiraan 3 hari melalui Open-Meteo.
- Avatar wardrobe existing, lima ekspresi, quick-chat shortcuts, motion/hover/scroll effects.

## Catatan implementasi
- `trips`, `visited_destinations`, `user_achievements`, dan `avatar_inventory` sudah disiapkan di schema, tetapi state dashboard lama belum seluruhnya dimigrasikan ke penyimpanan cloud. Jangan klaim sinkronisasi lintas perangkat sampai API persistence untuk semua modul dihubungkan.
- AI assistant saat ini menjawab dan memberi saran berbasis konteks itinerary; perubahan itinerary tetap perlu dikonfirmasi pengguna dan belum menjalankan transaksi eksternal otomatis.
- Data cuaca Open-Meteo adalah prakiraan, bukan jaminan kondisi aktual. GPS hanya dipakai setelah izin browser diberikan.
- Harga tempat wisata dan estimasi biaya harus diverifikasi sebelum perjalanan.

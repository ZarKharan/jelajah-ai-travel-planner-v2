# Implementation Notes — Next Steps

## 1. Provider abstraction

Buat interface internal untuk:
- `PlaceProvider.searchPlaces()`
- `PlaceProvider.getPlaceDetails()`
- `RoutingProvider.getRoute()`
- `PriceProvider.getPriceEvidence()`
- `WeatherProvider.getForecast()`

Semua provider perlu mengembalikan provenance: provider, observedAt, freshness/expiry jika diizinkan, dan confidence/status. Jangan gabungkan atribut dari provider berbeda tanpa menyimpan asalnya.

## 2. AI planner pipeline

1. Ambil kandidat tempat dari provider.
2. Normalisasi dan deduplikasi.
3. Ambil data jam operasional dan harga yang dapat diakses.
4. Minta LLM memilih dan menyusun kandidat, dengan output yang mengikuti schema.
5. Validasi output schema.
6. Hitung rute menggunakan routing provider.
7. Validasi konflik waktu, jam buka, batas budget, dan waktu perjalanan.
8. Jika invalid, lakukan repair terbatas atau kembalikan warning.
9. Simpan versi itinerary setelah pengguna login dan meminta penyimpanan.

LLM tidak boleh membuat koordinat, provider IDs, harga resmi, atau waktu tempuh tanpa sumber.

## 3. Security

- Secrets hanya di server.
- Supabase RLS untuk semua data pengguna.
- Validasi authorization pada setiap trip endpoint.
- Rate limit endpoint AI dan provider.
- Batas ukuran input dan file.
- Jangan menyimpan informasi pribadi yang tidak diperlukan.

## 4. Map integration

Peta pada starter project adalah ilustrasi CSS/SVG, bukan data peta. Saat integrasi:
- pilih satu map renderer utama;
- gunakan tile provider dengan ketentuan atribusi dan penggunaan yang benar;
- sinkronkan selection marker dengan itinerary;
- render route geometry dari provider routing;
- tampilkan pesan jelas saat geometri atau ETA tidak tersedia.

## 5. Budget model

Simpan nominal sebagai angka numerik dan sertakan unit: per person, per serving, per room/night, per vehicle/trip, dan sebagainya. Total hanya mencakup kategori yang dipilih pengguna. Unknown price tidak sama dengan nol.


## Integrasi Gemini + Google Maps (v0.2)

- `app/api/itinerary/route.ts`: server-side Gemini REST API; key di `GEMINI_API_KEY`, model configurable lewat `GEMINI_MODEL`. Validasi city, durasi, jumlah traveler, serta filter kategori budget.
- `components/GoogleMapView.tsx`: memuat Google Maps JavaScript API dan meng-geocode kota serta stop yang ditampilkan. Browser key memakai `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`; batasi key dengan HTTP referrer dan API restrictions.
- `app/page.tsx`: kota tujuan menjadi input teks dengan suggestion list; `Generate itinerary` mengirim form ke route API dan mengganti timeline berdasarkan hasil AI.

### Catatan deployment
Tambahkan `GEMINI_API_KEY`, `GEMINI_MODEL`, dan `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` di Vercel Project → Settings → Environment Variables. Redeploy setelah mengubah environment variables. Untuk production, tambahkan rate limiting pada endpoint AI, validasi output schema lebih ketat, serta pertimbangkan Places API / Routes API untuk verifikasi lokasi dan rute aktual.

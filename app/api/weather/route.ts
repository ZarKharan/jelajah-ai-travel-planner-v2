import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
export async function GET(req: NextRequest) {
  const lat = Number(req.nextUrl.searchParams.get('lat'));
  const lon = Number(req.nextUrl.searchParams.get('lon'));
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) return NextResponse.json({ error: 'Koordinat tidak valid.' }, { status: 400 });
  try {
    const url = new URL('https://api.open-meteo.com/v1/forecast');
    url.search = new URLSearchParams({ latitude: String(lat), longitude: String(lon), current: 'temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m', daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max', timezone: 'auto', forecast_days: '3' }).toString();
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) return NextResponse.json({ error: 'Data cuaca belum tersedia.' }, { status: 502 });
    return NextResponse.json(await response.json(), { headers: { 'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=1800' } });
  } catch { return NextResponse.json({ error: 'Gagal mengambil prakiraan cuaca.' }, { status: 502 }); }
}

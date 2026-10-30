import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabase/server';
export const runtime = 'nodejs';
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Silakan masuk terlebih dahulu.' }, { status: 401 });
    const body = await request.json();
    const city = typeof body.city === 'string' ? body.city.trim().slice(0, 100) : '';
    if (!city) return NextResponse.json({ error: 'Kota wajib diisi.' }, { status: 400 });
    const { data, error } = await supabase.from('trips').insert({ user_id: user.id, city, days: Math.min(14, Math.max(1, Number(body.days) || 1)), interests: Array.isArray(body.interests) ? body.interests.slice(0, 12) : [], budget: Math.max(0, Number(body.budget) || 0), itinerary: Array.isArray(body.itinerary) ? body.itinerary.slice(0, 80) : [] }).select('id,city,created_at').single();
    if (error) throw error;
    return NextResponse.json({ trip: data }, { status: 201 });
  } catch (error) { console.error('Save trip error', error); return NextResponse.json({ error: 'Perjalanan belum dapat disimpan ke database. Pastikan schema Supabase sudah dijalankan.' }, { status: 500 }); }
}

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return NextResponse.json({ error: "GEMINI_API_KEY belum diatur." }, { status: 503 });

  let body: { question?: string; city?: string; itinerary?: string[] };
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Request bukan JSON yang valid." }, { status: 400 }); }

  const question = typeof body.question === "string" ? body.question.trim().slice(0, 1000) : "";
  const city = typeof body.city === "string" ? body.city.trim().slice(0, 100) : "Indonesia";
  const places = Array.isArray(body.itinerary) ? body.itinerary.filter((v): v is string => typeof v === "string").slice(0, 12) : [];
  if (!question) return NextResponse.json({ error: "Pertanyaan masih kosong." }, { status: 400 });

  const model = (process.env.GEMINI_MODEL || "gemini-3.8-flash").trim().replace(/^models\//, "");
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: `Kamu adalah asisten perjalanan Indonesia yang ramah. Jawab dalam Bahasa Indonesia, ringkas, berguna, jangan mengarang harga atau jam operasional. Jelaskan bahwa info terbaru perlu diverifikasi jika tidak yakin. Kota pengguna: ${city}. Destinasi di itinerary hari ini: ${places.join(", ") || "belum ada"}. Pertanyaan: ${question}` }] }],
        generationConfig: { temperature: 0.45, maxOutputTokens: 700 },
      }),
      signal: AbortSignal.timeout(25_000),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      console.error("Gemini assistant error", response.status, payload?.error?.message || "Unknown error");
      return NextResponse.json({ error: response.status === 429 ? "Kuota Gemini sedang penuh. Coba lagi sebentar." : "AI belum bisa menjawab saat ini. Periksa konfigurasi Gemini." }, { status: response.status === 429 ? 429 : 502 });
    }
    const answer = payload?.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text || "").join("").trim();
    if (!answer) return NextResponse.json({ error: "AI tidak mengembalikan jawaban. Coba pertanyaan lain." }, { status: 502 });
    return NextResponse.json({ answer });
  } catch (error) {
    const timeout = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
    return NextResponse.json({ error: timeout ? "AI terlalu lama merespons. Coba pertanyaan yang lebih singkat." : "Gagal menghubungi Gemini." }, { status: timeout ? 504 : 502 });
  }
}

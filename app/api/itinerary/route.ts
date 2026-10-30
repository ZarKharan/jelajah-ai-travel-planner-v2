
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

type RequestBody = {
  city?: string;
  days?: number;
  travelers?: number;
  budgetTier?: string;
  travelPace?: string;
  budget?: number;
  budgetScope?: string[];
  interests?: string[];
  startTime?: string;
  endTime?: string;
};

type ItineraryItem = {
  id: number;
  day: number;
  name: string;
  category: string;
  area: string;
  time: string;
  duration: string;
  price: number;
  rating: string;
  color: string;
  icon: string;
  description: string;
  mode: string;
};

const ALLOWED_BUDGET_ITEMS = new Set([
  "tickets",
  "food",
  "local_transport",
  "accommodation",
  "intercity_transport",
]);

const CATEGORIES = [
  "Budaya",
  "Kuliner",
  "Alam",
  "Sejarah",
  "Belanja",
  "Tempat ibadah",
  "Lainnya",
];

const COLORS = ["sand", "sage", "terracotta", "blue"];
const ICONS = ["landmark", "trees", "utensils", "coffee", "map"];

const ITINERARY_SCHEMA = {
  type: "OBJECT",
  properties: {
    itinerary: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          id: { type: "INTEGER" },
          day: { type: "INTEGER" },
          name: { type: "STRING" },
          category: {
            type: "STRING",
            enum: CATEGORIES,
          },
          area: { type: "STRING" },
          time: { type: "STRING" },
          duration: { type: "STRING" },
          price: { type: "INTEGER" },
          color: {
            type: "STRING",
            enum: COLORS,
          },
          icon: {
            type: "STRING",
            enum: ICONS,
          },
          description: { type: "STRING" },
          mode: { type: "STRING" },
        },
        required: [
          "id",
          "day",
          "name",
          "category",
          "area",
          "time",
          "duration",
          "price",
          "color",
          "icon",
          "description",
          "mode",
        ],
      },
    },
  },
  required: ["itinerary"],
};

function cleanText(
  value: unknown,
  fallback: string,
  max: number
): string {
  if (typeof value !== "string") return fallback;

  const result = value.trim().slice(0, max);
  return result || fallback;
}

function parseModelJson(text: string): unknown {
  let cleaned = text.trim();

  cleaned = cleaned
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");

    if (firstBrace !== -1 && lastBrace > firstBrace) {
      return JSON.parse(
        cleaned.slice(firstBrace, lastBrace + 1)
      );
    }

    throw new Error("Respons AI bukan JSON yang valid.");
  }
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "GEMINI_API_KEY belum diatur. Tambahkan ke .env.local, lalu restart server.",
      },
      { status: 503 }
    );
  }

  let body: RequestBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Body request bukan JSON yang valid." },
      { status: 400 }
    );
  }

  const city =
    typeof body.city === "string"
      ? body.city.trim().slice(0, 100)
      : "";

  const days = Number(body.days);
  const travelers = Number(body.travelers);
  const budget = Number(body.budget);

  const startTime =
    typeof body.startTime === "string" &&
    /^([01]\d|2[0-3]):[0-5]\d$/.test(body.startTime)
      ? body.startTime
      : "08:00";

  const endTime =
    typeof body.endTime === "string" &&
    /^([01]\d|2[0-3]):[0-5]\d$/.test(body.endTime)
      ? body.endTime
      : "17:00";

  const budgetScope = Array.isArray(body.budgetScope)
    ? body.budgetScope.filter(
        (item): item is string =>
          typeof item === "string" &&
          ALLOWED_BUDGET_ITEMS.has(item)
      )
    : [];

  const interests = Array.isArray(body.interests)
    ? body.interests
        .filter(
          (item): item is string =>
            typeof item === "string"
        )
        .map((item) => item.trim().slice(0, 60))
        .filter(Boolean)
        .slice(0, 10)
    : [];

  if (!city) {
    return NextResponse.json(
      { error: "Kota tujuan wajib diisi." },
      { status: 400 }
    );
  }

  if (!Number.isInteger(days) || days < 1 || days > 5) {
    return NextResponse.json(
      { error: "Durasi perjalanan harus 1–5 hari." },
      { status: 400 }
    );
  }

  if (
    !Number.isInteger(travelers) ||
    travelers < 1 ||
    travelers > 30
  ) {
    return NextResponse.json(
      { error: "Jumlah orang harus 1–30." },
      { status: 400 }
    );
  }

  if (Number.isFinite(budget) && budget < 0) {
    return NextResponse.json(
      { error: "Budget tidak boleh negatif." },
      { status: 400 }
    );
  }

  const model = (
    process.env.GEMINI_MODEL || "gemini-3.5-flash-lite"
  )
    .trim()
    .replace(/^models\//, "");

  const budgetText =
    Number.isFinite(budget) && budget > 0
      ? `Rp${Math.round(budget).toLocaleString("id-ID")}`
      : "belum ditentukan";

  const prompt = `
Kamu adalah asisten perencana perjalanan di Indonesia.

Buat itinerary realistis dalam Bahasa Indonesia.

DATA PERJALANAN
- Tujuan: ${city}, Indonesia
- Durasi: ${days} hari
- Jumlah wisatawan: ${travelers} orang
- Kategori budget: ${cleanText(body.budgetTier, "Standar", 30)}
- Tempo perjalanan: ${cleanText(body.travelPace, "Seimbang", 30)}
- Budget per orang untuk seluruh perjalanan: ${budgetText}
- Komponen biaya: ${budgetScope.join(", ") || "belum dipilih"}
- Minat: ${interests.join(", ") || "rekomendasi umum"}
- Jam aktivitas: ${startTime} sampai ${endTime}
ATURAN LOKASI WAJIB:
1. Semua destinasi harus berada di dalam wilayah kota/daerah tujuan:
   ${city}, Indonesia.
2. Jangan merekomendasikan destinasi dari kota atau kabupaten lain
   hanya karena tempat tersebut populer.
3. Setiap destinasi harus relevan secara geografis dengan tujuan.
4. Jika suatu tempat berada di luar wilayah tujuan, jangan masukkan.
5. Jangan menganggap kota tujuan selalu Yogyakarta.
6. Buat variasi destinasi yang berbeda untuk setiap hari.
7. Jangan mengulang tempat yang sama pada hari berbeda.
8. Sesuaikan kuliner, budaya, sejarah, alam, dan tempat belanja
   dengan karakteristik tujuan yang diminta.
9. Jangan mengarang tempat untuk memenuhi jumlah destinasi.
   Jika pilihan terbatas, prioritaskan akurasi lokasi.
ATURAN WAJIB
1. Buat 3 sampai 4 tempat per hari. Total tempat maksimal ${days * 4}.
2. Setiap tempat harus memiliki day antara 1 dan ${days}.
3. Gunakan destinasi nyata yang dikenal berada di tujuan tersebut.
4. Jangan mengarang koordinat, alamat, rating, atau jam buka.
5. Harga merupakan perkiraan biaya tiket atau aktivitas per orang
   dalam Rupiah. Gunakan bilangan bulat nonnegatif.
   Jika gratis atau tidak diketahui, isi 0.
6. Jangan menyatakan harga sebagai harga resmi atau pasti.
7. Susun aktivitas berdasarkan waktu yang masuk akal, termasuk
   perjalanan dan istirahat.
8. Jangan berpindah ke kota jauh yang tidak relevan.
9. Sesuaikan tempat dengan minat, budget, dan tempo perjalanan.
10. Hormati semua agama jika merekomendasikan tempat ibadah.
11. ID dimulai dari 1 dan unik untuk setiap tempat.
12. Waktu menggunakan format HH:mm.
13. category hanya boleh:
    Budaya, Kuliner, Alam, Sejarah, Belanja, Tempat ibadah, Lainnya.
14. color hanya boleh:
    sand, sage, terracotta, blue.
15. icon hanya boleh:
    landmark, trees, utensils, coffee, map.
16. Description maksimal 2 kalimat singkat.
17. Mode berisi saran transportasi yang masuk akal.
18. Kembalikan JSON sesuai schema, tanpa markdown atau penjelasan
    di luar JSON.
`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
        model
      )}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.25,
            responseMimeType: "application/json",
            responseSchema: ITINERARY_SCHEMA,
            maxOutputTokens: 8192,
          },
        }),
        signal: AbortSignal.timeout(55_000),
      }
    );

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      const apiMessage =
        payload?.error?.message ||
        "Tidak ada detail dari Gemini.";

      console.error("Gemini API error:", {
        status: response.status,
        message: apiMessage,
        model,
      });

      if (response.status === 429) {
        return NextResponse.json(
          {
            error:
              "Batas penggunaan Gemini tercapai. Tunggu sebentar atau periksa kuota API.",
          },
          { status: 429 }
        );
      }

      if (
        response.status === 400 ||
        response.status === 404
      ) {
        return NextResponse.json(
          {
            error:
              "Model atau konfigurasi Gemini tidak valid. Periksa GEMINI_MODEL dan akses API di Google AI Studio.",
          },
          { status: 502 }
        );
      }

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        return NextResponse.json(
          {
            error:
              "Gemini menolak permintaan. Periksa API key dan izin akses API.",
          },
          { status: 502 }
        );
      }

      return NextResponse.json(
        {
          error:
            "Layanan Gemini sedang bermasalah. Coba lagi nanti.",
        },
        { status: 502 }
      );
    }

    const candidate = payload?.candidates?.[0];
    const parts = candidate?.content?.parts;

    const text = Array.isArray(parts)
      ? parts
          .filter(
            (part: { text?: string }) =>
              typeof part.text === "string"
          )
          .map((part: { text: string }) => part.text)
          .join("")
      : "";

    if (!text.trim()) {
      console.error("Gemini returned no text:", {
        model,
        finishReason: candidate?.finishReason,
        promptFeedback:
          payload?.promptFeedback?.blockReason,
      });

      return NextResponse.json(
        {
          error:
            "Gemini tidak menghasilkan itinerary. Coba lagi atau periksa pengaturan model.",
        },
        { status: 502 }
      );
    }

    let parsed: unknown;

    try {
      parsed = parseModelJson(text);
    } catch {
      console.error("Invalid Gemini JSON:", {
        model,
        finishReason: candidate?.finishReason,
        preview: text.slice(0, 500),
      });

      return NextResponse.json(
        {
          error:
            "Respons Gemini tidak dapat dibaca sebagai JSON. Coba generate ulang.",
        },
        { status: 502 }
      );
    }

    let rawItems: unknown;

    if (Array.isArray(parsed)) {
      rawItems = parsed;
    } else if (
      parsed &&
      typeof parsed === "object" &&
      "itinerary" in parsed
    ) {
      rawItems = (
        parsed as { itinerary: unknown }
      ).itinerary;
    }

    if (!Array.isArray(rawItems)) {
      console.error("Unexpected Gemini structure:", {
        model,
        keys:
          parsed && typeof parsed === "object"
            ? Object.keys(parsed)
            : [],
      });

      return NextResponse.json(
        {
          error:
            "Format itinerary dari AI tidak sesuai. Coba generate ulang.",
        },
        { status: 502 }
      );
    }

    const itinerary: ItineraryItem[] = rawItems
      .filter(
        (item): item is Record<string, unknown> =>
          !!item &&
          typeof item === "object" &&
          !Array.isArray(item) &&
          typeof item.name === "string" &&
          item.name.trim().length > 0
      )
      .slice(0, days * 4)
      .map((item, index) => {
        const parsedDay = Number(item.day);
        const parsedPrice = Number(item.price);

        const day =
          Number.isFinite(parsedDay) &&
          Number.isInteger(parsedDay)
            ? Math.min(days, Math.max(1, parsedDay))
            : Math.min(
                days,
                Math.floor(index / 3) + 1
              );

        const time =
          typeof item.time === "string" &&
          /^([01]\d|2[0-3]):[0-5]\d$/.test(item.time)
            ? item.time
            : "09:00";

        const category = CATEGORIES.includes(
          String(item.category)
        )
          ? String(item.category)
          : "Lainnya";

        const color = COLORS.includes(
          String(item.color)
        )
          ? String(item.color)
          : "sage";

        const icon = ICONS.includes(
          String(item.icon)
        )
          ? String(item.icon)
          : "landmark";

        return {
          id: index + 1,
          day,
          name: cleanText(
            item.name,
            "Tempat wisata",
            120
          ),
          category,
          area: cleanText(item.area, city, 80),
          time,
          duration: cleanText(
            item.duration,
            "60 menit",
            40
          ),
          price:
            Number.isFinite(parsedPrice) &&
            parsedPrice >= 0
              ? Math.min(
                  2_000_000,
                  Math.round(parsedPrice)
                )
              : 0,
          rating: "Perlu verifikasi",
          color,
          icon,
          description: cleanText(
            item.description,
            "Tempat yang direkomendasikan untuk perjalanan ini.",
            240
          ),
          mode: cleanText(
            item.mode,
            "Mobil / ride-hailing",
            80
          ),
        };
      });

    if (itinerary.length === 0) {
      console.error(
        "Gemini itinerary contains no valid places.",
        { model, itemCount: rawItems.length }
      );

      return NextResponse.json(
        {
          error:
            "AI belum menghasilkan tempat wisata yang valid. Coba lagi.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      city,
      itinerary,
      generatedBy: model,
    });
  } catch (error) {
    const isTimeout =
      error instanceof Error &&
      (error.name === "TimeoutError" ||
        error.name === "AbortError");

    console.error("Itinerary generation failed:", {
      message:
        error instanceof Error
          ? error.message
          : "Unknown error",
      model,
      isTimeout,
    });

    return NextResponse.json(
      {
        error: isTimeout
          ? "Gemini terlalu lama merespons. Coba kurangi durasi atau generate ulang."
          : "Gagal menghubungi Gemini. Periksa koneksi internet dan log server.",
      },
      { status: isTimeout ? 504 : 502 }
    );
  }
}

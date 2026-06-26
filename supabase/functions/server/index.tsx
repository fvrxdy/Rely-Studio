import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";

const app = new Hono();

app.use("*", logger(console.log));
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

app.get("/make-server-1a613821/health", (c) => c.json({ status: "ok" }));

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

async function callOpenAI(messages: { role: string; content: string }[]) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.8,
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) throw new Error(`OpenAI error: ${res.status}`);
  const data = await res.json();
  return JSON.parse(data.choices[0].message.content);
}

const TONE_DESC: Record<string, string> = {
  Formal: "profesional, lugas, menggunakan kata ganti 'Anda', tidak menggunakan bahasa gaul",
  Santai: "ringan, akrab, menggunakan kata ganti 'kamu', boleh pakai bahasa gaul yang wajar",
  Storytelling: "naratif, bercerita seperti sebuah kisah nyata, membangun emosi pembaca secara bertahap",
};

// POST /generate-slides
app.post("/make-server-1a613821/generate-slides", async (c) => {
  try {
    const { topic, tone, format, count, audience, goals } = await c.req.json();
    const toneDesc = TONE_DESC[tone] || TONE_DESC["Formal"];
    const isSingle = format === "Single Post";
    const slideCount = isSingle ? 1 : Math.max(2, Math.min(8, count));

    const systemPrompt = `Kamu adalah penulis konten Instagram profesional untuk Rely Consulting Group, perusahaan konsultan bisnis yang bergerak di bidang hukum, pajak, keuangan, dan IT di Indonesia. Tugas kamu adalah membuat konten carousel Instagram yang informatif, relevan, dan menarik. Selalu tulis dalam Bahasa Indonesia. Kembalikan HANYA JSON yang valid, tanpa teks tambahan.`;

    let userPrompt = "";
    if (isSingle) {
      userPrompt = `Buat konten Instagram Single Post tentang: "${topic}"
Tone: ${tone} — ${toneDesc}
Target audiens: ${audience}
Tujuan konten: ${goals?.join(", ") || "Edukasi"}

Kembalikan JSON dengan struktur PERSIS ini:
{
  "slides": [
    {
      "headline": "judul utama yang menarik",
      "subheadline": "kalimat pendukung",
      "isi": "paragraf konten utama (2-3 kalimat)",
      "cta": "ajakan konsultasi ke Rely Consulting Group"
    }
  ],
  "hashtags": ["#RelyConsulting", "...5-7 hashtag relevan lainnya"]
}`;
    } else {
      userPrompt = `Buat konten Instagram Carousel ${slideCount} slide tentang: "${topic}"
Tone: ${tone} — ${toneDesc}
Target audiens: ${audience}
Tujuan konten: ${goals?.join(", ") || "Edukasi"}

Aturan slide:
- Slide 1 (Hook): headline yang sangat menarik + subheadline. WAJIB relevan langsung dengan topik "${topic}". Tidak perlu field "isi".
- Slide 2 sampai ${slideCount - 1} (Isi): masing-masing membahas satu aspek spesifik dari topik "${topic}" secara berurutan dan logis. Setiap slide punya headline, subheadline, isi (2-3 kalimat padat), dan boleh ada closing (1 kalimat penutup slide itu).
- Slide ${slideCount} (Penutup): rangkuman + cta yang mengajak konsultasi ke Rely Consulting Group. Punya headline, subheadline, isi, dan cta.

Semua slide HARUS membahas topik "${topic}" secara spesifik dan mendalam. Jangan buat konten generik.

Kembalikan JSON dengan struktur PERSIS ini:
{
  "slides": [
    { "headline": "...", "subheadline": "..." },
    { "headline": "...", "subheadline": "...", "isi": "...", "closing": "..." },
    { "headline": "...", "subheadline": "...", "isi": "...", "cta": "..." }
  ],
  "hashtags": ["#RelyConsulting", "...6-7 hashtag relevan dengan topik"]
}`;
    }

    const result = await callOpenAI([
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ]);

    return c.json({ success: true, ...result });
  } catch (err) {
    console.error(err);
    return c.json({ success: false, error: String(err) }, 500);
  }
});

// POST /generate-reels
app.post("/make-server-1a613821/generate-reels", async (c) => {
  try {
    const { topic, tone, count, audience, goals } = await c.req.json();
    const toneDesc = TONE_DESC[tone] || TONE_DESC["Formal"];
    const sceneCount = Math.max(3, Math.min(8, count));
    const middleCount = sceneCount - 2;

    const systemPrompt = `Kamu adalah penulis script Reels Instagram profesional untuk Rely Consulting Group, perusahaan konsultan bisnis di Indonesia. Tulis dalam Bahasa Indonesia. Kembalikan HANYA JSON yang valid.`;

    const userPrompt = `Buat script Instagram Reels ${sceneCount} scene tentang: "${topic}"
Tone: ${tone} — ${toneDesc}
Target audiens: ${audience}
Tujuan: ${goals?.join(", ") || "Edukasi"}

Aturan:
- Scene 1 (Hook): 1 kalimat pendek yang sangat provokatif/mengejutkan terkait topik "${topic}". Langsung menarik perhatian.
- Scene 2 sampai ${sceneCount - 1} (Script): masing-masing 1-2 kalimat pendek. Bangun cerita/argumen secara bertahap tentang "${topic}". Total ${middleCount} scene.
- Scene ${sceneCount} (Closing/CTA): 1-2 kalimat penutup yang kuat + kalimat CTA mengajak konsultasi ke Rely Consulting Group.

Setiap scene HARUS sangat singkat (max 2 kalimat), langsung to the point, cocok dibaca sebagai teks overlay video.

Kembalikan JSON PERSIS:
{
  "judul": "judul reels yang menarik tentang ${topic}",
  "kategori": "kategori konten (mis: Tips Bisnis, Edukasi Hukum, dll)",
  "scenes": [
    { "label": "Scene 1", "text": "...", "section": "hook" },
    { "label": "Scene 2", "text": "...", "section": "script" },
    { "label": "Scene ${sceneCount}", "text": "kalimat penutup.\\n\\nkalimat CTA ke Rely Consulting.", "section": "closing" }
  ],
  "hashtags": ["#RelyConsulting", "...6-7 hashtag relevan"]
}`;

    const result = await callOpenAI([
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ]);

    return c.json({ success: true, ...result });
  } catch (err) {
    console.error(err);
    return c.json({ success: false, error: String(err) }, 500);
  }
});

// POST /generate-caption
app.post("/make-server-1a613821/generate-caption", async (c) => {
  try {
    const { topic, tone, slides } = await c.req.json();
    const toneDesc = TONE_DESC[tone] || TONE_DESC["Formal"];

    const slideContext = slides
      ? slides.map((s: { headline: string }, i: number) => `Slide ${i + 1}: ${s.headline}`).join("\n")
      : "";

    const systemPrompt = `Kamu adalah copywriter Instagram profesional untuk Rely Consulting Group, konsultan bisnis Indonesia. Tulis dalam Bahasa Indonesia. Kembalikan HANYA JSON valid.`;

    const userPrompt = `Buat caption Instagram untuk post tentang: "${topic}"
Tone: ${tone} — ${toneDesc}
${slideContext ? `Konteks slide:\n${slideContext}\n` : ""}
Struktur caption WAJIB:
1. Hook: 1 kalimat pembuka dengan emoji yang relevan, langsung menarik
2. Pertanyaan/masalah: 1-2 kalimat yang relate dengan audiens
3. Penjelasan: 2-3 kalimat inti tentang topik
4. Kalimat penutup yang inspiratif
5. Baris pemisah: "-"
6. CTA: "📌 [ajakan konsultasi ke Rely Consulting Group]"
7. Handle: "📱 @relycg"

Kembalikan JSON PERSIS:
{
  "text": "isi caption lengkap dengan baris baru (\\n) antar bagian",
  "hashtags": ["#RelyConsulting", "...6-7 hashtag relevan dengan topik"]
}`;

    const result = await callOpenAI([
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ]);

    return c.json({ success: true, ...result });
  } catch (err) {
    console.error(err);
    return c.json({ success: false, error: String(err) }, 500);
  }
});

Deno.serve(app.fetch);

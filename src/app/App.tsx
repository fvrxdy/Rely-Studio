import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://qppinrottawxfdblhgab.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwcGlucm90dGF3eGZkYmxoZ2FiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0MTc3NjEsImV4cCI6MjA5Nzk5Mzc2MX0.3iuezE-t7-LOBFUlhpD8PqBtzqnvJ-2VKcKPu5ni6SE"
);
import {
  Sparkles,
  CalendarDays,
  Library,
  ChevronLeft,
  ChevronRight,
  Copy,
  RefreshCw,
  Send,
  Plus,
  X,
  Check,
  Trash2,
  BookOpen,
  MessageSquare,
  Layers,
  Tag,
  Clock,
  FileText,
  Palette,
  Link,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Pencil,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type Page = "generate" | "calendar" | "library" | "designer";
type Status = "Draft" | "Scheduled" | "Posted";
type DesignerStatus = "Belum Dikerjakan" | "Sedang Dikerjakan" | "Selesai";
type Format = "Single Post" | "Carousel" | "Reels Script";
type Tone = "Formal" | "Santai" | "Storytelling";
type Goal = "Edukasi" | "Promosi" | "Engagement" | "Awareness";
type Audience = "UMKM" | "Startup" | "Korporat" | "General Public";

interface Slide {
  headline: string;
  subheadline?: string;
  isi?: string;
  closing?: string;
  cta?: string;
}

interface Caption {
  text: string;
  hashtags: string[];
}

interface ReelsScene {
  label: string;
  text: string;
  section: "hook" | "script" | "closing";
}

interface GeneratedResult {
  id: string;
  topic: string;
  tone: Tone;
  format: Format;
  slides: Slide[];
  reelsScenes?: ReelsScene[];
  hashtags: string[];
  caption?: Caption;
  loadingCaption?: boolean;
}

interface ContentItem {
  id: string;
  topic: string;
  format: Format;
  tone: Tone;
  slides: Slide[];
  hashtags: string[];
  caption?: Caption;
  status: Status;
  createdAt: string;
  scheduledDate?: string;
}

interface DesignTask {
  contentId: string;
  designerStatus: DesignerStatus;
  note: string;
  driveLinks: string[];
  startedAt?: string;
  finishedAt?: string;
}

// ─── AI Content Generator ─────────────────────────────────────────────────────

type ContentCategory = "legal" | "pajak" | "it" | "bisnis" | "keuangan" | "motivasi" | "umkm" | "general";

function detectCategory(topic: string): ContentCategory {
  const t = topic.toLowerCase();
  if (/legal|hukum|kontrak|perizinan|izin usaha|\bpt\b|\bcv\b|firma|notaris|perjanjian|sengketa|gugatan|litigasi|advokat|haki|merek dagang/.test(t)) return "legal";
  if (/pajak|tax|spt|npwp|pph|ppn|bphtb|fiskal|kup|efiling|coretax|keberatan pajak|tarif pajak/.test(t)) return "pajak";
  if (/\bit\b|teknologi|digital|software|sistem informasi|aplikasi|cloud|siber|cybersecurity|erp|crm|infrastruktur|transformasi digital/.test(t)) return "it";
  if (/keuangan|cashflow|arus kas|modal|investasi|neraca|laporan keuangan|audit|akuntan|profit|omzet|pendapatan/.test(t)) return "keuangan";
  if (/\bumkm\b|usaha kecil|mikro|menengah|\bpkm\b|\bukm\b|warung|toko|naik kelas/.test(t)) return "umkm";
  if (/motivasi|quote|inspirasi|mindset|semangat|produktif|disiplin/.test(t)) return "motivasi";
  if (/startup|scale.?up|venture|fundraising|pitching|\bmvp\b|inovasi|pivot/.test(t)) return "bisnis";
  // Broad business / brand / case study topics — route to bisnis so content stays business-relevant
  if (/bisnis|usaha|perusahaan|brand|merek|branding|marketing|pemasaran|strategi|growth|cerita|kisah|studi kasus|pelajaran|sejarah|founder|entrepreneur|pemimpin|leadership|organisasi|tim|karyawan|delegasi|sistem kerja/.test(t)) return "bisnis";
  return "general";
}

// Build a topic-aware hook from the user's raw input
function buildTopicHook(topic: string, tone: Tone): string {
  const t = topic.trim();
  const lower = t.toLowerCase();

  // "Cerita brand X" → conversational hook about brand stories
  if (/^cerita\s+brand\s+/i.test(t)) {
    const brand = t.replace(/^cerita\s+brand\s+/i, "").trim();
    const hooks: Record<Tone, string> = {
      Formal: `Apa yang Bisa Bisnis Anda Pelajari dari Kisah ${brand}?`,
      Santai: `${brand} nggak langsung jadi besar. Ini cerita di baliknya.`,
      Storytelling: `Ada satu keputusan yang mengubah segalanya bagi ${brand}.`,
    };
    return hooks[tone];
  }

  // "Cerita / kisah X"
  if (/^(cerita|kisah)\s+/i.test(t)) {
    const subject = t.replace(/^(cerita|kisah)\s+/i, "").trim();
    const hooks: Record<Tone, string> = {
      Formal: `Pelajaran Bisnis dari Kisah ${subject}`,
      Santai: `Ini cerita tentang ${subject} yang jarang dibahas.`,
      Storytelling: `${subject} — sebuah perjalanan yang layak untuk diketahui.`,
    };
    return hooks[tone];
  }

  // "Studi kasus X"
  if (/^studi kasus\s+/i.test(t)) {
    const subject = t.replace(/^studi kasus\s+/i, "").trim();
    const hooks: Record<Tone, string> = {
      Formal: `Studi Kasus: Apa yang Bisa Dipelajari dari ${subject}?`,
      Santai: `Yuk bedah kasus ${subject} — banyak yang bisa dipelajari!`,
      Storytelling: `Kasus ${subject} menyimpan pelajaran bisnis yang jarang terungkap.`,
    };
    return hooks[tone];
  }

  // "Tips X" / "Cara X" / "Strategi X"
  if (/^(tips|cara|strategi|panduan|langkah)\s+/i.test(t)) {
    const subject = t.replace(/^(tips|cara|strategi|panduan|langkah)\s+/i, "").trim();
    const hooks: Record<Tone, string> = {
      Formal: `${t.charAt(0).toUpperCase() + t.slice(1)}: Panduan Praktis untuk Bisnis Anda`,
      Santai: `Mau tau ${lower}? Ini yang perlu kamu tau dulu.`,
      Storytelling: `Sebelum kamu coba, inilah yang sebenarnya terjadi saat seseorang menerapkan ${subject}.`,
    };
    return hooks[tone];
  }

  // Fallback: use the topic as the headline directly, polished
  const polished = t.charAt(0).toUpperCase() + t.slice(1);
  const fallbacks: Record<Tone, string> = {
    Formal: polished,
    Santai: `Ngomongin ${polished} — ini yang perlu kamu tau.`,
    Storytelling: `${polished}: cerita yang lebih dalam dari yang terlihat di permukaan.`,
  };
  return fallbacks[tone];
}

// Build topic-aware middle slides from the topic subject
function buildTopicMiddleSlides(topic: string, tone: Tone, category: ContentCategory, templateMiddle: SlideTemplate[], seed: number): SlideTemplate[] {
  const t = topic.trim().toLowerCase();
  const isBrandStory = /cerita brand|kisah brand|brand story|studi kasus/.test(t);
  const isStrategi = /strategi|cara|tips|panduan|langkah/.test(t);

  if (isBrandStory) {
    // Extract brand/subject name
    const subject = topic.replace(/^(cerita brand|kisah brand|studi kasus|cerita|kisah)\s+/i, "").trim();
    const brandSlides: SlideTemplate[] = [
      {
        headline: `Siapa Sebenarnya ${subject}?`,
        subheadline: `Sebelum jadi besar, ada perjalanan panjang yang jarang diceritakan.`,
        isi: `${subject} tidak tiba-tiba menjadi nama yang semua orang kenal. Ada keputusan-keputusan sulit, kegagalan yang tersembunyi, dan satu momen pivot yang mengubah segalanya.`,
        closing: `Setiap brand besar punya bab yang tidak diceritakan di permukaan.`,
      },
      {
        headline: `Titik Awal yang Tidak Sempurna`,
        subheadline: `Hampir setiap brand besar pernah nyaris tidak ada.`,
        isi: `Di fase awal, ${subject} menghadapi tantangan yang sama dengan banyak bisnis lain: sumber daya terbatas, pasar yang belum terbentuk, dan ketidakpastian yang konstan.`,
        closing: `Tapi mereka tetap bergerak maju — satu langkah kecil pada satu waktu.`,
      },
      {
        headline: `Keputusan yang Mengubah Segalanya`,
        subheadline: `Ada satu pivot yang membawa ${subject} ke level berikutnya.`,
        isi: `Alih-alih mengikuti cara yang sudah ada, ${subject} memilih pendekatan berbeda. Bukan karena berani saja — tapi karena memahami dengan dalam apa yang benar-benar dibutuhkan pasar.`,
        closing: `Diferensiasi bukan tentang berbeda untuk berbeda. Ini tentang relevan untuk pelanggan.`,
      },
      {
        headline: `Apa yang Bisa Bisnis Anda Pelajari?`,
        subheadline: `Setiap kisah brand sukses menyimpan prinsip yang bisa diadaptasi.`,
        isi: `Kesuksesan ${subject} bukan karena keberuntungan atau resources yang besar. Ini tentang konsistensi eksekusi, pemahaman mendalam tentang pelanggan, dan keberanian untuk berpivot saat diperlukan.`,
        closing: `Prinsip-prinsip ini berlaku untuk bisnis di skala apapun.`,
      },
      {
        headline: `Pelajaran tentang Membangun Brand yang Tahan Lama`,
        subheadline: `Brand yang kuat bukan dibangun dari iklan — tapi dari kepercayaan.`,
        isi: `${subject} membuktikan bahwa brand yang bertahan adalah yang terus-menerus memberikan nilai nyata kepada pelanggannya. Bukan yang paling banyak beriklan, tapi yang paling konsisten dalam janjinya.`,
        closing: `Kepercayaan dibangun bertahun-tahun dan bisa hancur dalam semalam.`,
      },
      {
        headline: `Relevansi di Era yang Terus Berubah`,
        subheadline: `Bagaimana ${subject} tetap relevan di tengah perubahan?`,
        isi: `Pasar terus berevolusi. Teknologi mengubah perilaku konsumen. Brand yang bertahan adalah yang mampu beradaptasi tanpa kehilangan identitas intinya.`,
        closing: `Adaptasi bukan berarti kehilangan jati diri — tapi memperluas relevansi.`,
      },
    ];
    const startIdx = seed % brandSlides.length;
    return [...brandSlides.slice(startIdx), ...brandSlides.slice(0, startIdx)];
  }

  if (isStrategi) {
    const subject = topic.replace(/^(strategi|cara|tips|panduan|langkah)\s+/i, "").trim();
    const strategiSlides: SlideTemplate[] = [
      {
        headline: `Kenapa Banyak Orang Salah Memahami ${subject}?`,
        subheadline: `Sebelum bisa menerapkannya, kita perlu meluruskan kesalahpahaman yang umum.`,
        isi: `Banyak yang mencoba ${subject} tapi gagal bukan karena metodenya salah — tapi karena fondasinya belum siap. Pemahaman yang benar di awal akan menentukan hasil akhirnya.`,
        closing: `Mulai dari pemahaman yang benar adalah setengah perjalanan menuju keberhasilan.`,
      },
      {
        headline: `Langkah Pertama yang Sering Dilewatkan`,
        subheadline: `Kebanyakan orang langsung ke teknis — padahal ada yang lebih mendasar dulu.`,
        isi: `Sebelum menerapkan ${subject}, pastikan Anda sudah memiliki kejelasan tentang tujuan, kondisi saat ini, dan sumber daya yang tersedia. Tanpa ini, sebaik apapun strateginya akan sulit dieksekusi.`,
        closing: `Diagnosis yang tepat menghasilkan solusi yang tepat.`,
      },
      {
        headline: `Framework yang Bisa Langsung Diterapkan`,
        subheadline: `Teori yang baik harus bisa dieksekusi secara praktis.`,
        isi: `${subject.charAt(0).toUpperCase() + subject.slice(1)} yang efektif bukan tentang kompleksitas. Ini tentang konsistensi dalam langkah-langkah yang terukur dan dapat dievaluasi secara berkala.`,
        closing: `Konsistensi dalam eksekusi mengalahkan strategi yang sempurna di atas kertas.`,
      },
      {
        headline: `Kesalahan Umum yang Harus Dihindari`,
        subheadline: `Belajar dari kesalahan orang lain lebih murah dari belajar dari kesalahan sendiri.`,
        isi: `Dalam menerapkan ${subject}, jebakan paling umum adalah terlalu berfokus pada hasil jangka pendek dan mengabaikan fondasi jangka panjang. Atau sebaliknya: terlalu perfeksionis hingga tidak pernah memulai.`,
        closing: `Done is better than perfect — selama evaluasi tetap berjalan.`,
      },
      {
        headline: `Cara Mengukur Keberhasilan`,
        subheadline: `Yang tidak bisa diukur tidak bisa ditingkatkan.`,
        isi: `Tetapkan metrik yang jelas sebelum mulai. Untuk ${subject}, pastikan ada indikator yang mencerminkan progres nyata — bukan hanya aktivitas yang terlihat sibuk.`,
        closing: `Metrik yang tepat memberi tahu kapan harus terus dan kapan harus pivot.`,
      },
    ];
    const startIdx = seed % strategiSlides.length;
    return [...strategiSlides.slice(startIdx), ...strategiSlides.slice(0, startIdx)];
  }

  // Generic topic: build slides that reference the topic directly
  const cleanTopic = topic.trim();
  const topicCap = cleanTopic.charAt(0).toUpperCase() + cleanTopic.slice(1);

  const genericSlides: SlideTemplate[] = [
    {
      headline: `Mengapa ${topicCap} Penting untuk Bisnis Anda?`,
      subheadline: `Banyak bisnis mengabaikan ini — dan akhirnya merasakan dampaknya.`,
      isi: `${topicCap} bukan sekadar tren. Ini adalah elemen strategis yang mempengaruhi bagaimana bisnis Anda berkomunikasi, tumbuh, dan bersaing di pasar. Bisnis yang memahami ini lebih awal memiliki keunggulan yang sulit dikejar pesaing.`,
      closing: `Pemahaman yang tepat adalah langkah pertama yang paling menentukan.`,
    },
    {
      headline: `3 Kesalahan Umum dalam ${topicCap}`,
      subheadline: `Hindari jebakan ini sebelum terlambat.`,
      isi: `Kesalahan pertama: tidak memiliki strategi yang jelas sebelum mulai. Kedua: mengukur keberhasilan dengan metrik yang salah. Ketiga: tidak konsisten dalam eksekusi. Ketiganya bisa dihindari dengan perencanaan yang matang sejak awal.`,
      closing: `Belajar dari kesalahan orang lain jauh lebih murah dari pengalaman sendiri.`,
    },
    {
      headline: `Strategi ${topicCap} yang Terbukti Berhasil`,
      subheadline: `Bukan teori — ini yang benar-benar bekerja di lapangan.`,
      isi: `Strategi yang efektif dalam ${cleanTopic} selalu dimulai dari pemahaman mendalam tentang audiens dan tujuan bisnis. Dari sana, setiap keputusan menjadi lebih terarah dan terukur — bukan sekadar coba-coba.`,
      closing: `Strategi tanpa eksekusi adalah mimpi. Eksekusi tanpa strategi adalah mimpi buruk.`,
    },
    {
      headline: `Cara Mengukur Keberhasilan ${topicCap}`,
      subheadline: `Yang tidak terukur tidak bisa ditingkatkan.`,
      isi: `Tetapkan KPI yang spesifik dan realistis untuk ${cleanTopic} Anda. Pantau secara berkala, evaluasi setiap bulan, dan jangan takut untuk menyesuaikan arah saat data menunjukkan perlunya perubahan. Fleksibilitas yang terstruktur adalah kunci.`,
      closing: `Data yang baik menghasilkan keputusan yang lebih baik.`,
    },
    {
      headline: `${topicCap} di Era Digital: Peluang yang Belum Banyak Dimanfaatkan`,
      subheadline: `Persaingan semakin ketat — tapi celah selalu ada bagi yang jeli melihatnya.`,
      isi: `Transformasi digital membuka dimensi baru dalam ${cleanTopic}. Bisnis yang mampu mengadopsi pendekatan digital secara cerdas — bukan sekadar ikut-ikutan — akan menemukan efisiensi dan peluang pertumbuhan yang sebelumnya tidak terbayangkan.`,
      closing: `Peluang terbaik selalu ada di antara yang paling lambat beradaptasi.`,
    },
    {
      headline: `Langkah Konkret Memulai ${topicCap} yang Efektif`,
      subheadline: `Dari nol ke terstruktur — ini caranya.`,
      isi: `Mulai dengan audit sederhana: di mana posisi bisnis Anda sekarang terkait ${cleanTopic}? Dari sana, tentukan 1-3 prioritas utama yang paling berdampak. Jangan mencoba melakukan semuanya sekaligus — fokus dan konsistensi mengalahkan kesibukan yang tidak terarah.`,
      closing: `Satu langkah yang dieksekusi lebih baik dari sepuluh rencana yang sempurna di kertas.`,
    },
  ];

  const startIdx = seed % genericSlides.length;
  return [...genericSlides.slice(startIdx), ...genericSlides.slice(0, startIdx)];
}

// Build topic-aware reels scenes for free-form topics
function buildTopicReelsScenes(topic: string, tone: Tone, seed: number): string[] {
  const t = topic.trim().toLowerCase();
  const subject = topic.replace(/^(cerita brand|kisah brand|studi kasus|cerita|kisah|tips|strategi|cara)\s+/i, "").trim();
  const isBrand = /cerita brand|kisah brand|brand story/.test(t);
  const isKisah = /^(cerita|kisah)\s+/.test(t);
  const isStrategi = /^(tips|strategi|cara|langkah|panduan)\s+/.test(t);

  if (isBrand) {
    const allScenes = [
      `${subject} tidak tiba-tiba menjadi nama besar.`,
      `Ada fase di mana hampir tidak ada yang percaya.`,
      `Resources terbatas. Pasar belum terbentuk.`,
      `Tapi ada satu keputusan yang mengubah arah segalanya.`,
      `Mereka memilih untuk fokus pada satu segmen kecil dulu — dan menguasainya.`,
      `Bukan mencoba jadi segalanya untuk semua orang.`,
      `Dari sana, kepercayaan dibangun satu pelanggan pada satu waktu.`,
      `Dan brand yang kuat tidak dibangun dari iklan terbesar.`,
      `Tapi dari janji yang paling konsisten ditepati.`,
    ];
    const rotated = seed > 0 ? [...allScenes.slice(seed % allScenes.length), ...allScenes.slice(0, seed % allScenes.length)] : allScenes;
    return rotated;
  }

  if (isKisah) {
    const allScenes = [
      `Cerita ini dimulai dari tempat yang paling tidak terduga.`,
      `Tidak ada yang menyangka ${subject} akan berkembang seperti ini.`,
      `Di fase paling awal, semuanya terasa tidak pasti.`,
      `Tapi satu hal yang tidak pernah berubah: komitmen untuk terus bergerak maju.`,
      `Setiap rintangan justru mengajarkan sesuatu yang tidak bisa dipelajari di tempat lain.`,
      `Dan seiring waktu, pola itu mulai terlihat jelas.`,
      `${subject} bukan tentang siapa yang paling beruntung.`,
      `Tapi tentang siapa yang paling konsisten.`,
      `Dan itulah pelajaran yang bisa kita bawa ke bisnis kita masing-masing.`,
    ];
    const rotated = seed > 0 ? [...allScenes.slice(seed % allScenes.length), ...allScenes.slice(0, seed % allScenes.length)] : allScenes;
    return rotated;
  }

  if (isStrategi) {
    const allScenes = [
      `Banyak yang mencoba ${subject} tapi hasilnya tidak maksimal.`,
      `Bukan karena strateginya salah.`,
      `Tapi karena langkah pertama yang paling krusial sering dilewati.`,
      `${subject.charAt(0).toUpperCase() + subject.slice(1)} yang efektif dimulai dari kejelasan tujuan.`,
      `Bukan langsung ke teknis.`,
      `Setelah tujuan jelas, baru framework eksekusinya bisa dibangun.`,
      `Dan yang tidak kalah penting: metrik yang jelas untuk mengukur progres.`,
      `Karena yang tidak terukur tidak bisa ditingkatkan.`,
      `Mulai dari satu langkah kecil. Evaluasi. Lanjutkan.`,
    ];
    const rotated = seed > 0 ? [...allScenes.slice(seed % allScenes.length), ...allScenes.slice(0, seed % allScenes.length)] : allScenes;
    return rotated;
  }

  // Generic topic scenes
  const allScenes = [
    `${topic} — topik yang lebih dalam dari yang terlihat di permukaan.`,
    `Banyak yang membicarakannya, tapi sedikit yang benar-benar memahami konteksnya.`,
    `Mari kita lihat dari perspektif yang berbeda.`,
    `Ada satu aspek yang sering terlewat dalam pembahasan ini.`,
    `Dan justru di situlah letak kuncinya.`,
    `Ketika kita memahami ini, banyak hal yang tadinya membingungkan jadi lebih jelas.`,
    `Penerapannya dalam konteks bisnis dan kehidupan sehari-hari lebih luas dari yang kita duga.`,
    `Karena pada akhirnya, setiap insight yang baik harus bisa diterapkan secara nyata.`,
    `Dan itulah yang membedakan pengetahuan dari kebijaksanaan.`,
  ];
  const rotated = seed > 0 ? [...allScenes.slice(seed % allScenes.length), ...allScenes.slice(0, seed % allScenes.length)] : allScenes;
  return rotated;
}

// Build closing slide based on topic
function buildTopicClosing(topic: string, tone: Tone): { headline: string; subheadline: string; isi: string } {
  const subject = topic.replace(/^(cerita brand|kisah brand|studi kasus|cerita|kisah|tips|strategi|cara)\s+/i, "").trim();
  const isBrand = /cerita brand|kisah brand|brand story/i.test(topic);
  const isKisah = /^(cerita|kisah)\s+/i.test(topic);

  if (isBrand || isKisah) {
    return {
      headline: `Pelajaran dari ${subject} untuk Bisnis Anda`,
      subheadline: `Setiap kisah brand sukses menyimpan prinsip yang bisa diadaptasi.`,
      isi: `Konsistensi, fokus pada pelanggan, dan keberanian untuk berpivot — inilah tiga prinsip yang bisa kita pelajari dan terapkan di bisnis kita, berapapun skalanya.`,
    };
  }

  // Generic topic closing — always references the topic
  const cleanTopic = topic.trim();
  const topicCap = cleanTopic.charAt(0).toUpperCase() + cleanTopic.slice(1);

  const closings: Record<Tone, { headline: string; subheadline: string; isi: string }> = {
    Formal: {
      headline: `${topicCap}: Saatnya Bergerak dari Insight ke Aksi`,
      subheadline: `Pemahaman tanpa eksekusi tidak menghasilkan perubahan nyata.`,
      isi: `${topicCap} yang efektif membutuhkan strategi yang tepat, eksekusi yang konsisten, dan evaluasi yang berkelanjutan. Rely Consulting Group siap membantu bisnis Anda merancang pendekatan yang sesuai dengan konteks dan tujuan spesifik Anda.`,
    },
    Santai: {
      headline: `Oke, Sekarang Kamu Udah Paham Soal ${topicCap}`,
      subheadline: `Pertanyaannya: langkah apa yang akan kamu ambil hari ini?`,
      isi: `Jangan tunggu sempurna. Mulai dari satu langkah kecil yang konkret terkait ${cleanTopic}. Evaluasi, perbaiki, ulangi. Kalau butuh teman diskusi yang serius, Rely Consulting Group ada buat bantu kamu.`,
    },
    Storytelling: {
      headline: `Dan Itulah Mengapa ${topicCap} Layak Diprioritaskan`,
      subheadline: `Setiap bisnis yang tumbuh punya satu kesamaan: mereka tidak mengabaikan hal-hal fundamental.`,
      isi: `${topicCap} adalah salah satu fundamental itu. Bisnis yang memberi perhatian serius padanya — dengan strategi, konsistensi, dan mitra yang tepat — selalu menemukan jalan untuk berkembang, bahkan di tengah ketidakpastian.`,
    },
  };

  return closings[tone];
}

interface SlideTemplate {
  headline: string;
  subheadline?: string;
  isi?: string;
  closing?: string;
}

interface ContentTemplate {
  hook: SlideTemplate;
  middle: SlideTemplate[];
  penutup: SlideTemplate;
  cta: string;
  hashtags: string[];
  captions: { formal: string; santai: string; storytelling: string };
}

const CONTENT_DB: Record<ContentCategory, Record<string, ContentTemplate>> = {
  legal: {
    default: {
      hook: {
        headline: "Banyak Bisnis Besar Runtuh Bukan Karena Produknya Buruk",
        subheadline: "Tapi karena fondasi hukumnya rapuh sejak awal.",
      },
      middle: [
        {
          headline: "Apa Itu Legalitas Usaha dan Mengapa Wajib?",
          subheadline: "Legalitas bukan sekadar formalitas — ini adalah perisai bisnis Anda.",
          isi: "Izin usaha, akta pendirian, dan NPWP badan adalah tiga dokumen dasar yang wajib dimiliki setiap usaha sebelum beroperasi secara penuh. Tanpa ketiganya, risiko hukum bisa muncul kapan saja.",
          closing: "Bisnis tanpa legalitas ibarat rumah tanpa pondasi.",
        },
        {
          headline: "Perbedaan PT, CV, dan Firma",
          subheadline: "Memilih badan usaha yang salah bisa berdampak besar pada pajak dan tanggung jawab hukum.",
          isi: "PT (Perseroan Terbatas) memisahkan harta pribadi dari bisnis. CV cocok untuk usaha skala menengah dengan mitra aktif dan pasif. Firma mengikat seluruh anggota secara penuh atas kewajiban usaha.",
          closing: "Pilih struktur yang sesuai dengan skala dan tujuan jangka panjang bisnis Anda.",
        },
        {
          headline: "Kontrak Bisnis: Jangan Andalkan Lisan",
          subheadline: "Kesepakatan verbal sulit dibuktikan di pengadilan.",
          isi: "Setiap transaksi bisnis — dari jual beli, sewa menyewa, hingga kerjasama — sebaiknya diikat dalam perjanjian tertulis yang memuat hak, kewajiban, dan mekanisme penyelesaian sengketa.",
          closing: "Kontrak yang baik mencegah perselisihan sebelum terjadi.",
        },
        {
          headline: "Perlindungan HAKI untuk Bisnis Anda",
          subheadline: "Merek, paten, dan hak cipta adalah aset yang harus didaftarkan.",
          isi: "Banyak pelaku usaha baru sadar pentingnya HAKI setelah mereknya dicuri atau produknya ditiru. Pendaftaran merek di DJKI membutuhkan waktu 12–24 bulan — jadi mulailah lebih awal.",
          closing: "HAKI bukan kemewahan, tapi kebutuhan di era persaingan digital.",
        },
        {
          headline: "Perubahan Anggaran Dasar: Kapan Harus Dilakukan?",
          subheadline: "Perubahan pemegang saham, direksi, atau alamat perusahaan wajib dinotariskan.",
          isi: "Banyak perusahaan yang lupa memperbaharui akta setelah ada perubahan internal. Ini bisa menjadi masalah saat pengajuan kredit, tender, atau proses akuisisi.",
          closing: "Selalu sinkronkan dokumen legal dengan kondisi bisnis terkini.",
        },
        {
          headline: "Sengketa Bisnis: Jalur Damai vs Jalur Pengadilan",
          subheadline: "Mediasi dan arbitrase bisa lebih cepat dan hemat dibanding litigasi.",
          isi: "Penyelesaian sengketa melalui BANI (Badan Arbitrase Nasional Indonesia) atau mediator bersertifikat sering menjadi pilihan bisnis untuk menjaga hubungan dan efisiensi waktu.",
          closing: "Pilih jalur sengketa yang sesuai dengan klausul dalam kontrak Anda.",
        },
        {
          headline: "Transformasi Digital dan Kepatuhan Hukum",
          subheadline: "Di era digital, bisnis perlu memahami regulasi data dan transaksi elektronik.",
          isi: "UU ITE dan PP 71/2019 tentang penyelenggaraan sistem elektronik mengatur kewajiban pelaku usaha digital. Pelanggaran dapat berujung pada sanksi administratif hingga pidana.",
          closing: "Patuh hukum digital bukan pilihan — ini adalah syarat bertahan.",
        },
      ],
      penutup: {
        headline: "Legalitas Bukan Beban — Ini Investasi",
        subheadline: "Bisnis yang kuat secara hukum tumbuh lebih percaya diri.",
        isi: "Dengan fondasi legal yang kokoh, Anda bisa fokus membesarkan bisnis tanpa khawatir tiba-tiba dihadapkan pada masalah hukum yang bisa dicegah sejak awal.",
      },
      cta: "Konsultasikan kebutuhan legal bisnis Anda bersama Rely Consulting Group — tim ahli hukum bisnis dan perizinan kami siap membantu.",
      hashtags: ["#RelyConsulting", "#LegalBisnis", "#IzinUsaha", "#HukumBisnis", "#LegalitasUMKM", "#KonsultasiHukum", "#BisnisBerkembang"],
      captions: {
        formal: `Apakah fondasi hukum bisnis Anda sudah kuat? ⚖️\n\nBanyak pelaku usaha baru menyadari pentingnya legalitas justru saat menghadapi masalah — saat kontrak digugat, merek ditiru, atau izin operasional dipertanyakan.\n\nPadahal, membangun struktur hukum yang benar sejak awal adalah investasi terbaik yang bisa dilakukan setiap pemilik bisnis. Mulai dari pemilihan badan usaha, perizinan, hingga perlindungan HAKI — setiap langkah memiliki konsekuensi hukum yang perlu dipahami.\n\nKarena bisnis yang sehat bukan hanya soal untung, tapi juga soal aman secara hukum.\n\n-\n\n📌 Konsultasikan kebutuhan legal bisnis Anda bersama Rely Consulting Group\n📱 @relycg`,
        santai: `Eh, udah tau belum? Banyak bisnis yang sukses tapi tiba-tiba kena masalah hukum gara-gara dokumennya nggak beres. 😬\n\nDari yang kontraknya cuma lisan, mereknya belum didaftarin, sampai badan usahanya nggak sesuai kebutuhan — ini semua bisa jadi bom waktu.\n\nMakanya penting banget nih untuk beresin dulu fondasi legalnya sebelum bisnis makin besar. Lebih murah nyegah daripada ngobatin!\n\nYuk, jangan tunda lagi. 💪\n\n-\n\n📌 Mau konsultasi soal legal bisnis? DM atau kunjungi Rely Consulting Group\n📱 @relycg`,
        storytelling: `Ada klien kami — pemilik brand fashion lokal yang sudah 3 tahun berjalan. 👗\n\nOmzetnya bagus, produknya laku. Tapi suatu hari, dia dikejutkan oleh surat gugatan. Ternyata nama mereknya sudah didaftarkan orang lain lebih dulu.\n\nSemua yang dibangun selama bertahun-tahun tiba-tiba terancam. Bukan karena produknya buruk, tapi karena satu hal yang terlewat: pendaftaran HAKI.\n\nCerita ini bukan untuk menakut-nakuti. Tapi untuk mengingatkan: bisnis yang besar butuh fondasi hukum yang sama besarnya.\n\n-\n\n📌 Jangan biarkan hal ini terjadi pada bisnis Anda. Konsultasikan dengan Rely Consulting Group.\n📱 @relycg`,
      },
    },
  },
  pajak: {
    default: {
      hook: {
        headline: "Bayar Pajak Itu Wajib. Tapi Bayar Lebih dari yang Seharusnya, Itu Pilihan.",
        subheadline: "Perencanaan pajak yang tepat bisa menghemat jutaan rupiah secara legal.",
      },
      middle: [
        {
          headline: "Apa Itu Tax Planning dan Apakah Legal?",
          subheadline: "Tax planning adalah strategi mengoptimalkan kewajiban pajak sesuai aturan yang berlaku.",
          isi: "Tax planning berbeda dari penggelapan pajak. Ini adalah upaya legal memanfaatkan insentif, pengecualian, dan metode akuntansi yang diizinkan undang-undang untuk meminimalkan beban pajak.",
          closing: "Semua wajib pajak berhak mengoptimalkan pajaknya — selama sesuai regulasi.",
        },
        {
          headline: "PPh 21: Kewajiban Perusahaan atas Karyawan",
          subheadline: "Setiap perusahaan wajib menghitung, memotong, dan menyetorkan PPh 21 karyawannya.",
          isi: "Kesalahan perhitungan PPh 21 bisa berujung pada koreksi saat pemeriksaan. Pastikan data karyawan, PTKP, dan metode gross/net/gross-up sudah ditetapkan dengan benar sejak awal tahun.",
          closing: "Administrasi PPh 21 yang rapi menghindarkan perusahaan dari risiko koreksi fiskal.",
        },
        {
          headline: "PPN 12%: Dampak dan Cara Mengelolanya",
          subheadline: "Kenaikan tarif PPN perlu direspons dengan strategi yang tepat.",
          isi: "Pengusaha Kena Pajak (PKP) wajib memungut, menyetor, dan melaporkan PPN tepat waktu. Pemahaman tentang faktur pajak masukan dan keluaran sangat krusial untuk menghindari lebih bayar yang menumpuk.",
          closing: "Kelola PPN dengan sistem yang terintegrasi untuk efisiensi dan kepatuhan.",
        },
        {
          headline: "SPT Tahunan Badan: Jangan Sampai Terlambat",
          subheadline: "Batas waktu pelaporan SPT Tahunan Badan adalah akhir April setiap tahunnya.",
          isi: "Keterlambatan lapor SPT dikenakan sanksi administrasi Rp 1 juta. Belum lagi jika ada kurang bayar — bunganya 2% per bulan. Pastikan laporan keuangan sudah siap sebelum tenggat.",
          closing: "Disiplin pelaporan pajak mencerminkan tata kelola perusahaan yang profesional.",
        },
        {
          headline: "Insentif Pajak yang Sering Terlewatkan UMKM",
          subheadline: "PPh Final 0,5% untuk UMKM adalah keringanan yang wajib dimanfaatkan.",
          isi: "UMKM dengan omzet di bawah Rp 4,8 miliar per tahun bisa menikmati tarif PPh Final 0,5% dari omzet bruto. Selain itu, ada fasilitas pengurangan PPh bagi industri tertentu dan kawasan tertentu.",
          closing: "Kenali insentif pajak yang tersedia — bisa jadi ini penghematan terbesar bisnis Anda.",
        },
        {
          headline: "Coretax DJP: Era Baru Administrasi Pajak Indonesia",
          subheadline: "Sistem Inti Administrasi Perpajakan (SIAP) membawa perubahan besar.",
          isi: "Coretax mengintegrasikan seluruh layanan perpajakan dalam satu platform. Wajib pajak perlu memahami alur pembuatan faktur, pelaporan SPT, dan pembayaran yang kini sepenuhnya digital.",
          closing: "Adaptasi dengan Coretax sejak dini untuk menghindari kendala administrasi.",
        },
        {
          headline: "Pemeriksaan Pajak: Hak dan Kewajiban Wajib Pajak",
          subheadline: "Saat diperiksa DJP, Anda punya hak untuk didampingi konsultan pajak.",
          isi: "Siapkan dokumentasi transaksi, bukti pembayaran, dan rekonsiliasi laporan keuangan dengan SPT. Wajib pajak berhak mengajukan keberatan atas Surat Ketetapan Pajak yang dianggap tidak sesuai.",
          closing: "Hadapi pemeriksaan pajak dengan tenang — asal dokumen Anda lengkap dan tertib.",
        },
      ],
      penutup: {
        headline: "Pajak yang Dikelola dengan Baik = Bisnis yang Lebih Sehat",
        subheadline: "Kepatuhan pajak bukan hanya soal menghindari sanksi, tapi membangun reputasi bisnis.",
        isi: "Perusahaan yang tertib pajak lebih mudah mendapat kepercayaan perbankan, investor, dan mitra bisnis. Mulai benahi administrasi perpajakan Anda sekarang.",
      },
      cta: "Konsultasikan perencanaan dan kepatuhan pajak bisnis Anda bersama tim konsultan pajak bersertifikat Rely Consulting Group.",
      hashtags: ["#RelyConsulting", "#KonsultasiPajak", "#TaxPlanning", "#PPh21", "#PPN12Persen", "#CoretaxDJP", "#PatuhPajak"],
      captions: {
        formal: `Sudahkah Anda memastikan kewajiban pajak bisnis sudah dikelola dengan benar? 📊\n\nBanyak pelaku usaha yang sudah membayar pajak, namun belum tentu membayar dengan jumlah yang tepat — bisa terlalu besar karena tidak memanfaatkan insentif yang tersedia, atau terlalu kecil sehingga berisiko koreksi.\n\nPerencanaan pajak yang baik bukan soal menghindari pajak, melainkan memastikan setiap rupiah yang dibayarkan sudah sesuai dengan hak dan kewajiban yang diatur undang-undang.\n\nKarena efisiensi pajak yang legal adalah bagian dari manajemen bisnis yang cerdas.\n\n-\n\n📌 Konsultasikan perencanaan pajak Anda bersama Rely Consulting Group\n📱 @relycg`,
        santai: `Bayar pajak itu wajib, setuju! Tapi bayar lebih dari yang seharusnya? Itu nggak perlu. 😅\n\nBanyak UMKM dan perusahaan yang nggak tau ternyata ada banyak insentif pajak yang bisa dimanfaatkan secara legal. PPh Final 0,5% untuk UMKM misalnya — ini bisa hemat banyak!\n\nDaripada pusing sendiri ngurus pajak, mending konsultasi dulu sama yang ahli. Lebih hemat waktu, lebih hemat duit. ✅\n\n-\n\n📌 DM Rely Consulting Group untuk konsultasi pajak bisnis Anda\n📱 @relycg`,
        storytelling: `Klien kami, pemilik PT skala menengah, hampir membayar pajak 3x lebih besar dari yang seharusnya. 😰\n\nBukan karena curang — justru sebaliknya. Mereka terlalu konservatif dan tidak memanfaatkan fasilitas pengurangan pajak yang sebenarnya tersedia untuk industri mereka.\n\nSetelah audit internal bersama tim kami, ditemukan potensi penghematan pajak yang signifikan — tanpa melanggar satu pun aturan perpajakan yang berlaku.\n\nItu yang disebut tax planning: bukan menipu negara, tapi memahami hak Anda sebagai wajib pajak.\n\n-\n\n📌 Ingin tahu apakah bisnis Anda sudah bayar pajak dengan optimal? Hubungi Rely Consulting Group.\n📱 @relycg`,
      },
    },
  },
  it: {
    default: {
      hook: {
        headline: "Perusahaan yang Lambat Beradaptasi Secara Digital Akan Ditinggal",
        subheadline: "Bukan oleh kompetitor — tapi oleh pelanggan mereka sendiri.",
      },
      middle: [
        {
          headline: "Mengapa Transformasi Digital Itu Mendesak?",
          subheadline: "Di 2026, digitalisasi bukan keunggulan kompetitif — ini syarat minimum.",
          isi: "Konsumen kini mengharapkan layanan yang cepat, transparan, dan mudah diakses dari mana saja. Bisnis yang masih bergantung pada proses manual kehilangan efisiensi dan kepercayaan pelanggan secara perlahan.",
          closing: "Digitalisasi bukan pilihan — ini strategi bertahan.",
        },
        {
          headline: "ERP: Tulang Punggung Operasional Bisnis Modern",
          subheadline: "Enterprise Resource Planning mengintegrasikan semua fungsi bisnis dalam satu sistem.",
          isi: "Dari keuangan, HR, inventaris, hingga penjualan — ERP memastikan semua departemen bekerja dengan data yang sama secara real-time. Ini menghilangkan silo informasi dan mempercepat pengambilan keputusan.",
          closing: "Bisnis tanpa ERP ibarat orkestra tanpa konduktor.",
        },
        {
          headline: "Keamanan Siber: Ancaman Nyata yang Sering Diabaikan",
          subheadline: "Serangan siber bukan hanya masalah perusahaan besar.",
          isi: "Ransomware, phishing, dan kebocoran data bisa menghancurkan reputasi dan keuangan bisnis dalam hitungan jam. UMKM justru sering menjadi target karena pertahanan digitalnya lebih lemah.",
          closing: "Investasi keamanan siber adalah asuransi terbaik bisnis digital Anda.",
        },
        {
          headline: "Cloud Computing: Efisiensi Biaya IT tanpa Kompromi",
          subheadline: "Beralih ke cloud bisa memangkas biaya infrastruktur hingga 60%.",
          isi: "Dengan cloud, Anda tidak perlu membeli server fisik yang mahal. Skalabilitas, keamanan data, dan aksesibilitas dari mana saja menjadi keunggulan utama yang mengubah cara tim bekerja.",
          closing: "Cloud bukan tentang teknologi — ini tentang fleksibilitas bisnis.",
        },
        {
          headline: "Sistem Manajemen Data yang Baik = Keputusan yang Lebih Baik",
          subheadline: "Data tanpa struktur adalah aset yang tidak bisa dimonetisasi.",
          isi: "Database yang terorganisir memungkinkan analitik bisnis yang akurat. Dari tren penjualan hingga perilaku pelanggan — data yang dikelola dengan baik menjadi kompas strategi bisnis.",
          closing: "Jadikan data sebagai aset, bukan beban administrasi.",
        },
        {
          headline: "Otomasi Proses Bisnis: Kurangi Pekerjaan Manual",
          subheadline: "RPA (Robotic Process Automation) bisa mengotomasi hingga 80% tugas repetitif.",
          isi: "Invoicing, approval dokumen, rekonsiliasi data — semua ini bisa diautomasi. Hasilnya: tim Anda fokus pada pekerjaan bernilai tinggi, bukan input data berulang.",
          closing: "Otomasi bukan tentang mengganti manusia, tapi membebaskan potensi mereka.",
        },
        {
          headline: "Vendor IT yang Tepat: Kunci Implementasi yang Sukses",
          subheadline: "Memilih vendor IT bukan soal harga — ini soal kecocokan ekosistem.",
          isi: "Evaluasi vendor berdasarkan rekam jejak, kemampuan kustomisasi, dukungan purna jual, dan skalabilitas solusi. Kontrak yang baik harus mencakup SLA, garansi uptime, dan klausul exit.",
          closing: "Investasi IT yang tepat dimulai dari pemilihan mitra yang tepat.",
        },
      ],
      penutup: {
        headline: "Teknologi Bukan Tujuan — Ini Alat untuk Tumbuh",
        subheadline: "Implementasi IT yang berhasil selalu dimulai dari strategi yang jelas.",
        isi: "Sebelum berinvestasi pada sistem baru, pahami dulu proses bisnis yang ada, identifikasi bottleneck, dan tentukan prioritas. Dengan pendekatan yang tepat, teknologi menjadi akselerator pertumbuhan.",
      },
      cta: "Konsultasikan kebutuhan transformasi digital dan infrastruktur IT bisnis Anda bersama tim konsultan IT Rely Consulting Group.",
      hashtags: ["#RelyConsulting", "#TransformasiDigital", "#KonsultasiIT", "#DigitalBusiness", "#CloudComputing", "#CyberSecurity", "#ERPIndonesia"],
      captions: {
        formal: `Seberapa siap bisnis Anda menghadapi era digital yang semakin kompetitif? 💻\n\nTransformasi digital bukan sekadar memasang aplikasi baru. Ini tentang mengubah cara bisnis beroperasi, melayani pelanggan, dan mengambil keputusan berbasis data.\n\nBanyak perusahaan yang terburu-buru berinvestasi teknologi tanpa strategi yang jelas, hingga akhirnya sistem yang mahal justru tidak memberikan nilai yang diharapkan.\n\nKesuksesan transformasi digital dimulai dari pemahaman mendalam tentang kebutuhan bisnis — bukan dari vendor yang paling banyak menawarkan fitur.\n\n-\n\n📌 Konsultasikan roadmap digital bisnis Anda bersama Rely Consulting Group\n📱 @relycg`,
        santai: `Masih pakai Excel untuk semua laporan? Atau WhatsApp untuk koordinasi proyek tim? 😅\n\nNggak ada yang salah sih — tapi kalau bisnis Anda sudah mulai besar, ini mungkin tanda saatnya naik level.\n\nSistem yang tepat bisa bikin operasional 10x lebih efisien. Dan nggak harus mahal! Ada banyak solusi yang bisa disesuaikan dengan ukuran dan budget bisnis Anda.\n\nYuk mulai dari konsultasi dulu, gratis! 🚀\n\n-\n\n📌 Hubungi Rely Consulting Group untuk solusi IT yang pas buat bisnis Anda\n📱 @relycg`,
        storytelling: `Dua tahun lalu, klien kami — perusahaan distribusi dengan 50 karyawan — masih mengandalkan spreadsheet untuk semua operasionalnya. 📋\n\nSetiap bulan, tim finance butuh 2 minggu penuh hanya untuk rekonsiliasi data. Manajer sering salah ambil keputusan karena data yang tidak sinkron antar departemen.\n\nSetelah implementasi sistem ERP yang kami bantu rancang dan pilihkan, proses rekonsiliasi selesai dalam 2 hari. Keputusan bisnis jadi lebih cepat dan akurat.\n\nTeknologi yang tepat bukan hanya mengubah cara kerja — ia mengubah kecepatan tumbuh bisnis.\n\n-\n\n📌 Siap transformasi digital? Mulai dari konsultasi gratis bersama Rely Consulting Group.\n📱 @relycg`,
      },
    },
  },
  bisnis: {
    default: {
      hook: {
        headline: "Startup yang Gagal Bukan Karena Ide yang Buruk",
        subheadline: "Tapi karena eksekusi yang tidak terstruktur dan skalabilitas yang tidak direncanakan.",
      },
      middle: [
        {
          headline: "Validasi Ide Sebelum Membangun Produk",
          subheadline: "Jangan habiskan 6 bulan membangun sesuatu yang tidak dibutuhkan pasar.",
          isi: "Customer discovery, wawancara pengguna, dan MVP sederhana adalah cara terbaik memvalidasi asumsi bisnis sebelum investasi besar. Data lebih berharga dari asumsi pendiri.",
          closing: "Produk terbaik lahir dari pemahaman terdalam tentang masalah pelanggan.",
        },
        {
          headline: "Unit Economics: Fondasi Bisnis yang Berkelanjutan",
          subheadline: "CAC, LTV, dan payback period adalah metrik yang harus dipahami setiap pendiri.",
          isi: "Customer Acquisition Cost (CAC) harus lebih rendah dari Lifetime Value (LTV). Jika rasio LTV:CAC di bawah 3:1, model bisnis Anda perlu dievaluasi sebelum melakukan scaling.",
          closing: "Bisnis yang sehat tumbuh karena unit economics yang kuat, bukan karena modal besar.",
        },
        {
          headline: "Fundraising: Kapan Waktu yang Tepat?",
          subheadline: "Mencari investor terlalu awal atau terlalu terlambat sama-sama berisiko.",
          isi: "Idealnya, fundraising dilakukan ketika ada product-market fit yang jelas dan traksi yang dapat diverifikasi. Investor tidak hanya membawa uang — pilih yang juga membawa nilai strategis.",
          closing: "Uang investor bukan tujuan — ini bahan bakar untuk menjalankan mesin yang sudah terbukti.",
        },
        {
          headline: "Membangun Tim yang Tepat untuk Scale Up",
          subheadline: "Di tahap awal, karakter dan adaptabilitas lebih penting dari CV.",
          isi: "Startup butuh generalis yang bisa bergerak cepat. Tapi saat scaling, Anda butuh spesialis dengan keahlian mendalam. Ketahui kapan harus melakukan transisi ini.",
          closing: "Bisnis tidak tumbuh lebih cepat dari kapasitas timnya.",
        },
        {
          headline: "Go-to-Market Strategy: Jangan Tembak ke Semua Arah",
          subheadline: "Fokus pada satu segmen, kuasai, lalu ekspansi.",
          isi: "Tentukan beachhead market — segmen paling spesifik yang paling mungkin adopsi produk Anda lebih awal. Kuasai segmen ini terlebih dahulu sebelum memperluas jangkauan.",
          closing: "Merek yang kuat dibangun dari komunitas kecil yang loyal, bukan audiens besar yang acuh.",
        },
        {
          headline: "KPI yang Salah Bisa Menenggelamkan Bisnis",
          subheadline: "Banyak startup fokus pada vanity metrics — download, follower — bukan pada real traction.",
          isi: "Metrik yang benar-benar penting: revenue, retention rate, churn, dan NPS. Angka-angka ini mencerminkan kesehatan bisnis yang sesungguhnya.",
          closing: "Ukur apa yang penting, bukan apa yang mudah diukur.",
        },
        {
          headline: "Exit Strategy: Pikirkan dari Hari Pertama",
          subheadline: "Apakah tujuan Anda IPO, akuisisi, atau bootstrapped cashflow?",
          isi: "Memiliki exit strategy yang jelas mempengaruhi setiap keputusan bisnis — dari struktur kepemilikan, pilihan investor, hingga strategi pertumbuhan. Ini bukan tentang menyerah, ini tentang arah.",
          closing: "Pendiri terbaik membangun untuk masa depan — bahkan masa depan tanpa mereka.",
        },
      ],
      penutup: {
        headline: "Bisnis yang Bertahan Adalah yang Terus Belajar dan Beradaptasi",
        subheadline: "Bukan yang paling cerdas — tapi yang paling responsif terhadap perubahan.",
        isi: "Pasar berubah, teknologi berubah, perilaku konsumen berubah. Pendiri yang berhasil adalah yang membangun organisasi dengan kemampuan adaptasi sebagai kompetensi inti.",
      },
      cta: "Konsultasikan strategi bisnis dan pengembangan usaha Anda bersama tim konsultan bisnis Rely Consulting Group.",
      hashtags: ["#RelyConsulting", "#StartupIndonesia", "#StrategiBisnis", "#ScaleUp", "#BisnisBerkembang", "#Entrepreneurship", "#GrowthStrategy"],
      captions: {
        formal: `Apa yang membedakan startup yang bertahan dengan yang tidak? 🚀\n\nSeringkali bukan soal ide yang lebih brilian atau modal yang lebih besar. Yang membedakan adalah kemampuan pendiri untuk mengeksekusi dengan fokus, membangun tim yang tepat, dan membuat keputusan berbasis data — bukan asumsi.\n\nBisnis yang tumbuh secara berkelanjutan adalah yang memiliki unit economics sehat, strategi go-to-market yang jelas, dan kultur organisasi yang adaptif.\n\nKarena pada akhirnya, bisnis terbaik bukan yang paling cepat sprint — tapi yang paling kuat berlari jarak jauh.\n\n-\n\n📌 Konsultasikan strategi pengembangan bisnis Anda bersama Rely Consulting Group\n📱 @relycg`,
        santai: `Ngomongin bisnis nih — kamu udah tau belum bedanya startup yang sukses dan yang gagal? 🤔\n\nSering banget ternyata bukan soal idenya. Idenya bisa sama, tapi eksekusinya yang beda.\n\nYang sukses biasanya punya: validasi pasar yang kuat, tim yang solid, dan metrik yang jelas. Yang gagal? Kadang terlalu asyik bangun fitur tapi lupa tanya ke pelanggan dulu.\n\nSimple tapi sering dilupain! 💡\n\n-\n\n📌 Mau diskusi strategi bisnis? Hubungi Rely Consulting Group\n📱 @relycg`,
        storytelling: `Dua founder bertemu di co-working space yang sama. Produk mereka mirip, target pasar sama, modal awal hampir identik. 🤝\n\nSetahun kemudian, satu sudah Series A. Yang lain tutup.\n\nApa bedanya? Yang berhasil menghabiskan 3 bulan pertama berbicara dengan 100 calon pelanggan sebelum menulis satu baris kode. Yang gagal langsung membangun produk selama 6 bulan berdasarkan asumsi sendiri.\n\nValidasi bukan kelemahan. Itu adalah strategi terkuat yang sering diremehkan.\n\n-\n\n📌 Mulai perjalanan bisnis Anda dengan fondasi yang kuat bersama Rely Consulting Group.\n📱 @relycg`,
      },
    },
  },
  keuangan: {
    default: {
      hook: {
        headline: "Bisnis Anda Untung, Tapi Mengapa Kas Selalu Menipis?",
        subheadline: "Karena profit di atas kertas tidak sama dengan uang di rekening.",
      },
      middle: [
        {
          headline: "Cash Flow vs Profit: Perbedaan yang Wajib Dipahami",
          subheadline: "Banyak bisnis profitable yang bangkrut karena masalah arus kas.",
          isi: "Profit adalah selisih pendapatan dan biaya. Cash flow adalah uang yang benar-benar masuk dan keluar. Bisnis yang penjualannya kredit sering mengalami profit tinggi tapi kas kosong.",
          closing: "Cash is king — terutama di tahun-tahun pertama pertumbuhan bisnis.",
        },
        {
          headline: "Laporan Keuangan Dasar yang Harus Anda Pahami",
          subheadline: "Neraca, Laporan Laba Rugi, dan Laporan Arus Kas adalah trio wajib.",
          isi: "Neraca menunjukkan aset, kewajiban, dan ekuitas pada satu titik waktu. P&L menunjukkan performa dalam periode tertentu. Cash flow statement menunjukkan pergerakan kas aktual.",
          closing: "Pendiri bisnis yang memahami laporan keuangan membuat keputusan 10x lebih baik.",
        },
        {
          headline: "Manajemen Piutang: Jangan Biarkan Uang Mengendap di Luar",
          subheadline: "Piutang yang tidak dikelola adalah aset yang perlahan menjadi beban.",
          isi: "Tetapkan credit term yang jelas, kirim invoice tepat waktu, dan miliki proses follow-up yang konsisten. DSO (Days Sales Outstanding) di atas 60 hari perlu segera dievaluasi.",
          closing: "Piutang yang sehat adalah cermin disiplin bisnis.",
        },
        {
          headline: "Struktur Modal yang Optimal untuk Pertumbuhan",
          subheadline: "Berapa porsi ideal antara modal sendiri dan utang?",
          isi: "Debt-to-equity ratio yang terlalu tinggi meningkatkan risiko finansial. Terlalu rendah bisa berarti Anda melewatkan leverage yang menguntungkan. Setiap industri memiliki benchmark yang berbeda.",
          closing: "Struktur modal yang tepat mengakselerasi pertumbuhan tanpa membebani.",
        },
        {
          headline: "Break-Even Analysis: Tau Kapan Bisnis Mulai Untung",
          subheadline: "Setiap pemilik bisnis harus tahu titik impasnya.",
          isi: "BEP dihitung dari fixed cost dibagi contribution margin per unit. Ini membantu menentukan target penjualan minimum dan mengevaluasi apakah harga jual sudah realistis.",
          closing: "Bisnis tanpa BEP yang jelas adalah bisnis yang berlayar tanpa peta.",
        },
        {
          headline: "Working Capital Management: Seni Mengelola Modal Kerja",
          subheadline: "Terlalu banyak stock = modal mengendap. Terlalu sedikit = kehilangan penjualan.",
          isi: "Optimalkan inventory turnover, kelola utang dagang dengan bijak, dan pastikan siklus konversi kas (CCC) seefisien mungkin. Working capital yang sehat adalah tanda bisnis operasional yang matang.",
          closing: "Modal kerja yang efisien adalah fondasi pertumbuhan yang berkelanjutan.",
        },
        {
          headline: "Kapan Harus Menyewa CFO Eksternal?",
          subheadline: "Tidak semua perusahaan butuh CFO full-time — tapi semua butuh keahlian CFO.",
          isi: "Fractional CFO memberikan expertise keuangan strategis tanpa biaya gaji eksekutif penuh waktu. Ini ideal untuk UMKM dan startup yang butuh panduan keuangan serius tanpa overhead besar.",
          closing: "Keputusan keuangan yang baik tidak harus mahal untuk didapat.",
        },
      ],
      penutup: {
        headline: "Keuangan yang Sehat Adalah Fondasi Bisnis yang Tumbuh",
        subheadline: "Mulai dari pemahaman dasar, bangun sistem, dan konsultasikan yang kompleks.",
        isi: "Banyak masalah keuangan bisnis sebenarnya bisa dicegah dengan sistem yang tepat dan pemahaman yang baik. Investasikan waktu untuk memahami keuangan bisnis Anda — atau percayakan pada ahlinya.",
      },
      cta: "Konsultasikan kesehatan keuangan dan strategi finansial bisnis Anda bersama tim akuntan dan konsultan keuangan Rely Consulting Group.",
      hashtags: ["#RelyConsulting", "#ManajemenKeuangan", "#CashFlow", "#LaporanKeuangan", "#KeuanganBisnis", "#AkuntansiUMKM", "#FinancialHealth"],
      captions: {
        formal: `Apakah Anda tahu persis kondisi keuangan bisnis Anda saat ini? 📊\n\nBanyak pemilik bisnis yang lebih fokus pada omzet daripada memahami laporan keuangan secara menyeluruh. Padahal, keputusan bisnis terbaik lahir dari pemahaman mendalam tentang arus kas, struktur biaya, dan profitabilitas per lini produk.\n\nBisnis yang tumbuh sehat selalu ditopang oleh sistem keuangan yang tertib, laporan yang akurat, dan analisis yang tepat waktu.\n\nKarena angka tidak berbohong — selama Anda tahu cara membacanya.\n\n-\n\n📌 Konsultasikan kesehatan keuangan bisnis Anda bersama Rely Consulting Group\n📱 @relycg`,
        santai: `Bisnis udah untung tapi kok dompet tetap tipis? 😅\n\nIni masalah klasik yang sering dialami UMKM: profit bagus di pembukuan, tapi cash-nya nggak ada karena piutang numpuk atau stok ketahan.\n\nSolusinya? Bukan kerja lebih keras — tapi kelola arus kas lebih cerdas. Mulai dari bikin proyeksi cash flow, beresin piutang, sampai optimalkan inventory.\n\nKalau bingung mulai dari mana, yuk konsultasi! ✅\n\n-\n\n📌 Hubungi Rely Consulting Group untuk solusi keuangan bisnis Anda\n📱 @relycg`,
        storytelling: `Klien kami memiliki restoran yang selalu ramai. Revenue bulanannya fantastis. Tapi di akhir bulan, mereka selalu pusing bayar gaji. 😰\n\nSetelah kami analisis, masalahnya bukan di penjualan — tapi di cash cycle. Bahan baku dibeli tunai, tapi banyak event yang bayarnya 30-45 hari kemudian. Ditambah stok yang terlalu besar untuk antisipasi.\n\nDengan restructuring arus kas sederhana dan negosiasi ulang dengan supplier, situasinya berubah dalam 2 bulan.\n\nProfit bagus tapi kas kosong — ini bisa diselesaikan. Asal tahu caranya.\n\n-\n\n📌 Mau audit arus kas bisnis Anda? Rely Consulting Group siap membantu.\n📱 @relycg`,
      },
    },
  },
  umkm: {
    default: {
      hook: {
        headline: "UMKM Indonesia Punya Potensi Besar — Tapi Banyak yang Terhenti di Jalan",
        subheadline: "Bukan karena kurang kerja keras, tapi karena kurang sistem.",
      },
      middle: [
        {
          headline: "Kenapa UMKM Sulit Naik Kelas?",
          subheadline: "Ada 5 hambatan utama yang dialami hampir semua UMKM Indonesia.",
          isi: "Akses modal terbatas, pencatatan keuangan yang tidak teratur, ketergantungan pada pemilik, kurangnya strategi digital, dan minimnya pemahaman hukum bisnis — kelima hal ini saling terkait.",
          closing: "Mengenali hambatan adalah langkah pertama untuk melewatinya.",
        },
        {
          headline: "Digitalisasi UMKM: Dari WhatsApp ke Ekosistem Digital",
          subheadline: "Media sosial adalah gerbang, bukan tujuan akhir.",
          isi: "Mulai dari Google Business Profile, marketplace, dan media sosial. Lanjutkan dengan website, sistem kasir digital, dan CRM sederhana. Digitalisasi yang bertahap lebih berkelanjutan dari transformasi besar sekaligus.",
          closing: "Setiap langkah kecil menuju digital adalah langkah maju menuju pertumbuhan.",
        },
        {
          headline: "Akses KUR dan Pembiayaan UMKM 2026",
          subheadline: "Kredit Usaha Rakyat hadir untuk mendukung pertumbuhan UMKM.",
          isi: "KUR 2026 menawarkan bunga 6% per tahun dengan plafon hingga Rp 500 juta. Syaratnya: usaha berjalan minimal 6 bulan, memiliki legalitas dasar, dan pembukuan yang dapat diverifikasi.",
          closing: "Modal bukan penghalang — akses yang tepat adalah kuncinya.",
        },
        {
          headline: "Branding UMKM: Tampil Profesional Tidak Harus Mahal",
          subheadline: "Konsistensi visual dan pesan adalah fondasi brand yang kuat.",
          isi: "Logo yang bersih, palet warna yang konsisten, dan tone komunikasi yang jelas bisa dibangun dengan anggaran minimal. Yang paling penting adalah konsistensi — tampil sama di semua platform.",
          closing: "Brand yang kuat bukan milik perusahaan besar — ini tentang kepercayaan.",
        },
        {
          headline: "Pembukuan Sederhana yang Wajib Dilakukan UMKM",
          subheadline: "Tidak perlu software mahal untuk mulai mencatat keuangan dengan benar.",
          isi: "Minimal catat setiap pemasukan dan pengeluaran harian. Pisahkan rekening bisnis dan pribadi. Rekap mingguan dan bulanan. Ini cukup untuk mulai memahami kesehatan keuangan usaha Anda.",
          closing: "Pembukuan yang rapi adalah syarat pertama untuk naik ke level berikutnya.",
        },
        {
          headline: "Ekspansi UMKM: Kapan Saatnya Buka Cabang?",
          subheadline: "Ekspansi terlalu cepat adalah salah satu penyebab utama UMKM bangkrut.",
          isi: "Buka cabang hanya jika unit pertama sudah profitable dengan sistem yang bisa direplikasi tanpa kehadiran langsung pemilik. Standarisasi proses sebelum ekspansi adalah wajib hukumnya.",
          closing: "Tumbuh dengan cepat itu baik. Tumbuh dengan kuat itu lebih baik.",
        },
        {
          headline: "Komunitas dan Kolaborasi: Kekuatan UMKM yang Sering Dilupakan",
          subheadline: "Bergabung dengan ekosistem yang tepat bisa mengakselerasi pertumbuhan.",
          isi: "Asosiasi industri, komunitas pengusaha, dan program inkubator memberikan akses ke mentor, jaringan, dan peluang yang tidak bisa didapat sendirian. Networking adalah investasi jangka panjang.",
          closing: "Pengusaha yang tumbuh cepat seldom berjalan sendiri.",
        },
      ],
      penutup: {
        headline: "UMKM yang Siap Naik Kelas Butuh Lebih dari Semangat",
        subheadline: "Butuh sistem, strategi, dan dukungan yang tepat.",
        isi: "Dengan pendampingan yang benar — dari sisi legal, keuangan, digital, dan bisnis — UMKM Indonesia punya semua modal untuk bersaing di tingkat yang lebih tinggi.",
      },
      cta: "Konsultasikan strategi pengembangan UMKM Anda bersama Rely Consulting Group — kami hadir untuk mendampingi bisnis Anda naik kelas.",
      hashtags: ["#RelyConsulting", "#UMKM", "#UMKMNaikKelas", "#BisnisMikro", "#DigitalisasiUMKM", "#KURBank", "#PengembanganUMKM"],
      captions: {
        formal: `UMKM adalah tulang punggung ekonomi Indonesia — menyumbang lebih dari 60% PDB dan menyerap mayoritas tenaga kerja nasional. 🇮🇩\n\nNamun, banyak pelaku UMKM yang terhenti di level yang sama selama bertahun-tahun. Bukan karena kurang kerja keras, melainkan karena kurang akses ke pengetahuan dan sistem yang tepat.\n\nDengan dukungan di bidang legalitas, keuangan, pemasaran digital, dan strategi bisnis, UMKM Indonesia sesungguhnya mampu bersaing di pasar yang lebih luas — bahkan global.\n\nKarena potensi itu sudah ada. Yang dibutuhkan adalah arah yang tepat.\n\n-\n\n📌 Konsultasikan pengembangan UMKM Anda bersama Rely Consulting Group\n📱 @relycg`,
        santai: `Halo para pejuang UMKM! 👋\n\nNgaku deh, siapa yang masih pusing soal laporan keuangan, urusan pajak, atau bingung mau expand tapi takut? 😅\n\nTenang, semua itu normal dan bisa diatasi! Yang penting mulai dari satu langkah: beresin dulu yang paling urgent.\n\nKalau bingung mulai dari mana — yuk ngobrol sama kami. Gratis konsultasi pertamanya! ☕\n\n-\n\n📌 DM Rely Consulting Group sekarang\n📱 @relycg`,
        storytelling: `Bu Rini punya usaha katering rumahan yang sudah 5 tahun berjalan. Masakannya enak, pelanggannya setia. Tapi setiap akhir tahun, penghasilannya habis tanpa sisa. 😔\n\nSetelah ngobrol dengan tim kami, ketahuan masalahnya: tidak ada pemisahan keuangan pribadi dan bisnis. Tidak ada pencatatan yang tertib. Dan belum ada legalitas yang bisa jadi syarat pinjaman untuk expand.\n\nTiga bulan kemudian, usaha Bu Rini sudah berbadan hukum, punya rekening bisnis, dan berhasil akses KUR untuk upgrade peralatan.\n\nCeritanya belum selesai — tapi arahnya sudah jelas.\n\n-\n\n📌 Mari kami bantu bisnis Anda seperti kami membantu Bu Rini. Hubungi Rely Consulting Group.\n📱 @relycg`,
      },
    },
  },
  motivasi: {
    default: {
      hook: {
        headline: "Semua Pengusaha Sukses Pernah Berada di Titik di Mana Mereka Hampir Menyerah",
        subheadline: "Yang membedakan mereka adalah keputusan untuk terus melangkah.",
      },
      middle: [
        {
          headline: "Gagal Bukan Akhir — Ini Data",
          subheadline: "Setiap kegagalan memberikan informasi yang tidak bisa dibeli.",
          isi: "Thomas Edison gagal ribuan kali sebelum menemukan bola lampu. Jeff Bezos meluncurkan banyak produk yang gagal sebelum Amazon menjadi raksasa. Kegagalan yang dimaknai dengan benar adalah akselerator pertumbuhan.",
          closing: "Pertanyaannya bukan apakah Anda akan gagal — tapi apakah Anda akan belajar.",
        },
        {
          headline: "Konsistensi Mengalahkan Intensitas",
          subheadline: "Satu jam setiap hari lebih kuat dari maraton seminggu sekali.",
          isi: "Bisnis dibangun dari kebiasaan kecil yang konsisten: review keuangan mingguan, follow-up klien rutin, dan perbaikan proses yang terus-menerus. Intensitas tanpa konsistensi menghasilkan fluktuasi, bukan pertumbuhan.",
          closing: "Berapa kecilpun langkahnya, yang penting tidak berhenti.",
        },
        {
          headline: "Fokus pada Proses, Bukan Hasil",
          subheadline: "Hasil yang luar biasa adalah produk dari proses yang disiplin.",
          isi: "Alih-alih obsesi dengan target revenue, fokus pada kegiatan harian yang menggerakkan bisnis ke arah yang benar: prospek baru, produk yang lebih baik, tim yang lebih solid.",
          closing: "Rawat prosesnya — hasilnya akan merawat dirinya sendiri.",
        },
        {
          headline: "Keberanian Mengambil Keputusan",
          subheadline: "Ketidakpastian tidak akan hilang — tapi keberanian bisa diasah.",
          isi: "Pemimpin bisnis yang sukses tidak menunggu informasi sempurna sebelum memutuskan. Mereka memutuskan dengan informasi terbaik yang tersedia, lalu menyesuaikan saat perjalanan.",
          closing: "Keputusan yang salah yang bisa diperbaiki lebih baik dari tidak memutuskan sama sekali.",
        },
        {
          headline: "Lingkungan Menentukan Pertumbuhan",
          subheadline: "Anda adalah rata-rata dari 5 orang yang paling sering Anda temui.",
          isi: "Bergabunglah dengan komunitas pengusaha, cari mentor yang pernah melewati jalan yang ingin Anda tempuh, dan evaluasi apakah lingkungan sekitar mendukung atau menghambat ambisi Anda.",
          closing: "Investasi pada komunitas yang tepat adalah salah satu ROI terbaik dalam bisnis.",
        },
        {
          headline: "Rest adalah Strategi, Bukan Kelemahan",
          subheadline: "Burnout bukan tanda dedikasi — ini tanda manajemen energi yang buruk.",
          isi: "Pebisnis terbaik memahami bahwa keberlanjutan fisik dan mental adalah prasyarat keberlanjutan bisnis. Jadwal istirahat dan pemulihan sama pentingnya dengan jadwal rapat.",
          closing: "Bisnis Anda membutuhkan Anda dalam kondisi terbaik — bukan kondisi yang tersisa.",
        },
        {
          headline: "Bersyukur sebagai Strategi Bisnis",
          subheadline: "Gratitude bukan hanya soal perasaan — ini mempengaruhi keputusan dan kepemimpinan.",
          isi: "Penelitian menunjukkan bahwa pemimpin yang rutin mempraktikkan rasa syukur membuat keputusan lebih baik, memiliki tim yang lebih loyal, dan mengalami burnout yang lebih rendah.",
          closing: "Mulai setiap hari dengan mengakui apa yang sudah berhasil — sebelum fokus pada apa yang belum.",
        },
      ],
      penutup: {
        headline: "Perjalanan Bisnis Adalah Maraton, Bukan Sprint",
        subheadline: "Yang tiba di garis finish adalah yang berlari dengan cerdas, bukan sekadar yang berlari paling kencang.",
        isi: "Investasikan pada diri sendiri, tim, dan sistem — bukan hanya pada produk dan marketing. Bisnis yang kuat dibangun dari dalam.",
      },
      cta: "Rely Consulting Group hadir sebagai mitra strategis perjalanan bisnis Anda — dari fondasi hukum, keuangan, hingga transformasi digital.",
      hashtags: ["#RelyConsulting", "#MotivasiBisnis", "#Entrepreneurship", "#BisnisMindset", "#GrowthMindset", "#PengusahaMuda", "#InspirasiHariIni"],
      captions: {
        formal: `Perjalanan membangun bisnis tidak selalu linear. Ada saat di mana langkah maju terasa berat, keputusan sulit untuk diambil, dan hasil yang diharapkan belum terlihat. 🌟\n\nNamun itulah yang membedakan pebisnis yang bertahan dari yang tidak. Bukan soal berapa kali mereka jatuh — tapi seberapa cepat mereka bangkit dengan pelajaran baru.\n\nBisnis terbaik dibangun di atas fondasi ketangguhan: kemampuan untuk terus berjalan bahkan saat kondisi tidak ideal, dan terus belajar bahkan dari kegagalan terbesar.\n\nKarena pada akhirnya, bisnis Anda adalah cerminan dari siapa Anda sebagai pemimpin.\n\n-\n\n📌 Rely Consulting Group siap mendampingi perjalanan bisnis Anda\n📱 @relycg`,
        santai: `Jujur deh — pernah nggak ngerasa pengen nyerah sama bisnis sendiri? 😔\n\nKalau pernah, you're in good company. Hampir semua pengusaha sukses pernah ada di titik itu.\n\nBedanya, mereka milih untuk terus. Bukan karena nggak takut — tapi karena tau bahwa justru di titik itulah pertumbuhan paling besar terjadi.\n\nYuk, terusin perjuangannya! Kamu nggak sendirian. 💪\n\n-\n\n📌 Rely Consulting Group — mitra bisnis perjalanan Anda\n📱 @relycg`,
        storytelling: `2018. Sebuah startup teknologi di Jakarta hampir bangkrut. Investor mundur, co-founder resign, dan runway tinggal 3 bulan. 📉\n\nPendirinya hampir menyerah. Tapi dia memutuskan untuk melakukan satu hal terakhir: kembali ngobrol langsung dengan 20 pelanggan paling loyalnya.\n\nDari percakapan itu, dia menemukan satu kebutuhan yang belum terpenuhi. Pivot kecil dilakukan. Tiga bulan kemudian, revenue naik 3x.\n\nPerusahaan itu hari ini melayani ratusan klien korporat di Asia Tenggara.\n\nCerita ini bukan tentang keajaiban. Ini tentang tetap bergerak saat semua tanda mengatakan berhenti.\n\n-\n\n📌 Rely Consulting Group — hadir di setiap fase perjalanan bisnis Anda.\n📱 @relycg`,
      },
    },
  },
  general: {
    default: {
      hook: {
        headline: "Konsultasi Profesional Bukan Pengeluaran — Ini Investasi dengan ROI Tertinggi",
        subheadline: "Keputusan bisnis yang tepat, ditopang oleh keahlian yang tepat.",
      },
      middle: [
        {
          headline: "Mengapa Bisnis Butuh Konsultan Profesional?",
          subheadline: "Blind spot pemilik bisnis adalah risiko terbesar yang sering tidak disadari.",
          isi: "Konsultan profesional membawa perspektif eksternal, keahlian spesifik, dan pengalaman dari banyak kasus serupa. Mereka membantu Anda melihat apa yang tidak terlihat dari dalam.",
          closing: "Semua atlet kelas dunia punya pelatih — begitu pula bisnis kelas dunia.",
        },
        {
          headline: "Rely Consulting Group: Solusi Terintegrasi untuk Bisnis Anda",
          subheadline: "Hukum, Pajak, Keuangan, dan IT dalam satu atap konsultasi.",
          isi: "Berbeda dari konsultan sektoral yang fokus pada satu bidang, Rely Consulting Group menawarkan pendampingan komprehensif. Masalah bisnis sering kali lintas bidang — solusinya pun harus terintegrasi.",
          closing: "Satu pintu konsultasi untuk semua kebutuhan bisnis Anda.",
        },
        {
          headline: "Tanda Bisnis Anda Butuh Konsultasi Sekarang",
          subheadline: "Beberapa sinyal yang sering diabaikan hingga terlambat.",
          isi: "Pertumbuhan stagnan selama 2+ tahun, arus kas selalu negatif meski omzet baik, tim tidak bisa bekerja tanpa pengawasan pemilik, atau struktur legal yang tidak jelas — ini semua tanda yang perlu segera ditangani.",
          closing: "Lebih baik diagnosis dini dari konsultan daripada operasi darurat di kemudian hari.",
        },
        {
          headline: "Proses Konsultasi Bisnis: Apa yang Sebenarnya Terjadi?",
          subheadline: "Konsultasi yang baik dimulai dari pemahaman mendalam, bukan solusi cepat.",
          isi: "Fase pertama adalah discovery: memahami kondisi bisnis saat ini secara menyeluruh. Fase kedua adalah analisis dan rekomendasi. Fase ketiga adalah implementasi dan monitoring. Setiap fase sama pentingnya.",
          closing: "Konsultan yang baik tidak menjual jawaban — mereka membantu Anda menemukan solusi yang tepat.",
        },
        {
          headline: "Memilih Konsultan: 5 Kriteria Penting",
          subheadline: "Tidak semua konsultan cocok untuk semua bisnis.",
          isi: "Evaluasi berdasarkan: rekam jejak di industri Anda, metodologi kerja yang terstruktur, transparansi biaya, ketersediaan komunikasi, dan kemampuan memberikan referensi klien terdahulu.",
          closing: "Konsultan yang tepat adalah mitra jangka panjang, bukan vendor jasa.",
        },
        {
          headline: "ROI Konsultasi: Cara Mengukur Nilai Nyata",
          subheadline: "Investasi konsultasi harus bisa diukur hasilnya.",
          isi: "Ukur dampak dari sisi penghematan pajak, efisiensi operasional, pengurangan risiko hukum, dan percepatan pertumbuhan. Konsultasi yang baik menghasilkan nilai yang jauh melampaui biayanya.",
          closing: "Biaya konsultasi terbaik adalah yang menghasilkan 10x lebih banyak dari yang dikeluarkan.",
        },
        {
          headline: "Kolaborasi Jangka Panjang: Lebih dari Sekadar Proyek",
          subheadline: "Bisnis terbaik memiliki konsultan yang memahami perjalanan mereka.",
          isi: "Konsultan yang menjadi mitra jangka panjang memiliki konteks mendalam tentang bisnis Anda. Mereka bisa memberikan saran yang lebih relevan dan proaktif — bukan hanya reaktif saat masalah muncul.",
          closing: "Investasi terbaik dalam konsultasi adalah membangun hubungan jangka panjang.",
        },
      ],
      penutup: {
        headline: "Bisnis Anda Terlalu Penting untuk Dijalankan Tanpa Dukungan yang Tepat",
        subheadline: "Di sinilah Rely Consulting Group hadir.",
        isi: "Dengan tim multidisiplin yang berpengalaman di bidang hukum, perpajakan, keuangan, dan teknologi informasi, kami siap menjadi mitra strategis perjalanan bisnis Anda.",
      },
      cta: "Jadwalkan konsultasi awal bersama Rely Consulting Group hari ini — dan mulai perjalanan bisnis yang lebih terstruktur, lebih aman, dan lebih menguntungkan.",
      hashtags: ["#RelyConsulting", "#KonsultasiBisnis", "#BisnisBerkembang", "#RelyConsultingGroup", "#MitraBisnis", "#SolusiTerintegrasi", "#ProfesionalBisnis"],
      captions: {
        formal: `Setiap bisnis yang ingin tumbuh secara berkelanjutan membutuhkan lebih dari sekadar kerja keras dan produk yang baik. 🏢\n\nDibutuhkan fondasi hukum yang kuat, pengelolaan keuangan yang sehat, kepatuhan pajak yang tepat, dan infrastruktur digital yang mendukung operasional.\n\nItulah yang kami bantu wujudkan di Rely Consulting Group — dengan pendekatan konsultasi yang terintegrasi dan solusi yang dirancang khusus untuk kebutuhan bisnis Anda.\n\nKarena bisnis terbaik tidak dibangun sendirian.\n\n-\n\n📌 Hubungi Rely Consulting Group untuk konsultasi awal\n📱 @relycg`,
        santai: `Nggak perlu pusing sendirian ngurusin semua aspek bisnis! 😅\n\nDari urusan legal, pajak, keuangan, sampai IT — ada Rely Consulting Group yang bisa bantu. Satu tempat, semua solusi.\n\nYuk mulai dengan ngobrol dulu, gratis! Siapa tau ada yang bisa langsung kita bantu beresin. 💪\n\n-\n\n📌 DM atau kunjungi @relycg sekarang\n📱 @relycg`,
        storytelling: `Ada klien yang datang ke kami dengan satu masalah: pajaknya sering kena sanksi. 📋\n\nTapi setelah kami dalami, ternyata ada tiga masalah yang saling berkaitan: pembukuan tidak rapi, struktur badan usaha tidak optimal, dan sistem IT-nya tidak terintegrasi dengan akuntansi.\n\nKalau kami hanya menyelesaikan masalah pajak saja, dua masalah lain akan terus menggerogoti bisnis mereka.\n\nItulah mengapa kami percaya pada konsultasi yang terintegrasi — karena masalah bisnis nyata jarang datang sendirian.\n\n-\n\n📌 Rely Consulting Group — solusi bisnis yang saling terhubung.\n📱 @relycg`,
      },
    },
  },
};

// ─── Reels Script Templates ───────────────────────────────────────────────────

interface ReelsTemplate {
  judul: string;
  kategori: string;
  hook: string;
  scenes: string[];
  closing: string;
  cta: string;
}

const REELS_DB: Record<ContentCategory, Record<string, { formal: ReelsTemplate; santai: ReelsTemplate; storytelling: ReelsTemplate }>> = {
  legal: {
    default: {
      formal: {
        judul: "Kontrak Bisnis yang Lemah Bisa Merugikan Anda",
        kategori: "Edukasi Hukum",
        hook: "Kontrak sudah ditandatangani. Tapi ternyata isinya merugikan bisnis Anda.",
        scenes: [
          "Banyak pelaku usaha menganggap kontrak hanya formalitas administratif.",
          "Padahal, setiap kalimat dalam kontrak memiliki konsekuensi hukum yang nyata.",
          "Klausul ganti rugi yang ambigu.",
          "Tidak ada mekanisme penyelesaian sengketa yang jelas.",
          "Hak terminasi yang menguntungkan satu pihak.",
          "Semua terlihat kecil — sampai ada masalah.",
          "Sebelum tanda tangan kontrak apapun, pastikan setiap klausul sudah dipahami dan diverifikasi secara hukum.",
        ],
        closing: "Bisnis yang aman bukan yang paling beruntung, tapi yang paling siap secara hukum.",
        cta: "Konsultasikan kebutuhan legal bisnis Anda bersama Rely Consulting Group.",
      },
      santai: {
        judul: "Jangan Asal Tanda Tangan Kontrak!",
        kategori: "Tips Bisnis",
        hook: "Pernah langsung tanda tangan kontrak tanpa baca isinya dulu?",
        scenes: [
          "Tenang, kamu nggak sendirian.",
          "Banyak banget pebisnis yang ngelakuin hal yang sama.",
          "Tapi ini bisa jadi masalah serius.",
          "Karena kontrak itu bukan cuma formalitas.",
          "Satu kalimat yang salah? Bisa bikin bisnis kamu rugi besar.",
          "Makanya, sebelum tanda tangan — baca dulu. Atau minta bantuan yang ahli.",
        ],
        closing: "Nggak ada yang namanya kontrak yang 'aman diasumsikan'. Semua harus dipastikan.",
        cta: "Mau kontrak bisnis kamu dicek dulu? Hubungi Rely Consulting Group.",
      },
      storytelling: {
        judul: "Satu Kalimat yang Nyaris Menghancurkan Bisnis Saya",
        kategori: "Kisah Nyata",
        hook: "Ada klien kami yang hampir kehilangan bisnis gara-gara satu kalimat dalam kontrak.",
        scenes: [
          "Dia baru saja menandatangani perjanjian kerja sama dengan mitra besar.",
          "Tanpa membaca klausul yang mengatur hak terminasi.",
          "Enam bulan kemudian, mitra itu mengakhiri kerja sama.",
          "Dan berdasarkan kontrak — mereka berhak melakukannya tanpa ganti rugi apapun.",
          "Bisnis yang sudah dibangun setahun, tiba-tiba kehilangan mitra utamanya.",
          "Kejadian ini sebenarnya bisa dicegah.",
          "Dengan satu langkah sederhana: minta ahli hukum baca kontraknya sebelum tanda tangan.",
        ],
        closing: "Pelajaran paling mahal bisa dihindari dengan konsultasi yang tepat.",
        cta: "Rely Consulting Group siap mendampingi setiap proses legal bisnis Anda.",
      },
    },
  },
  pajak: {
    default: {
      formal: {
        judul: "Optimasi Pajak yang Legal dan Efektif",
        kategori: "Edukasi Pajak",
        hook: "Tahukah Anda bahwa sebagian besar wajib pajak membayar lebih dari yang seharusnya?",
        scenes: [
          "Bukan karena tidak patuh.",
          "Tapi karena tidak mengetahui insentif dan fasilitas pajak yang tersedia.",
          "PPh Final 0,5% untuk UMKM.",
          "Fasilitas pengurangan pajak untuk industri tertentu.",
          "Tax holiday untuk investasi di sektor prioritas.",
          "Semua ini legal dan tersedia — tapi jarang dimanfaatkan secara optimal.",
          "Perencanaan pajak yang tepat bukan tentang menghindari kewajiban, tapi memahami hak Anda.",
        ],
        closing: "Efisiensi pajak yang legal adalah bagian dari manajemen bisnis yang cerdas.",
        cta: "Konsultasikan perencanaan pajak bisnis Anda bersama konsultan pajak bersertifikat Rely Consulting Group.",
      },
      santai: {
        judul: "Bayar Pajak Lebih Sedikit? Bisa, dan Legal!",
        kategori: "Tips Pajak",
        hook: "Siapa bilang nggak bisa bayar pajak lebih sedikit secara legal?",
        scenes: [
          "Ada yang namanya tax planning.",
          "Dan itu bukan penggelapan pajak ya.",
          "Ini soal memanfaatkan aturan yang memang sudah disediakan pemerintah.",
          "Misalnya, kalau kamu UMKM, ada PPh Final cuma 0,5% dari omzet.",
          "Atau ada berbagai insentif yang bisa diklaim tapi sering nggak diketahui.",
          "Yang rugi siapa kalau kamu nggak tau soal ini?",
          "Kamu sendiri.",
        ],
        closing: "Jangan bayar lebih dari yang seharusnya. Pahami hak kamu sebagai wajib pajak.",
        cta: "Yuk konsultasi sama Rely Consulting Group — gratis obrolan pertamanya!",
      },
      storytelling: {
        judul: "Kami Temukan Kelebihan Bayar Pajak Rp 80 Juta",
        kategori: "Kisah Nyata",
        hook: "Klien kami kaget saat kami bilang mereka sudah kelebihan bayar pajak selama 2 tahun.",
        scenes: [
          "Bukan karena salah hitung.",
          "Tapi karena tidak memanfaatkan fasilitas pajak yang seharusnya mereka dapatkan.",
          "Industri mereka masuk kategori yang mendapat pengurangan pajak khusus.",
          "Tapi tidak ada yang pernah memberitahu mereka.",
          "Setelah restitusi diproses, mereka berhasil mendapatkan kembali dana yang signifikan.",
          "Uang itu langsung diputar untuk ekspansi bisnis.",
          "Cerita ini bisa jadi cerita bisnis kamu juga.",
        ],
        closing: "Uang yang harusnya milik kamu, jangan dibiarkan begitu saja.",
        cta: "Rely Consulting Group siap mengaudit dan mengoptimalkan posisi pajak bisnis Anda.",
      },
    },
  },
  it: {
    default: {
      formal: {
        judul: "Transformasi Digital: Strategi, Bukan Sekadar Teknologi",
        kategori: "Edukasi IT Bisnis",
        hook: "Banyak perusahaan berinvestasi besar pada teknologi, namun tidak merasakan manfaat yang diharapkan.",
        scenes: [
          "Bukan karena teknologinya yang salah.",
          "Tapi karena strateginya yang tidak tepat.",
          "Digitalisasi tanpa pemahaman proses bisnis hanya menciptakan masalah baru yang lebih kompleks.",
          "Sistem yang tidak terintegrasi.",
          "Data yang tidak bisa dibaca lintas departemen.",
          "Tim yang tidak disiapkan untuk perubahan.",
          "Transformasi digital yang berhasil dimulai dari pemahaman mendalam tentang kebutuhan bisnis — bukan dari fitur teknologi yang paling canggih.",
        ],
        closing: "Teknologi terbaik adalah yang membuat bisnis Anda lebih efisien, bukan lebih rumit.",
        cta: "Konsultasikan roadmap transformasi digital bisnis Anda bersama Rely Consulting Group.",
      },
      santai: {
        judul: "Digitalisasi Bisnis: Mulai dari Mana?",
        kategori: "Tips Digital Bisnis",
        hook: "Pengen bisnis kamu lebih digital, tapi bingung mulai dari mana?",
        scenes: [
          "Tenang, ini pertanyaan yang banyak banget pebisnis tanyain.",
          "Dan jawabannya: nggak harus langsung semua sekaligus.",
          "Mulai dari yang paling sakit dulu.",
          "Kalau administrasi berantakan? Mulai dari sistem pencatatan digital.",
          "Kalau tim susah koordinasi? Mulai dari tools kolaborasi.",
          "Kalau penjualan mandek? Mulai dari digital marketing.",
          "Yang penting: ada langkah pertama yang jelas.",
        ],
        closing: "Digitalisasi terbaik adalah yang dimulai — bukan yang sempurna di atas kertas.",
        cta: "Butuh bantuan tentukan prioritas digitalisasi bisnis kamu? Hubungi Rely Consulting Group.",
      },
      storytelling: {
        judul: "Dari 2 Minggu ke 2 Hari: Transformasi Laporan Keuangan",
        kategori: "Kisah Nyata",
        hook: "Tim finance klien kami butuh 2 minggu setiap bulan hanya untuk rekonsiliasi data.",
        scenes: [
          "50 karyawan.",
          "5 departemen.",
          "Data yang tersebar di puluhan spreadsheet berbeda.",
          "Setiap bulan, manajer menunggu hampir 2 minggu untuk dapat laporan yang akurat.",
          "Keputusan bisnis terlambat karena data terlambat.",
          "Setelah implementasi sistem yang kami bantu rancang, proses itu selesai dalam 2 hari.",
          "Bukan karena tim mereka kerja lebih keras.",
        ],
        closing: "Tapi karena sistem yang tepat membuat kerja cerdas — bukan kerja banyak.",
        cta: "Rely Consulting Group siap membantu merancang sistem IT yang sesuai untuk bisnis Anda.",
      },
    },
  },
  bisnis: {
    default: {
      formal: {
        judul: "Mengapa Tim yang Besar Tidak Selalu Mengurangi Beban Owner",
        kategori: "Problem & Solutions",
        hook: "Tim sudah bertambah, tapi mengapa owner masih kewalahan?",
        scenes: [
          "Banyak bisnis mengira, kalau tim bertambah, beban owner otomatis berkurang.",
          "Padahal kenyataannya, semakin besar tim, justru owner makin sibuk.",
          "Kenapa?",
          "Karena masalahnya bukan di jumlah orang, tapi di sistem kerja yang belum rapi.",
          "Jobdesk belum jelas. Alur kerja belum tertata. Delegasi belum berjalan dengan baik.",
          "Akhirnya, semua tetap kembali ke owner.",
          "Jadi kalau tim sudah bertambah tapi Anda masih terlibat di hampir semua hal, mungkin yang perlu dibenahi bukan orangnya — tapi sistemnya.",
        ],
        closing: "Bisnis yang sehat bukan membuat owner semakin sibuk, tapi membuat bisnis tetap berjalan dengan lebih terstruktur.",
        cta: "Konsultasikan strategi bisnis dan sistem operasional Anda bersama Rely Consulting Group.",
      },
      santai: {
        judul: "Kenapa Makin Banyak Karyawan, Owner Makin Pusing?",
        kategori: "Tips Bisnis",
        hook: "Kamu nambah karyawan biar lebih santai, tapi malah makin puyeng?",
        scenes: [
          "Ini lebih umum dari yang kamu kira.",
          "Masalahnya bukan di orangnya.",
          "Tapi di sistem yang belum ada.",
          "Kalau jobdesk nggak jelas, semua balik ke kamu.",
          "Kalau alur kerja nggak ada, kamu yang jadi 'manual guide'-nya.",
          "Kalau delegasi nggak bisa dipercaya, kamu yang ngerjain sendiri.",
          "Solusinya bukan tambah orang lagi.",
        ],
        closing: "Solusinya: bangun sistem dulu. Baru timnya bisa jalan sendiri.",
        cta: "Mau bantu susun sistem bisnis yang lebih rapi? Ngobrol yuk sama Rely Consulting Group.",
      },
      storytelling: {
        judul: "Owner dengan 20 Karyawan yang Tetap Bekerja 14 Jam Sehari",
        kategori: "Kisah Nyata",
        hook: "Klien kami punya 20 karyawan. Tapi dia masih kerja 14 jam sehari.",
        scenes: [
          "Setiap keputusan, sekecil apapun, harus lewat dia.",
          "Setiap masalah, secepil apapun, harus dia yang selesaikan.",
          "Tim ada. Tapi sistem tidak ada.",
          "Tidak ada SOP yang jelas.",
          "Tidak ada struktur pelaporan yang fungsional.",
          "Tidak ada mekanisme pengambilan keputusan yang bisa berjalan tanpa dia.",
          "Setelah tiga bulan bekerja sama dengan kami, dia berhasil mengurangi jam kerjanya menjadi 8 jam.",
        ],
        closing: "Bukan karena bisnis mengecil — tapi karena sistemnya akhirnya bisa bekerja untuk dia.",
        cta: "Rely Consulting Group siap membantu Anda membangun bisnis yang bisa berjalan tanpa Anda harus ada di mana-mana.",
      },
    },
  },
  keuangan: {
    default: {
      formal: {
        judul: "Bisnis Untung Tapi Kas Selalu Negatif: Mengapa?",
        kategori: "Edukasi Keuangan",
        hook: "Laporan laba rugi menunjukkan profit. Tapi rekening bisnis selalu hampir kosong.",
        scenes: [
          "Ini bukan anomali yang langka.",
          "Ini masalah yang dialami banyak bisnis yang sedang tumbuh.",
          "Profit dan cash flow adalah dua hal yang berbeda.",
          "Profit dihitung dari pendapatan dikurangi biaya.",
          "Cash flow adalah uang yang benar-benar ada di rekening Anda.",
          "Jika sebagian besar penjualan dilakukan secara kredit, profit bisa tinggi sementara kas kosong.",
          "Memahami perbedaan ini adalah kunci manajemen keuangan bisnis yang sehat.",
        ],
        closing: "Bisnis yang profitable belum tentu sehat secara finansial. Perhatikan arus kas Anda.",
        cta: "Konsultasikan kesehatan keuangan bisnis Anda bersama tim akuntan Rely Consulting Group.",
      },
      santai: {
        judul: "Kenapa Bisnis Untung Tapi Dompet Selalu Tipis?",
        kategori: "Tips Keuangan",
        hook: "Katanya bisnis untung, tapi kok tiap bulan mepet bayar operasional?",
        scenes: [
          "Kalau kamu ngerasain ini, kamu nggak sendirian.",
          "Ini namanya masalah cash flow.",
          "Dan ini beda sama masalah profit.",
          "Profit itu angka di pembukuan.",
          "Cash flow itu uang beneran yang ada di rekening kamu.",
          "Kalau banyak penjualan kredit, profit bagus tapi kas kosong — itu bisa terjadi.",
          "Solusinya? Kelola piutang lebih aktif dan proyeksikan arus kas tiap bulan.",
        ],
        closing: "Bisnis yang sehat itu untung dan punya kas yang cukup. Keduanya harus dijaga.",
        cta: "Mau bantu audit arus kas bisnis kamu? Hubungi Rely Consulting Group.",
      },
      storytelling: {
        judul: "Restoran Ramai, Tapi Hampir Tutup",
        kategori: "Kisah Nyata",
        hook: "Restoran klien kami selalu ramai. Tapi hampir tidak bisa bayar gaji karyawannya.",
        scenes: [
          "Revenue bulanannya fantastis.",
          "Profit di pembukuan terlihat baik.",
          "Tapi setiap akhir bulan, selalu ada krisis kecil.",
          "Setelah kami analisis, masalahnya ada di timing arus kas.",
          "Bahan baku dibeli tunai setiap minggu.",
          "Tapi banyak event catering dibayar 30 sampai 45 hari kemudian.",
          "Ditambah stok yang terlalu besar untuk antisipasi permintaan.",
        ],
        closing: "Dengan restrukturisasi sederhana, situasinya berubah dalam dua bulan. Tanpa harus tutup.",
        cta: "Rely Consulting Group siap membantu menganalisis dan memperbaiki arus kas bisnis Anda.",
      },
    },
  },
  umkm: {
    default: {
      formal: {
        judul: "UMKM Sulit Naik Kelas: Apa Hambatan Utamanya?",
        kategori: "Edukasi UMKM",
        hook: "Mengapa banyak UMKM bertahan di level yang sama selama bertahun-tahun?",
        scenes: [
          "Bukan karena kurang kerja keras.",
          "Bukan karena produknya tidak bagus.",
          "Tapi karena ada hambatan sistematis yang jarang disadari.",
          "Pencatatan keuangan yang tidak tertib membuat akses modal sulit.",
          "Legalitas yang belum lengkap menutup pintu ke pasar yang lebih besar.",
          "Ketergantungan penuh pada pemilik membuat bisnis tidak bisa berkembang.",
          "Mengenali hambatan ini adalah langkah pertama untuk melewatinya.",
        ],
        closing: "UMKM yang siap naik kelas bukan yang paling keras bekerja, tapi yang paling siap dengan sistemnya.",
        cta: "Konsultasikan pengembangan UMKM Anda bersama Rely Consulting Group.",
      },
      santai: {
        judul: "Kenapa UMKM Susah Naik Level?",
        kategori: "Tips UMKM",
        hook: "Usaha kamu jalan, tapi nggak kemana-mana? Ini mungkin alasannya.",
        scenes: [
          "Pembukuan masih manual dan berantakan.",
          "Rekening bisnis sama rekening pribadi masih dicampur.",
          "Belum punya izin usaha resmi.",
          "Semua keputusan masih harus lewat kamu.",
          "Nggak ada yang bisa handle kalau kamu lagi nggak ada.",
          "Ini bukan salah produknya.",
          "Ini soal sistem yang belum dibangun.",
        ],
        closing: "Bisnis yang bisa tumbuh adalah bisnis yang bisa jalan tanpa kamu harus selalu ada.",
        cta: "Mau benahi sistem bisnis UMKM kamu? Ngobrol dulu sama Rely Consulting Group.",
      },
      storytelling: {
        judul: "Dari Katering Rumahan ke Usaha Resmi Bermodal KUR",
        kategori: "Kisah Nyata",
        hook: "Bu Rini punya usaha katering yang sudah 5 tahun berjalan. Masakannya enak, pelanggannya loyal.",
        scenes: [
          "Tapi setiap akhir tahun, penghasilannya habis tanpa sisa.",
          "Tidak ada pemisahan keuangan bisnis dan pribadi.",
          "Tidak ada pembukuan yang bisa ditunjukkan ke bank.",
          "Tidak ada legalitas yang bisa jadi syarat pinjaman.",
          "Setelah tiga bulan pendampingan bersama kami, semuanya berubah.",
          "Usaha Bu Rini resmi berbadan hukum.",
          "Pembukuan rapi dan rekening bisnis terpisah.",
        ],
        closing: "Dan dia berhasil akses KUR untuk upgrade peralatan yang sudah lama diimpikan.",
        cta: "Rely Consulting Group hadir untuk mendampingi UMKM Indonesia naik kelas.",
      },
    },
  },
  motivasi: {
    default: {
      formal: {
        judul: "Ketangguhan: Kompetensi yang Paling Underrated dalam Bisnis",
        kategori: "Business Mindset",
        hook: "Semua pengusaha sukses pernah berada di titik di mana mereka hampir menyerah.",
        scenes: [
          "Yang membedakan mereka adalah keputusan untuk terus melangkah.",
          "Bukan karena kondisi menjadi lebih mudah.",
          "Tapi karena mereka memilih untuk menjadi lebih kuat.",
          "Ketangguhan bukan soal tidak pernah jatuh.",
          "Ini soal seberapa cepat Anda bangkit dengan pelajaran baru.",
          "Dan seberapa bijak Anda menggunakan pengalaman itu untuk maju.",
          "Dalam bisnis, konsistensi mengalahkan intensitas.",
        ],
        closing: "Bisnis dibangun dari langkah kecil yang konsisten — bukan dari momen besar yang sesekali terjadi.",
        cta: "Rely Consulting Group hadir sebagai mitra strategis di setiap fase perjalanan bisnis Anda.",
      },
      santai: {
        judul: "Semua Pengusaha Sukses Pernah di Titik Hampir Nyerah",
        kategori: "Motivasi Bisnis",
        hook: "Pernah ngerasa pengen berhenti sama sekali dari bisnis kamu?",
        scenes: [
          "Kalau pernah, kamu lagi ngerasain hal yang sama kayak hampir semua pengusaha sukses.",
          "Bezos pernah.",
          "Steve Jobs pernah. Bahkan pernah dipecat dari perusahaannya sendiri.",
          "Yang bedain mereka?",
          "Mereka milih untuk terus.",
          "Bukan karena nggak capek.",
          "Tapi karena mereka tau: titik terberat biasanya ada tepat sebelum terobosan terbesar.",
        ],
        closing: "Teruskan perjuangannya. Kamu lebih dekat dari yang kamu kira.",
        cta: "Rely Consulting Group — mitra bisnis yang ada di setiap fase perjalanan kamu.",
      },
      storytelling: {
        judul: "Startup yang Hampir Bangkrut, Kini Layani Ratusan Klien",
        kategori: "Kisah Inspirasi",
        hook: "2018. Sebuah startup di Jakarta punya runway 3 bulan tersisa. Investor mundur. Co-founder resign.",
        scenes: [
          "Pendirinya hampir menyerah.",
          "Tapi dia memutuskan melakukan satu hal terakhir sebelum menutup.",
          "Dia ngobrol langsung dengan 20 pelanggan paling loyalnya.",
          "Dari percakapan itu, ditemukan satu kebutuhan yang belum terpenuhi.",
          "Pivot kecil dilakukan dalam 2 minggu.",
          "Revenue naik 3x dalam 3 bulan berikutnya.",
          "Hari ini, perusahaan itu melayani ratusan klien korporat.",
        ],
        closing: "Bukan tentang keajaiban. Tapi tentang tetap bergerak saat semua tanda mengatakan berhenti.",
        cta: "Rely Consulting Group — hadir mendampingi bisnis Anda di setiap fase, termasuk yang paling berat.",
      },
    },
  },
  general: {
    default: {
      formal: {
        judul: "Konsultasi Profesional: Bukan Pengeluaran, Tapi Investasi",
        kategori: "Business Insight",
        hook: "Banyak bisnis baru menganggap konsultasi profesional adalah kemewahan yang bisa ditunda.",
        scenes: [
          "Padahal, keputusan bisnis yang diambil tanpa keahlian yang tepat bisa jauh lebih mahal.",
          "Masalah hukum yang muncul karena kontrak yang lemah.",
          "Sanksi pajak karena pelaporan yang tidak tepat.",
          "Sistem IT yang mahal tapi tidak sesuai kebutuhan.",
          "Semuanya bisa dicegah.",
          "Dengan investasi yang jauh lebih kecil di awal.",
          "Konsultan yang tepat bukan hanya memecahkan masalah — mereka mencegah masalah terjadi.",
        ],
        closing: "Bisnis terbaik tidak dibangun sendirian. Mereka dibangun dengan dukungan ahli yang tepat.",
        cta: "Jadwalkan konsultasi awal bersama Rely Consulting Group — tim multidisiplin yang siap mendampingi bisnis Anda.",
      },
      santai: {
        judul: "Bisnis Nggak Harus Diurus Sendirian",
        kategori: "Tips Bisnis",
        hook: "Masih ngurusin semua aspek bisnis sendirian? Pajak, legal, keuangan, IT?",
        scenes: [
          "Respect banget sih kalau bisa.",
          "Tapi serius — kamu nggak harus.",
          "Dan mungkin itu yang lagi ngehambat pertumbuhan bisnis kamu.",
          "Karena waktu yang kamu habisin ngurusin hal-hal teknis itu,",
          "Bisa kamu pakai untuk hal yang lebih strategis.",
          "Itulah kenapa ada konsultan profesional.",
          "Bukan buat bisnis besar doang — buat bisnis yang mau tumbuh.",
        ],
        closing: "Delegasikan yang bukan keahlian kamu. Fokus pada yang kamu paling bagus.",
        cta: "Rely Consulting Group — satu pintu untuk semua kebutuhan konsultasi bisnis kamu.",
      },
      storytelling: {
        judul: "Satu Masalah, Tiga Akar: Kenapa Konsultasi Terintegrasi Penting",
        kategori: "Kisah Nyata",
        hook: "Klien datang ke kami dengan satu masalah: sering kena sanksi pajak.",
        scenes: [
          "Tapi setelah kami dalami, ternyata ada tiga masalah yang saling berkaitan.",
          "Pertama: pembukuan tidak rapi, sehingga data pajak tidak akurat.",
          "Kedua: struktur badan usaha tidak optimal untuk beban pajak mereka.",
          "Ketiga: sistem IT tidak terintegrasi dengan akuntansi.",
          "Kalau kami hanya selesaikan masalah pajaknya saja,",
          "Dua masalah lain akan terus menggerogoti bisnis mereka.",
          "Itulah mengapa konsultasi yang terintegrasi memberikan nilai yang jauh lebih besar.",
        ],
        closing: "Masalah bisnis nyata jarang datang sendirian — solusinya pun harus menyeluruh.",
        cta: "Rely Consulting Group — konsultasi terintegrasi untuk hukum, pajak, keuangan, dan IT bisnis Anda.",
      },
    },
  },
};

function generateReelsScript(
  topic: string,
  tone: Tone,
  sceneCount: number,
  seed: number = 0
): ReelsScene[] {
  const category = detectCategory(topic);
  const categoryTemplates = REELS_DB[category]?.default || REELS_DB["general"].default;
  const toneKey = tone === "Formal" ? "formal" : tone === "Santai" ? "santai" : "storytelling";
  const tmpl = categoryTemplates[toneKey];

  // Detect if this is a free-form topic (not a core consulting category)
  const isFreeform = /cerita|kisah|studi kasus|brand story/i.test(topic) ||
    (category === "bisnis" && /cerita|kisah|brand|merek/.test(topic.toLowerCase()));

  // Hook is always topic-aware
  const hookText = buildTopicHook(topic, tone);

  const scenes: ReelsScene[] = [];
  scenes.push({ label: "Scene 1", text: hookText, section: "hook" });

  // Middle scenes: use topic-specific pool if freeform, else template pool
  const pool = isFreeform
    ? buildTopicReelsScenes(topic, tone, seed)
    : (() => {
        const startIdx = seed > 0 ? seed % tmpl.scenes.length : 0;
        return [...tmpl.scenes.slice(startIdx), ...tmpl.scenes.slice(0, startIdx)];
      })();

  const middleCount = Math.max(0, sceneCount - 2);
  for (let i = 0; i < middleCount; i++) {
    scenes.push({ label: `Scene ${i + 2}`, text: pool[i % pool.length], section: "script" });
  }

  // Closing/CTA — always use template CTA but with topic-aware closing if freeform
  if (sceneCount >= 2) {
    const closingText = isFreeform
      ? `${buildTopicClosing(topic, tone).headline}\n\n${tmpl.cta}`
      : `${tmpl.closing}\n\n${tmpl.cta}`;
    scenes.push({ label: `Scene ${sceneCount}`, text: closingText, section: "closing" });
  }

  return scenes;
}

// ─── Smart Content Generator ──────────────────────────────────────────────────

function generateSlides(
  topic: string,
  tone: Tone,
  format: Format,
  count: number,
  goal: Goal[],
  audience: Audience,
  seed: number = 0
): { slides: Slide[]; hashtags: string[]; caption: Caption | undefined } {
  const category = detectCategory(topic);
  const template = CONTENT_DB[category]?.default || CONTENT_DB["general"].default;

  const isSinglePost = format === "Single Post";
  const effectiveCount = isSinglePost ? 1 : Math.max(1, Math.min(8, count));

  const slides: Slide[] = [];

  // Build topic-aware hook headline — always reflects what the user typed
  const hookHeadline = buildTopicHook(topic, tone);
  
  // Build topic-aware subheadline (not from template — always specific to topic)
  const t = topic.trim();
  const hookSubheadlines: Record<Tone, string> = {
    Formal: `Pahami ${t} secara mendalam sebelum mengambil keputusan bisnis yang keliru.`,
    Santai: `Banyak yang salah kaprah soal ${t} — yuk kita luruskan bareng.`,
    Storytelling: `Di balik ${t}, ada pelajaran bisnis yang jarang dibicarakan.`,
  };
  const hookSubheadline = hookSubheadlines[tone];

  // Build middle slides — always topic-aware
  const topicMiddle = buildTopicMiddleSlides(topic, tone, category, template.middle, seed);

  // Build closing — always topic-aware (not hardcoded template)
  const closingSlide = buildTopicClosing(topic, tone);

  if (effectiveCount === 1) {
    slides.push({
      headline: hookHeadline,
      subheadline: hookSubheadline,
      isi: topicMiddle[seed % topicMiddle.length]?.isi || topicMiddle[0]?.isi,
      cta: template.cta,
    });
  } else {
    // Hook slide
    slides.push({ headline: hookHeadline, subheadline: hookSubheadline });

    // Middle slides
    for (let i = 1; i < effectiveCount - 1; i++) {
      slides.push({ ...topicMiddle[(i - 1) % topicMiddle.length] });
    }

    // Closing slide
    slides.push({ ...closingSlide, cta: template.cta });
  }

  // Build hashtags from topic keywords + goal/audience
  const baseHashtags = [...template.hashtags];
  const topicWords = topic.split(/\s+/).filter((w) => w.length > 4);
  topicWords.slice(0, 2).forEach((w) => {
    const tag = `#${w.charAt(0).toUpperCase() + w.slice(1)}`;
    if (!baseHashtags.includes(tag)) baseHashtags.push(tag);
  });
  if (goal.includes("Promosi")) baseHashtags.push("#KonsultasiGratis");
  if (goal.includes("Edukasi")) baseHashtags.push("#EdukasiIndonesia");
  if (audience === "UMKM") baseHashtags.push("#UMKM2026");
  if (audience === "Startup") baseHashtags.push("#StartupIndonesia");

  return {
    slides,
    hashtags: baseHashtags.slice(0, 8),
    caption: undefined,
  };
}

function generateCaption(topic: string, tone: Tone): Caption {
  const category = detectCategory(topic);
  const template = CONTENT_DB[category]?.default || CONTENT_DB["general"].default;
  const isFreeform = /cerita|kisah|studi kasus|brand story/i.test(topic) ||
    !/legal|hukum|pajak|tax|it\b|teknologi|keuangan|umkm|motivasi|startup/.test(topic.toLowerCase());

  if (isFreeform) {
    const subject = topic.replace(/^(cerita brand|kisah brand|studi kasus|cerita|kisah|tips|strategi|cara)\s+/i, "").trim();
    const polishedTopic = topic.charAt(0).toUpperCase() + topic.slice(1);
    const captions: Record<Tone, string> = {
      Formal: `${polishedTopic} menyimpan lebih banyak pelajaran bisnis dari yang terlihat di permukaan. 💡\n\nSetiap kisah pertumbuhan, setiap strategi yang berhasil, dan setiap keputusan kritis — semuanya mengandung prinsip yang bisa diadaptasi untuk bisnis kita masing-masing.\n\nKunci utamanya selalu sama: pemahaman mendalam tentang konteks, konsistensi dalam eksekusi, dan keberanian untuk terus belajar.\n\nKarena bisnis terbaik tidak lahir dari keberuntungan — tapi dari pola pikir yang tepat dan langkah yang terstruktur.\n\n-\n\n📌 Konsultasikan strategi dan pengembangan bisnis Anda bersama Rely Consulting Group\n📱 @relycg`,
      Santai: `${polishedTopic} — ternyata ada banyak hal menarik yang bisa kita pelajari dari sini. 🤔\n\nKalau dipikir-pikir, setiap cerita sukses atau strategi bisnis yang berhasil punya benang merah yang sama.\n\nYang paling sering keliatan: konsistensi, keberanian buat pivot saat perlu, dan fokus yang nggak gampang tergoyahkan.\n\nSemoga jadi inspirasi buat perjalanan bisnis kamu juga! 💪\n\n-\n\n📌 Mau diskusi soal strategi bisnis? Hubungi Rely Consulting Group\n📱 @relycg`,
      Storytelling: `Ada satu hal yang selalu menarik dari ${subject} — cara mereka menghadapi titik-titik paling sulit dalam perjalanannya. 🌟\n\nBukan di momen suksesnya yang paling terlihat. Tapi di keputusan-keputusan kecil yang dibuat jauh sebelum semua itu terjadi.\n\nDan kalau kita pelajari lebih dalam, pola itu sebenarnya bisa ditemukan di hampir semua bisnis yang bertahan dan tumbuh.\n\nKarena pada akhirnya, keberhasilan selalu meninggalkan jejak yang bisa diikuti.\n\n-\n\n📌 Rely Consulting Group — mitra strategis perjalanan bisnis Anda\n📱 @relycg`,
    };
    return {
      text: captions[tone],
      hashtags: ["#RelyConsulting", "#BisnisBerkembang", "#InsightBisnis", "#StrategiBisnis", "#PengusahaIndonesia"],
    };
  }

  const captionText = tone === "Formal"
    ? template.captions.formal
    : tone === "Santai"
      ? template.captions.santai
      : template.captions.storytelling;

  return {
    text: captionText,
    hashtags: template.hashtags,
  };
}

// ─── Static Library Mock Data ─────────────────────────────────────────────────

const INITIAL_LIBRARY: ContentItem[] = (() => {
  const legal = generateSlides("Tips Legalitas UMKM", "Formal", "Carousel", 5, ["Edukasi"], "UMKM");
  const pajak = generateSlides("Edukasi Pajak Bulanan untuk Bisnis", "Santai", "Carousel", 3, ["Edukasi"], "UMKM");
  const it = generateSlides("Promosi Layanan Konsultasi IT", "Formal", "Single Post", 1, ["Promosi"], "Korporat");
  const bisnis = generateSlides("Studi Kasus Klien — Ekspansi Bisnis", "Storytelling", "Carousel", 5, ["Engagement"], "Startup");

  return [
    {
      id: "1",
      topic: "Tips Legalitas UMKM",
      format: "Carousel",
      tone: "Formal",
      slides: legal.slides,
      hashtags: legal.hashtags,
      caption: generateCaption("Tips Legalitas UMKM", "Formal"),
      status: "Posted",
      createdAt: "2026-06-01",
      scheduledDate: "2026-06-05",
    },
    {
      id: "2",
      topic: "Edukasi Pajak Bulanan",
      format: "Carousel",
      tone: "Santai",
      slides: pajak.slides,
      hashtags: pajak.hashtags,
      status: "Scheduled",
      createdAt: "2026-06-10",
      scheduledDate: "2026-06-19",
    },
    {
      id: "3",
      topic: "Promosi Layanan Konsultasi IT",
      format: "Single Post",
      tone: "Formal",
      slides: it.slides,
      hashtags: it.hashtags,
      status: "Draft",
      createdAt: "2026-06-15",
    },
    {
      id: "4",
      topic: "Studi Kasus Klien — Ekspansi Bisnis",
      format: "Carousel",
      tone: "Storytelling",
      slides: bisnis.slides,
      hashtags: bisnis.hashtags,
      caption: generateCaption("Studi Kasus Klien", "Storytelling"),
      status: "Draft",
      createdAt: "2026-06-17",
    },
  ];
})();


// ─── Indonesian Holidays 2026 ─────────────────────────────────────────────────

const HOLIDAYS_2026: Record<string, string> = {
  "2026-01-01": "Tahun Baru 2026 Masehi",
  "2026-01-16": "Isra Mikraj Nabi Muhammad SAW",
  "2026-02-16": "Cuti Bersama Tahun Baru Imlek",
  "2026-02-17": "Tahun Baru Imlek 2577 Kongzili",
  "2026-03-18": "Cuti Bersama Hari Suci Nyepi",
  "2026-03-19": "Hari Suci Nyepi (Tahun Baru Saka 1948)",
  "2026-03-20": "Cuti Bersama Idulfitri",
  "2026-03-21": "Idulfitri 1447 H (hari 1)",
  "2026-03-22": "Idulfitri 1447 H (hari 2)",
  "2026-03-23": "Cuti Bersama Idulfitri",
  "2026-03-24": "Cuti Bersama Idulfitri",
  "2026-04-03": "Wafat Yesus Kristus",
  "2026-04-05": "Kebangkitan Yesus Kristus (Paskah)",
  "2026-05-01": "Hari Buruh Internasional",
  "2026-05-14": "Kenaikan Yesus Kristus",
  "2026-05-15": "Cuti Bersama Kenaikan Yesus Kristus",
  "2026-05-27": "Iduladha 1447 H",
  "2026-05-28": "Cuti Bersama Iduladha",
  "2026-05-31": "Hari Raya Waisak 2570 BE",
  "2026-06-01": "Hari Lahir Pancasila",
  "2026-06-16": "1 Muharam, Tahun Baru Islam 1448 H",
  "2026-08-17": "Hari Kemerdekaan RI (Proklamasi)",
  "2026-08-25": "Maulid Nabi Muhammad SAW",
  "2026-12-24": "Cuti Bersama Hari Raya Natal",
  "2026-12-25": "Hari Raya Natal",
};

// ─── Utils ────────────────────────────────────────────────────────────────────

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

function pad(n: number) { return String(n).padStart(2, "0"); }

function dateKey(year: number, month: number, day: number) {
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  const d = new Date(year, month, 1).getDay();
  return d === 0 ? 6 : d - 1; // Monday-first
}

const MONTHS_ID = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const DAYS_ID = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

// ─── Toast ────────────────────────────────────────────────────────────────────

interface ToastMsg { id: string; message: string; }

function Toast({ toasts, remove }: { toasts: ToastMsg[]; remove: (id: string) => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium animate-in slide-in-from-bottom-2 duration-300"
          style={{
            background: "linear-gradient(145deg, rgba(21,40,71,0.95), rgba(15,30,58,0.98))",
            border: "1px solid rgba(96,165,250,0.3)",
            boxShadow: "0 0 20px rgba(37,99,235,0.2), 0 8px 32px rgba(0,0,0,0.4)",
            backdropFilter: "blur(16px)",
            color: "#F0F6FF",
          }}
        >
          <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #1A4FBF, #2563EB)" }}>
            <Check size={11} strokeWidth={3} />
          </div>
          <span>{t.message}</span>
          <button onClick={() => remove(t.id)} className="ml-2 opacity-50 hover:opacity-100 transition-opacity">
            <X size={13} />
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Reusable UI ──────────────────────────────────────────────────────────────

function GlassCard({ children, className = "", hover = false, style = {} }: {
  children: React.ReactNode; className?: string; hover?: boolean; style?: React.CSSProperties;
}) {
  return (
    <div
      className={`rounded-2xl transition-all duration-300 ${hover ? "hover:-translate-y-0.5" : ""} ${className}`}
      style={{
        background: "linear-gradient(145deg, rgba(21,40,71,0.9), rgba(15,30,58,0.95))",
        border: "1px solid rgba(96,165,250,0.12)",
        boxShadow: hover ? undefined : "0 4px 24px rgba(0,0,0,0.3)",
        ...(hover ? {} : {}),
        ...style,
      }}
      onMouseEnter={hover ? (e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = "0 0 30px rgba(37,99,235,0.2), 0 8px 32px rgba(0,0,0,0.4)";
      } : undefined}
      onMouseLeave={hover ? (e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 24px rgba(0,0,0,0.3)";
      } : undefined}
    >
      {children}
    </div>
  );
}

function PrimaryBtn({ children, onClick, disabled, className = "", small = false }: {
  children: React.ReactNode; onClick?: () => void; disabled?: boolean; className?: string; small?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${small ? "px-3 py-1.5 text-xs" : "px-4 py-2.5 text-sm"} ${className}`}
      style={{
        background: disabled ? "rgba(26,79,191,0.4)" : "linear-gradient(135deg, #1A4FBF 0%, #2563EB 100%)",
        color: "#F0F6FF",
        boxShadow: disabled ? "none" : "0 0 20px rgba(37,99,235,0.3)",
      }}
      onMouseEnter={(e) => { if (!disabled) (e.currentTarget as HTMLElement).style.boxShadow = "0 0 30px rgba(37,99,235,0.5)"; }}
      onMouseLeave={(e) => { if (!disabled) (e.currentTarget as HTMLElement).style.boxShadow = "0 0 20px rgba(37,99,235,0.3)"; }}
    >
      {children}
    </button>
  );
}

function GhostBtn({ children, onClick, className = "", small = false }: {
  children: React.ReactNode; onClick?: () => void; className?: string; small?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-1.5 font-medium rounded-xl border transition-all duration-200 cursor-pointer ${small ? "px-3 py-1.5 text-xs" : "px-4 py-2.5 text-sm"} ${className}`}
      style={{
        background: "rgba(21,40,71,0.6)",
        border: "1px solid rgba(96,165,250,0.2)",
        color: "#60A5FA",
      }}
    >
      {children}
    </button>
  );
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer"
      style={{
        background: active ? "linear-gradient(135deg, #1A4FBF 0%, #2563EB 100%)" : "rgba(21,40,71,0.6)",
        border: active ? "1px solid rgba(96,165,250,0.4)" : "1px solid rgba(96,165,250,0.15)",
        color: active ? "#F0F6FF" : "#94B4D4",
        boxShadow: active ? "0 0 12px rgba(37,99,235,0.25)" : "none",
      }}
    >
      {label}
    </button>
  );
}

function StatusBadge({ status }: { status: Status }) {
  const cfg = {
    Draft: { bg: "rgba(74,111,165,0.2)", border: "rgba(74,111,165,0.4)", color: "#94B4D4" },
    Scheduled: { bg: "rgba(37,99,235,0.15)", border: "rgba(37,99,235,0.4)", color: "#60A5FA" },
    Posted: { bg: "rgba(16,185,129,0.15)", border: "rgba(16,185,129,0.35)", color: "#34D399" },
  }[status];
  return (
    <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color }}>
      {status}
    </span>
  );
}

function InputField({ label, value, onChange, placeholder, type = "text" }: {
  label?: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-xs font-semibold" style={{ color: "#94B4D4" }}>{label}</label>}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all duration-200"
        style={{
          background: "rgba(15,30,58,0.6)",
          border: "1px solid rgba(96,165,250,0.2)",
          color: "#F0F6FF",
        }}
        onFocus={(e) => { e.currentTarget.style.border = "1px solid rgba(96,165,250,0.5)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.15)"; }}
        onBlur={(e) => { e.currentTarget.style.border = "1px solid rgba(96,165,250,0.2)"; e.currentTarget.style.boxShadow = "none"; }}
      />
    </div>
  );
}

function TextareaField({ label, value, onChange, placeholder, rows = 4 }: {
  label?: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-xs font-semibold" style={{ color: "#94B4D4" }}>{label}</label>}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all duration-200 resize-none"
        style={{
          background: "rgba(15,30,58,0.6)",
          border: "1px solid rgba(96,165,250,0.2)",
          color: "#F0F6FF",
        }}
        onFocus={(e) => { e.currentTarget.style.border = "1px solid rgba(96,165,250,0.5)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.15)"; }}
        onBlur={(e) => { e.currentTarget.style.border = "1px solid rgba(96,165,250,0.2)"; e.currentTarget.style.boxShadow = "none"; }}
      />
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar({ current, onNavigate }: { current: Page; onNavigate: (p: Page) => void }) {
  const nav: { page: Page; label: string; icon: React.ReactNode }[] = [
    { page: "generate", label: "Generate Content", icon: <Sparkles size={18} /> },
    { page: "calendar", label: "Content Calendar", icon: <CalendarDays size={18} /> },
    { page: "library", label: "Content Library", icon: <Library size={18} /> },
    { page: "designer", label: "Designer Workspace", icon: <Palette size={18} /> },
  ];

  return (
    <aside
      className="flex flex-col h-full w-64 flex-shrink-0"
      style={{
        background: "linear-gradient(180deg, #0D2951 0%, #0A1E3D 100%)",
        borderRight: "1px solid rgba(96,165,250,0.1)",
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6 mb-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #1A4FBF 0%, #2563EB 100%)", boxShadow: "0 0 16px rgba(37,99,235,0.4)" }}>
          <Sparkles size={15} color="#fff" />
        </div>
        <div>
          <div className="font-bold text-base leading-tight" style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            background: "linear-gradient(135deg, #F0F6FF 0%, #60A5FA 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>
            Rely Studio
          </div>
          <div className="text-xs" style={{ color: "#4A6FA5", fontFamily: "'DM Sans', sans-serif" }}>AI Content Platform</div>
        </div>
      </div>

      <div className="px-3 flex-1">
        <div className="text-xs font-semibold uppercase tracking-widest mb-3 px-3" style={{ color: "#4A6FA5", fontFamily: "'JetBrains Mono', monospace" }}>
          Navigation
        </div>
        <nav className="flex flex-col gap-1">
          {nav.map(({ page, label, icon }) => {
            const isActive = current === page;
            return (
              <button
                key={page}
                onClick={() => onNavigate(page)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 text-left cursor-pointer relative"
                style={{
                  background: isActive ? "rgba(37,99,235,0.15)" : "transparent",
                  color: isActive ? "#F0F6FF" : "#94B4D4",
                  borderLeft: isActive ? "2px solid #2563EB" : "2px solid transparent",
                }}
              >
                <span style={{ color: isActive ? "#60A5FA" : "#4A6FA5" }}>{icon}</span>
                {label}
                {isActive && (
                  <div className="absolute right-3 w-1.5 h-1.5 rounded-full" style={{ background: "#2563EB" }} />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="px-6 py-4 mt-auto">
        <div className="text-xs" style={{ color: "#4A6FA5", fontFamily: "'DM Sans', sans-serif" }}>
          Rely Consulting Group<br />
          <span style={{ color: "#2A4A7F" }}>Digital Marketing Team</span>
        </div>
      </div>
    </aside>
  );
}

// ─── Generate Content Page ────────────────────────────────────────────────────

// ─── Reels Script View ────────────────────────────────────────────────────────

function ReelsScriptView({ result }: { result: GeneratedResult }) {
  const category = detectCategory(result.topic);
  const toneKey = result.tone === "Formal" ? "formal" : result.tone === "Santai" ? "santai" : "storytelling";
  const reelsMeta = REELS_DB[category]?.default?.[toneKey] || REELS_DB["general"].default["formal"];
  const scenes = result.reelsScenes || [];

  // Judul selalu dari topik user, kategori dari template jika tersedia
  const moodJudul = result.topic.charAt(0).toUpperCase() + result.topic.slice(1);
  const moodKategori = reelsMeta.kategori || "Konten Bisnis";

  const sectionColor: Record<ReelsScene["section"], { bg: string; border: string; label: string; labelColor: string; dot: string }> = {
    hook: {
      bg: "rgba(37,99,235,0.12)",
      border: "rgba(37,99,235,0.35)",
      label: "Hook / Opening",
      labelColor: "#60A5FA",
      dot: "#2563EB",
    },
    script: {
      bg: "rgba(15,30,58,0.7)",
      border: "rgba(96,165,250,0.12)",
      label: "Script Reels",
      labelColor: "#94B4D4",
      dot: "#4A6FA5",
    },
    closing: {
      bg: "rgba(26,79,191,0.12)",
      border: "rgba(96,165,250,0.3)",
      label: "Closing / CTA",
      labelColor: "#93C5FD",
      dot: "#1A4FBF",
    },
  };

  // Group scenes by section for headers
  let lastSection: ReelsScene["section"] | null = null;

  return (
    <div className="flex flex-col gap-3">
      {/* Mood Board Header */}
      <div className="rounded-xl p-4" style={{
        background: "linear-gradient(135deg, rgba(26,79,191,0.15), rgba(10,22,40,0.9))",
        border: "1px solid rgba(96,165,250,0.2)",
      }}>
        <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#4A6FA5", fontFamily: "'JetBrains Mono', monospace" }}>
          Mood Board
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { key: "Judul", val: moodJudul },
            { key: "Kategori", val: moodKategori },
            { key: "Format", val: "Reels" },
          ].map(({ key, val }) => (
            <div key={key}>
              <span className="text-xs" style={{ color: "#4A6FA5" }}>{key}</span>
              <p className="text-xs font-semibold mt-0.5" style={{ color: "#94B4D4" }}>{val}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Scenes */}
      {scenes.map((scene, i) => {
        const cfg = sectionColor[scene.section];
        const showSectionHeader = scene.section !== lastSection;
        lastSection = scene.section;

        const lines = scene.text.split("\n\n");
        const isClosing = scene.section === "closing";

        return (
          <div key={i}>
            {showSectionHeader && (
              <div className="flex items-center gap-2 mb-2 mt-1">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dot }} />
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: cfg.labelColor, fontFamily: "'JetBrains Mono', monospace" }}>
                  {cfg.label}
                </span>
              </div>
            )}
            <div className="rounded-xl px-4 py-3 flex items-start gap-3" style={{
              background: cfg.bg,
              border: `1px solid ${cfg.border}`,
            }}>
              <div className="flex-shrink-0 mt-0.5">
                <span className="text-xs font-mono font-bold" style={{ color: cfg.labelColor }}>
                  {scene.label}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                {isClosing && lines.length > 1 ? (
                  <>
                    <p className="text-sm font-semibold leading-relaxed" style={{ color: "#F0F6FF", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      {lines[0]}
                    </p>
                    <p className="text-xs mt-2 leading-relaxed" style={{ color: "#60A5FA" }}>
                      {lines[1]}
                    </p>
                  </>
                ) : (
                  <p className={`text-sm leading-relaxed ${scene.section === "hook" ? "font-semibold" : ""}`}
                    style={{
                      color: scene.section === "hook" ? "#F0F6FF" : "#94B4D4",
                      fontFamily: scene.section === "hook" ? "'Plus Jakarta Sans', sans-serif" : "'DM Sans', sans-serif",
                    }}>
                    {scene.text}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SlideCard({ slide, index, total }: { slide: Slide; index: number; total: number }) {
  return (
    <div className="rounded-xl p-4" style={{
      background: "rgba(10,22,40,0.7)",
      border: "1px solid rgba(96,165,250,0.1)",
    }}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-mono font-semibold" style={{ color: "#4A6FA5" }}>
          SLIDE {index + 1}/{total}
        </span>
        {index === total - 1 && (
          <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{
            background: "rgba(37,99,235,0.15)", border: "1px solid rgba(37,99,235,0.3)", color: "#60A5FA"
          }}>Penutup</span>
        )}
        {index === 0 && (
          <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{
            background: "rgba(96,165,250,0.1)", border: "1px solid rgba(96,165,250,0.2)", color: "#93C5FD"
          }}>Hook</span>
        )}
      </div>
      <div className="space-y-2">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#4A6FA5" }}>Headline</span>
          <p className="text-sm font-bold mt-0.5" style={{ color: "#F0F6FF", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{slide.headline}</p>
        </div>
        {slide.subheadline && (
          <div>
            <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#4A6FA5" }}>Subheadline</span>
            <p className="text-sm mt-0.5" style={{ color: "#94B4D4" }}>{slide.subheadline}</p>
          </div>
        )}
        {slide.isi && (
          <div>
            <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#4A6FA5" }}>Isi</span>
            <p className="text-sm mt-0.5" style={{ color: "#94B4D4" }}>{slide.isi}</p>
          </div>
        )}
        {slide.closing && (
          <div>
            <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#4A6FA5" }}>Closing</span>
            <p className="text-sm mt-0.5 italic" style={{ color: "#60A5FA" }}>{slide.closing}</p>
          </div>
        )}
        {slide.cta && (
          <div className="pt-2 mt-2" style={{ borderTop: "1px solid rgba(96,165,250,0.1)" }}>
            <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#2563EB" }}>CTA</span>
            <p className="text-sm mt-0.5 font-medium" style={{ color: "#60A5FA" }}>{slide.cta}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ResultCard({
  result,
  onRegenerate,
  onGenerateCaption,
  onAddToLibrary,
  onRegenerateCaption,
}: {
  result: GeneratedResult;
  onRegenerate: (id: string, note?: string) => void;
  onGenerateCaption: (id: string) => void;
  onAddToLibrary: (result: GeneratedResult) => void;
  onRegenerateCaption: (id: string) => void;
}) {
  const [note, setNote] = useState("");
  const [copied, setCopied] = useState(false);
  const [captionCopied, setCaptionCopied] = useState(false);

  function handleCopy() {
    const text = result.slides.map((s, i) =>
      `Slide ${i + 1}: ${s.headline}\n${s.subheadline || ""}\n${s.isi || ""}`
    ).join("\n\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleCaptionCopy() {
    if (!result.caption) return;
    const text = result.caption.text + "\n" + result.caption.hashtags.join(" ");
    navigator.clipboard.writeText(text);
    setCaptionCopied(true);
    setTimeout(() => setCaptionCopied(false), 2000);
  }

  return (
    <GlassCard hover className="p-5 flex flex-col gap-4">
      {/* Header badges */}
      <div className="flex items-center gap-2">
        <span className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{
          background: "rgba(96,165,250,0.12)", border: "1px solid rgba(96,165,250,0.25)", color: "#93C5FD"
        }}>{result.tone}</span>
        <span className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{
          background: "rgba(37,99,235,0.12)", border: "1px solid rgba(37,99,235,0.3)", color: "#60A5FA"
        }}>{result.format}</span>
        <span className="text-xs px-2.5 py-1 rounded-full font-semibold ml-auto" style={{
          background: "rgba(74,111,165,0.15)", border: "1px solid rgba(74,111,165,0.3)", color: "#94B4D4"
        }}>
          {result.format === "Reels Script"
            ? `${result.reelsScenes?.length ?? 0} Scene`
            : `${result.slides.length} Slide`}
        </span>
      </div>

      {/* Topic */}
      <div>
        <p className="text-xs" style={{ color: "#4A6FA5" }}>Topik</p>
        <h3 className="font-bold text-base mt-0.5" style={{ color: "#F0F6FF", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{result.topic}</h3>
      </div>

      {/* Content: Reels or Slides */}
      {result.format === "Reels Script" && result.reelsScenes ? (
        <ReelsScriptView result={result} />
      ) : (
        <div className="flex flex-col gap-2">
          {result.slides.map((slide, i) => (
            <SlideCard key={i} slide={slide} index={i} total={result.slides.length} />
          ))}
        </div>
      )}

      {/* Hashtags */}
      <div className="flex flex-wrap gap-1.5">
        {result.hashtags.map((h) => (
          <span key={h} className="text-xs px-2.5 py-1 rounded-full" style={{
            background: "rgba(37,99,235,0.08)", border: "1px solid rgba(96,165,250,0.15)", color: "#60A5FA"
          }}>{h}</span>
        ))}
      </div>

      {/* Caption area */}
      {result.loadingCaption && (
        <div className="rounded-xl p-4 flex items-center gap-3" style={{
          background: "rgba(10,22,40,0.8)", border: "1px solid rgba(96,165,250,0.12)"
        }}>
          <div className="w-4 h-4 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
          <span className="text-sm" style={{ color: "#94B4D4" }}>AI sedang menulis caption...</span>
        </div>
      )}

      {result.caption && !result.loadingCaption && (
        <div className="rounded-xl p-4 flex flex-col gap-3" style={{
          background: "rgba(10,22,40,0.8)", border: "1px solid rgba(96,165,250,0.15)"
        }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare size={14} color="#60A5FA" />
              <span className="text-xs font-semibold" style={{ color: "#60A5FA" }}>Caption Instagram</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => onRegenerateCaption(result.id)} className="p-1.5 rounded-lg transition-colors cursor-pointer" style={{ color: "#4A6FA5" }}
                title="Generate ulang caption">
                <RefreshCw size={12} />
              </button>
              <button onClick={handleCaptionCopy} className="p-1.5 rounded-lg transition-colors cursor-pointer" style={{ color: captionCopied ? "#34D399" : "#4A6FA5" }}>
                {captionCopied ? <Check size={12} /> : <Copy size={12} />}
              </button>
            </div>
          </div>
          <pre className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: "#94B4D4", fontFamily: "'DM Sans', sans-serif" }}>
            {result.caption.text}
          </pre>
          <div className="flex flex-wrap gap-1.5 pt-1" style={{ borderTop: "1px solid rgba(96,165,250,0.1)" }}>
            {result.caption.hashtags.map((h) => (
              <span key={h} className="text-xs px-2 py-0.5 rounded-full" style={{
                background: "rgba(37,99,235,0.1)", border: "1px solid rgba(96,165,250,0.15)", color: "#60A5FA"
              }}>{h}</span>
            ))}
          </div>
        </div>
      )}

      {/* Perbaiki note */}
      <div className="flex gap-2">
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Perbaiki dengan catatan... (mis: kurang storytelling di slide 3)"
          className="flex-1 px-3 py-2 rounded-xl text-xs outline-none"
          style={{
            background: "rgba(15,30,58,0.6)", border: "1px solid rgba(96,165,250,0.18)", color: "#F0F6FF"
          }}
          onKeyDown={(e) => { if (e.key === "Enter" && note.trim()) { onRegenerate(result.id, note); setNote(""); } }}
        />
        <button
          onClick={() => { if (note.trim()) { onRegenerate(result.id, note); setNote(""); } }}
          className="p-2 rounded-xl transition-all cursor-pointer"
          style={{ background: "rgba(37,99,235,0.2)", border: "1px solid rgba(37,99,235,0.3)", color: "#60A5FA" }}
        >
          <Send size={14} />
        </button>
      </div>

      {/* Action row */}
      <div className="flex flex-wrap items-center gap-2 pt-1" style={{ borderTop: "1px solid rgba(96,165,250,0.08)" }}>
        <GhostBtn small onClick={() => onRegenerate(result.id)}>
          <RefreshCw size={12} /> Generate Ulang
        </GhostBtn>
        <button onClick={handleCopy} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all"
          style={{ color: copied ? "#34D399" : "#60A5FA", background: "transparent", border: "none" }}>
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? "Tersalin" : "Copy"}
        </button>
        {!result.caption && !result.loadingCaption && (
          <GhostBtn small onClick={() => onGenerateCaption(result.id)}>
            <MessageSquare size={12} /> Generate Caption
          </GhostBtn>
        )}
        <PrimaryBtn small className="ml-auto" onClick={() => onAddToLibrary(result)}>
          <Library size={12} /> Tambahkan ke Library
        </PrimaryBtn>
      </div>
    </GlassCard>
  );
}


function GeneratePage({ onAddToLibrary, addToast }: {
  onAddToLibrary: (item: ContentItem) => void;
  addToast: (msg: string) => void;
}) {
  const [topic, setTopic] = useState("");
  const [audience, setAudience] = useState<Audience>("UMKM");
  const [goals, setGoals] = useState<Goal[]>(["Edukasi"]);
  const [format, setFormat] = useState<Format>("Carousel");
  const [tone, setTone] = useState<Tone>("Formal");
  const [slideCount, setSlideCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<GeneratedResult[]>([]);
  const seedRef = useRef(0);
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
  const [useLocalOnly, setUseLocalOnly] = useState(false);

  const quickTopics = ["Tips Legalitas UMKM", "Edukasi Pajak Bulanan", "Studi Kasus Klien", "Promosi Layanan Konsultasi IT", "Quote Motivasi Bisnis"];
  const goals_list: Goal[] = ["Edukasi", "Promosi", "Engagement", "Awareness"];
  const tones: Tone[] = ["Formal", "Santai", "Storytelling"];
  const formats: Format[] = ["Single Post", "Carousel", "Reels Script"];
  const audiences: Audience[] = ["UMKM", "Startup", "Korporat", "General Public"];

  function toggleGoal(g: Goal) {
    setGoals((prev) => prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]);
  }

  const TONE_DESC: Record<Tone, string> = {
    Formal: "profesional, lugas, gunakan kata ganti 'Anda'",
    Santai: "ringan, akrab, gunakan kata ganti 'kamu', boleh bahasa gaul wajar",
    Storytelling: "naratif bercerita seperti kisah nyata, bangun emosi pembaca secara bertahap",
  };

  async function callGemini(systemPrompt: string, userPrompt: string, retryCount = 0): Promise<any> {
    const key = import.meta.env.VITE_GEMINI_API_KEY || "";
    if (!key) throw new Error("NO_KEY");

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ parts: [{ text: userPrompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.5,
          },
        }),
      }
    );

    if (res.status === 400) throw new Error("INVALID_KEY");
    if (res.status === 403) throw new Error("INVALID_KEY");
    if (res.status === 429) {
      // Auto-retry with exponential backoff (max 2 retries)
      if (retryCount < 2) {
        const waitMs = (retryCount + 1) * 3000;
        await new Promise((resolve) => setTimeout(resolve, waitMs));
        return callGemini(systemPrompt, userPrompt, retryCount + 1);
      }
      throw new Error("RATE_LIMIT");
    }
    if (!res.ok) throw new Error(`Gemini error ${res.status}`);

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("Gemini empty response");
    
    // Safe JSON parse with cleanup
    const cleaned = text.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned);
  }

  function handleApiError(err: unknown) {
    const msg = String(err);
    if (msg.includes("NO_KEY")) {
      
      return "no_key";
    }
    if (msg.includes("INVALID_KEY")) {
      addToast("Gemini API key tidak valid — periksa kembali key Anda");
      
      return "invalid_key";
    }
    if (msg.includes("QUOTA_EXCEEDED")) {
      setUseLocalOnly(true);
      addToast("Kuota Gemini habis — menggunakan generator lokal");
      return "quota";
    }
    if (msg.includes("RATE_LIMIT")) {
      addToast("Terlalu banyak request — tunggu sebentar lalu coba lagi");
      return "rate_limit";
    }
    return "other";
  }

  async function generate() {
    if (!topic.trim()) return;
    setLoading(true);

    const key = import.meta.env.VITE_GEMINI_API_KEY || "";
    const count = format === "Single Post" ? 1 : slideCount;
    const isReels = format === "Reels Script";

    // Langsung pakai generator lokal jika tidak ada key atau quota habis
    if (!key || useLocalOnly) {
      const seed = seedRef.current++;
      const generated = generateSlides(topic.trim(), tone, format, count, goals, audience, seed);
      const reelsScenes = isReels ? generateReelsScript(topic.trim(), tone, count, seed) : undefined;
      setResults((prev) => [{ id: Date.now().toString(), topic: topic.trim(), tone, format, slides: generated.slides, reelsScenes, hashtags: generated.hashtags }, ...prev]);
      setLoading(false);
      return;
    }

    const toneDesc = TONE_DESC[tone];
    const sysPrompt = `Kamu adalah penulis konten Instagram profesional untuk Rely Consulting Group, perusahaan konsultan bisnis (hukum, pajak, keuangan, IT) di Indonesia.

ATURAN WAJIB:
1. SELALU tulis dalam Bahasa Indonesia yang natural dan mengalir.
2. SEMUA konten — headline, subheadline, isi — HARUS membahas topik yang diberikan secara SPESIFIK dan relevan. DILARANG menggunakan kalimat atau frasa generik yang tidak berhubungan langsung dengan topik.
3. Setiap slide harus memiliki kesinambungan logis satu sama lain. Slide 2 harus lanjutan dari Slide 1, Slide 3 lanjutan dari Slide 2, dst.
4. Kembalikan HANYA JSON valid tanpa teks tambahan, tanpa markdown, tanpa penjelasan.
5. Headline harus singkat, kuat, dan langsung merujuk ke topik.
6. Subheadline harus memperjelas headline dan mengarah ke isi.
7. Field "isi" harus berisi informasi konkret dan spesifik tentang topik, bukan pernyataan umum.`;

    try {
      let newResult: GeneratedResult;

      if (isReels) {
        const middleCount = count - 2;
        const userPrompt = `Buat script Reels Instagram ${count} scene tentang: "${topic.trim()}"
Tone: ${tone} — ${toneDesc}
Target: ${audience} | Tujuan: ${goals.join(", ")}

- Scene 1 (hook): 1 kalimat pendek provokatif langsung terkait "${topic.trim()}"
- Scene 2–${count - 1} (${middleCount} scene isi): masing-masing 1-2 kalimat singkat, bangun narasi tentang "${topic.trim()}" secara logis
- Scene ${count} (closing): 1-2 kalimat penutup + CTA konsultasi ke Rely Consulting

JSON:
{"judul":"...","kategori":"...","scenes":[{"label":"Scene 1","text":"...","section":"hook"},{"label":"Scene 2","text":"...","section":"script"},{"label":"Scene ${count}","text":"penutup.\\n\\nCTA ke Rely Consulting.","section":"closing"}],"hashtags":["#RelyConsulting","..."]}`;

        const data = await callGemini(sysPrompt, userPrompt);
        newResult = { id: Date.now().toString(), topic: topic.trim(), tone, format, slides: [], reelsScenes: data.scenes, hashtags: data.hashtags ?? [] };
      } else {
        const userPrompt = count === 1
          ? `Buat konten Instagram Single Post tentang TOPIK INI: "${topic.trim()}"
Tone: ${tone} — ${toneDesc} | Target: ${audience} | Tujuan: ${goals.join(", ")}

PETUNJUK: Headline, subheadline, dan isi HARUS membahas "${topic.trim()}" secara SPESIFIK. Dilarang menggunakan kalimat umum.

JSON (isi semua field dengan konten nyata tentang "${topic.trim()}", BUKAN placeholder):
{"slides":[{"headline":"headline kuat spesifik tentang ${topic.trim()}","subheadline":"subheadline yang memperjelas headline","isi":"2-3 kalimat padat dan konkret tentang ${topic.trim()}","cta":"ajakan konsultasi Rely Consulting"}],"hashtags":["#RelyConsulting","6 hashtag relevan tentang ${topic.trim()}"]}`
          : `Buat konten Instagram Carousel ${count} slide tentang TOPIK INI: "${topic.trim()}"
Tone: ${tone} — ${toneDesc} | Target: ${audience} | Tujuan: ${goals.join(", ")}

PETUNJUK WAJIB — SANGAT PENTING:
- SEMUA ${count} slide HARUS membahas "${topic.trim()}" dari sudut yang berbeda-beda namun saling berkaitan.
- Setiap slide harus membangun narasi yang logis dan mengalir dari slide sebelumnya.
- DILARANG menggunakan kalimat umum seperti "bisnis yang sukses perlu strategi yang tepat" — semua harus SPESIFIK ke "${topic.trim()}".
- Headline di setiap slide harus secara eksplisit merujuk ke aspek dari "${topic.trim()}".

STRUKTUR SLIDE:
- Slide 1 (hook): Headline provokatif yang langsung menyentuh masalah utama di "${topic.trim()}" + subheadline yang memancing pembaca lanjut. TANPA field isi.
- Slide 2 sampai ${count - 1}: Masing-masing bahas 1 aspek BERBEDA dari "${topic.trim()}". Wajib ada headline (spesifik ke aspek itu), subheadline, isi (2-3 kalimat konkret berisi insight/fakta/tips spesifik), boleh closing (1 kalimat kuat).
- Slide ${count} (penutup): Rangkuman poin-poin kunci dari "${topic.trim()}" + CTA ajakan konsultasi ke Rely Consulting.

JSON (isi semua field dengan konten nyata — BUKAN "..." atau placeholder):
{"slides":[{"headline":"headline hook spesifik tentang ${topic.trim()}","subheadline":"subheadline menarik"},{"headline":"headline aspek spesifik dari ${topic.trim()}","subheadline":"subheadline","isi":"isi konkret 2-3 kalimat tentang aspek ini","closing":"kalimat kuat"},{"headline":"headline penutup","subheadline":"subheadline","isi":"rangkuman","cta":"ajakan konsultasi Rely Consulting"}],"hashtags":["#RelyConsulting","6-7 hashtag relevan tentang ${topic.trim()}"]}`;

        const data = await callGemini(sysPrompt, userPrompt);
        newResult = { id: Date.now().toString(), topic: topic.trim(), tone, format, slides: data.slides ?? [], hashtags: data.hashtags ?? [] };
      }

      setResults((prev) => [newResult, ...prev]);
    } catch (err) {
      console.error(err);
      handleApiError(err);
      // Selalu fallback ke generator lokal jika ChatGPT gagal/tidak tersedia
      const seed = seedRef.current++;
      const generated = generateSlides(topic.trim(), tone, format, count, goals, audience, seed);
      const reelsScenes = isReels ? generateReelsScript(topic.trim(), tone, count, seed) : undefined;
      setResults((prev) => [{
        id: Date.now().toString(),
        topic: topic.trim(), tone, format,
        slides: generated.slides, reelsScenes,
        hashtags: generated.hashtags,
      }, ...prev]);
    } finally {
      setLoading(false);
    }
  }

  async function regenerate(id: string, note?: string) {
    const r = results.find((x) => x.id === id);
    if (!r) return;
    setResults((prev) => prev.map((x) => x.id === id ? { ...x, slides: [], reelsScenes: undefined, caption: undefined } : x));
    const effectiveTopic = note ? `${r.topic}. Catatan revisi: ${note}` : r.topic;
    const count = r.reelsScenes ? r.reelsScenes.length : r.slides.length;
    const isReels = r.format === "Reels Script";
    const toneDesc = TONE_DESC[r.tone];

    // Langsung lokal jika quota habis
    if (useLocalOnly) {
      const seed = seedRef.current++;
      const generated = generateSlides(effectiveTopic, r.tone, r.format, count, goals, audience, seed);
      const reelsScenes = isReels ? generateReelsScript(effectiveTopic, r.tone, count, seed) : undefined;
      setResults((prev) => prev.map((x) => x.id === id ? { ...x, slides: generated.slides, reelsScenes, hashtags: generated.hashtags } : x));
      addToast(note ? "Konten diperbaiki" : "Konten digenerate ulang");
      return;
    }

    const sysPrompt = `Kamu adalah penulis konten Instagram profesional untuk Rely Consulting Group, perusahaan konsultan bisnis (hukum, pajak, keuangan, IT) di Indonesia.
ATURAN: Tulis dalam Bahasa Indonesia. Semua headline, subheadline, dan isi HARUS spesifik dan relevan dengan topik yang diberikan. Dilarang konten generik. Kembalikan HANYA JSON valid.`;

    try {
      let updated: Partial<GeneratedResult>;
      if (isReels) {
        const userPrompt = `Buat ulang script Reels ${count} scene tentang: "${effectiveTopic}"
Tone: ${r.tone} — ${toneDesc}
JSON: {"judul":"...","kategori":"...","scenes":[{"label":"Scene 1","text":"...","section":"hook"},{"label":"Scene 2","text":"...","section":"script"},{"label":"Scene ${count}","text":"penutup.\\n\\nCTA Rely Consulting.","section":"closing"}],"hashtags":["#RelyConsulting","..."]}`;
        const data = await callGemini(sysPrompt, userPrompt);
        updated = { reelsScenes: data.scenes, hashtags: data.hashtags ?? [] };
      } else {
        const userPrompt = `Buat ulang konten Instagram Carousel ${count} slide tentang TOPIK INI: "${effectiveTopic}"
Tone: ${r.tone} — ${toneDesc}

PETUNJUK WAJIB:
- SEMUA ${count} slide HARUS membahas "${effectiveTopic}" secara spesifik dari sudut berbeda namun saling berkaitan.
- Headline di setiap slide harus eksplisit merujuk ke aspek dari "${effectiveTopic}".
- DILARANG kalimat generik. Semua isi harus konkret dan informatif.
- Slide 1 (hook): headline provokatif + subheadline saja (tanpa isi).
- Slide 2 sampai ${count - 1}: headline, subheadline, isi (2-3 kalimat konkret tentang aspek "${effectiveTopic}").
- Slide ${count}: rangkuman + CTA konsultasi Rely Consulting.

JSON (isi semua field dengan konten nyata, BUKAN placeholder):
{"slides":[{"headline":"headline hook spesifik","subheadline":"subheadline"},{"headline":"headline aspek spesifik","subheadline":"subheadline","isi":"isi konkret 2-3 kalimat"},{"headline":"headline penutup","subheadline":"subheadline","isi":"rangkuman","cta":"CTA Rely Consulting"}],"hashtags":["#RelyConsulting","6-7 hashtag relevan"]}`;
        const data = await callGemini(sysPrompt, userPrompt);
        updated = { slides: data.slides ?? [], hashtags: data.hashtags ?? [] };
      }
      setResults((prev) => prev.map((x) => x.id === id ? { ...x, ...updated } : x));
      addToast(note ? "Konten diperbaiki sesuai catatan" : "Konten berhasil digenerate ulang");
    } catch (err) {
      console.error(err);
      handleApiError(err);
      // Fallback lokal
      const seed = seedRef.current++;
      const generated = generateSlides(effectiveTopic, r.tone, r.format, count, goals, audience, seed);
      const reelsScenes = isReels ? generateReelsScript(effectiveTopic, r.tone, count, seed) : undefined;
      setResults((prev) => prev.map((x) => x.id === id
        ? { ...x, slides: generated.slides, reelsScenes, hashtags: generated.hashtags }
        : x));
      addToast(note ? "Konten diperbaiki (mode lokal)" : "Generate ulang (mode lokal)");
    }
  }

  async function handleGenerateCaption(id: string) {
    const result = results.find((r) => r.id === id);
    if (!result) return;
    setResults((prev) => prev.map((r) => r.id === id ? { ...r, loadingCaption: true, caption: undefined } : r));
    const sysPrompt = `Kamu adalah copywriter Instagram untuk Rely Consulting Group. Tulis dalam Bahasa Indonesia. Kembalikan HANYA JSON valid.`;
    const slideCtx = result.slides.map((s, i) => `Slide ${i + 1}: ${s.headline}`).join("\n");
    const userPrompt = `Buat caption Instagram untuk post tentang: "${result.topic}"
Tone: ${result.tone} — ${TONE_DESC[result.tone]}
${slideCtx ? `Konteks slide:\n${slideCtx}` : ""}

Struktur WAJIB:
1. Hook 1 kalimat + emoji relevan
2. Pertanyaan/masalah yang relate audiens (1-2 kalimat)
3. Penjelasan inti (2-3 kalimat)
4. Kalimat penutup inspiratif
5. "-"
6. "📌 [CTA konsultasi Rely Consulting Group]"
7. "📱 @relycg"

JSON: {"text":"isi caption dengan \\n antar paragraf","hashtags":["#RelyConsulting","...6-7 hashtag relevan"]}`;

    try {
      const data = await callGemini(sysPrompt, userPrompt);
      setResults((prev) => prev.map((r) => r.id === id
        ? { ...r, loadingCaption: false, caption: { text: data.text, hashtags: data.hashtags ?? [] } }
        : r));
    } catch (err) {
      console.error(err);
      handleApiError(err);
      const cap = generateCaption(result.topic, result.tone);
      setResults((prev) => prev.map((r) => r.id === id ? { ...r, loadingCaption: false, caption: cap } : r));
    }
  }

  async function handleRegenerateCaption(id: string) {
    return handleGenerateCaption(id);
  }

  function addToLibrary(result: GeneratedResult) {
    const item: ContentItem = {
      id: Date.now().toString(),
      topic: result.topic,
      format: result.format,
      tone: result.tone,
      slides: result.slides,
      hashtags: result.hashtags,
      caption: result.caption,
      status: "Draft",
      createdAt: new Date().toISOString().split("T")[0],
    };
    onAddToLibrary(item);
    addToast("Konten disimpan ke Library");
  }

  const effectiveCount = format === "Single Post" ? 1 : slideCount;

  return (
    <div className="flex gap-6 h-full p-6 min-h-0">
      {/* Left: Form */}
      <div className="w-96 flex-shrink-0 overflow-y-auto pr-1" style={{ scrollbarWidth: "none" }}>
        <GlassCard className="p-5 flex flex-col gap-5">
          <div>
            <h2 className="text-lg font-bold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#F0F6FF" }}>
              Brief Konten
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "#4A6FA5" }}>Isi detail untuk generate konten Instagram</p>
          </div>

          {/* Topic */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold" style={{ color: "#94B4D4" }}>Topik / Tema</label>
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Tips legalitas untuk UMKM yang baru berdiri"
              className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all duration-200"
              style={{ background: "rgba(15,30,58,0.6)", border: "1px solid rgba(96,165,250,0.2)", color: "#F0F6FF" }}
              onFocus={(e) => { e.currentTarget.style.border = "1px solid rgba(96,165,250,0.5)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.15)"; }}
              onBlur={(e) => { e.currentTarget.style.border = "1px solid rgba(96,165,250,0.2)"; e.currentTarget.style.boxShadow = "none"; }}
            />
            <div className="flex flex-wrap gap-1.5">
              {quickTopics.map((t) => (
                <button key={t} onClick={() => setTopic(t)}
                  className="px-2.5 py-1 rounded-lg text-xs cursor-pointer transition-all"
                  style={{ background: "rgba(21,40,71,0.7)", border: "1px solid rgba(96,165,250,0.15)", color: "#4A6FA5" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#60A5FA"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(96,165,250,0.3)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#4A6FA5"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(96,165,250,0.15)"; }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Audience */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold" style={{ color: "#94B4D4" }}>Target Audiens</label>
            <div className="flex flex-wrap gap-1.5">
              {audiences.map((a) => <Chip key={a} label={a} active={audience === a} onClick={() => setAudience(a)} />)}
            </div>
          </div>

          {/* Goal */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold" style={{ color: "#94B4D4" }}>Content Goal</label>
            <div className="flex flex-wrap gap-1.5">
              {goals_list.map((g) => <Chip key={g} label={g} active={goals.includes(g)} onClick={() => toggleGoal(g)} />)}
            </div>
          </div>

          {/* Format */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold" style={{ color: "#94B4D4" }}>Format</label>
            <div className="flex flex-wrap gap-1.5">
              {formats.map((f) => <Chip key={f} label={f} active={format === f} onClick={() => { setFormat(f); if (f === "Single Post") setSlideCount(1); }} />)}
            </div>
          </div>

          {/* Tone */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold" style={{ color: "#94B4D4" }}>Tone of Voice</label>
            <div className="flex flex-wrap gap-1.5">
              {tones.map((t) => <Chip key={t} label={t} active={tone === t} onClick={() => setTone(t)} />)}
            </div>
          </div>

          {/* Slide / Scene count */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold" style={{ color: "#94B4D4" }}>
              {format === "Reels Script" ? "Jumlah Scene" : "Jumlah Slide"}
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => { if (format !== "Single Post" && slideCount > 1) setSlideCount((n) => n - 1); }}
                disabled={format === "Single Post" || slideCount <= 1}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-all cursor-pointer disabled:opacity-30"
                style={{ background: "rgba(37,99,235,0.15)", border: "1px solid rgba(37,99,235,0.3)", color: "#60A5FA" }}
              >−</button>
              <div className="flex-1 flex gap-1">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <button
                    key={n}
                    onClick={() => { if (format !== "Single Post") setSlideCount(n); }}
                    disabled={format === "Single Post"}
                    className="flex-1 h-7 rounded text-xs font-bold transition-all cursor-pointer disabled:cursor-not-allowed"
                    style={{
                      background: effectiveCount === n ? "linear-gradient(135deg, #1A4FBF, #2563EB)" : "rgba(21,40,71,0.6)",
                      color: effectiveCount === n ? "#fff" : "#4A6FA5",
                      border: effectiveCount === n ? "1px solid rgba(96,165,250,0.3)" : "1px solid rgba(96,165,250,0.1)",
                    }}
                  >{n}</button>
                ))}
              </div>
              <button
                onClick={() => { if (format !== "Single Post" && slideCount < 8) setSlideCount((n) => n + 1); }}
                disabled={format === "Single Post" || slideCount >= 8}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-all cursor-pointer disabled:opacity-30"
                style={{ background: "rgba(37,99,235,0.15)", border: "1px solid rgba(37,99,235,0.3)", color: "#60A5FA" }}
              >+</button>
            </div>
          </div>

          {/* Generate button */}
          <button
            onClick={generate}
            disabled={loading || !topic.trim()}
            className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all duration-300 cursor-pointer disabled:cursor-not-allowed"
            style={{
              background: loading || !topic.trim() ? "rgba(26,79,191,0.3)" : "linear-gradient(135deg, #1A4FBF 0%, #2563EB 100%)",
              color: "#F0F6FF",
              boxShadow: loading || !topic.trim() ? "none" : "0 0 24px rgba(37,99,235,0.4)",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {apiKey ? "Rely AI sedang menyusun konten..." : "AI sedang menyusun konten..."}
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Generate with AI
              </>
            )}
          </button>
        </GlassCard>
      </div>

      {/* Right: Results */}
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
        {results.length === 0 && !loading ? (
          <div className="h-full flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(37,99,235,0.08)", border: "1px solid rgba(96,165,250,0.15)" }}>
              <Sparkles size={28} color="#2563EB" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-base" style={{ color: "#F0F6FF" }}>Siap untuk Generate</p>
              <p className="text-sm mt-1" style={{ color: "#4A6FA5" }}>Hasil generate AI akan muncul di sini</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-5 pb-4">
            {results.map((r) => (
              <ResultCard
                key={r.id}
                result={r}
                onRegenerate={regenerate}
                onGenerateCaption={handleGenerateCaption}
                onAddToLibrary={addToLibrary}
                onRegenerateCaption={handleRegenerateCaption}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Calendar Page ────────────────────────────────────────────────────────────

function CalendarPage({ library, onSchedule, onUnschedule, addToast }: {
  library: ContentItem[];
  onSchedule: (id: string, date: string) => void;
  onUnschedule: (id: string) => void;
  addToast: (msg: string) => void;
}) {
  const today = new Date();
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(today.getFullYear() === 2026 ? today.getMonth() : 5); // default June 2026
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [hoveredHoliday, setHoveredHoliday] = useState<string | null>(null);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  }

  function getItemsForDay(key: string) {
    return library.filter((item) => item.scheduledDate === key);
  }

  const selectedItems = selectedDate ? getItemsForDay(selectedDate) : [];
  const unscheduled = library.filter((item) => !item.scheduledDate && item.status !== "Posted");

  function scheduleItem(itemId: string) {
    if (!selectedDate) return;
    onSchedule(itemId, selectedDate);
    addToast("Konten dijadwalkan");
  }

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  while (weeks[weeks.length - 1].length < 7) weeks[weeks.length - 1].push(null);

  return (
    <div className="flex gap-0 h-full min-h-0">
      <div className="flex-1 flex flex-col min-h-0 p-6">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#F0F6FF" }}>
              Content Calendar
            </h2>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl" style={{
              background: "rgba(37,99,235,0.1)", border: "1px solid rgba(37,99,235,0.2)"
            }}>
              <button onClick={prevMonth} className="cursor-pointer transition-colors" style={{ color: "#60A5FA" }}>
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm font-semibold w-32 text-center" style={{ color: "#F0F6FF" }}>
                {MONTHS_ID[month]} {year}
              </span>
              <button onClick={nextMonth} className="cursor-pointer transition-colors" style={{ color: "#60A5FA" }}>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs" style={{ color: "#4A6FA5" }}>
            <div className="w-3 h-3 rounded-full" style={{ background: "rgba(239,68,68,0.6)" }} />
            <span>Tanggal Merah</span>
            <div className="w-3 h-3 rounded-full ml-3" style={{ background: "rgba(37,99,235,0.6)" }} />
            <span>Ada Konten</span>
          </div>
        </div>

        {/* Calendar */}
        <GlassCard className="flex-1 overflow-hidden flex flex-col p-4">
          {/* Day headers */}
          <div className="grid grid-cols-7 mb-2">
            {DAYS_ID.map((d) => (
              <div key={d} className="text-center text-xs font-bold py-2" style={{
                color: d === "Min" ? "#EF4444" : "#4A6FA5",
                fontFamily: "'JetBrains Mono', monospace"
              }}>
                {d}
              </div>
            ))}
          </div>

          {/* Weeks */}
          <div className="flex-1 flex flex-col gap-1">
            {weeks.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7 gap-1 flex-1">
                {week.map((day, di) => {
                  if (!day) return <div key={di} />;
                  const key = dateKey(year, month, day);
                  const holiday = HOLIDAYS_2026[key];
                  const items = getItemsForDay(key);
                  const isSelected = selectedDate === key;
                  const isToday = key === `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
                  const isSunday = di === 6;

                  return (
                    <button
                      key={di}
                      onClick={() => setSelectedDate(isSelected ? null : key)}
                      className="relative rounded-xl p-1.5 text-left flex flex-col gap-1 cursor-pointer transition-all duration-200 min-h-0"
                      style={{
                        background: isSelected
                          ? "rgba(37,99,235,0.2)"
                          : holiday
                            ? "rgba(239,68,68,0.06)"
                            : "rgba(15,30,58,0.5)",
                        border: isSelected
                          ? "1px solid rgba(37,99,235,0.5)"
                          : holiday
                            ? "1px solid rgba(239,68,68,0.2)"
                            : "1px solid rgba(96,165,250,0.08)",
                      }}
                      onMouseEnter={(e) => {
                        setHoveredHoliday(holiday ? key : null);
                        if (!isSelected) (e.currentTarget as HTMLElement).style.background = "rgba(37,99,235,0.1)";
                      }}
                      onMouseLeave={(e) => {
                        setHoveredHoliday(null);
                        if (!isSelected) (e.currentTarget as HTMLElement).style.background = holiday ? "rgba(239,68,68,0.06)" : "rgba(15,30,58,0.5)";
                      }}
                    >
                      <span className="text-xs font-bold" style={{
                        color: holiday ? "#EF4444" : isSunday ? "#EF4444" : isToday ? "#60A5FA" : "#94B4D4",
                        fontFamily: "'JetBrains Mono', monospace"
                      }}>
                        {day}
                        {isToday && <span className="ml-1 text-xs" style={{ color: "#60A5FA" }}>•</span>}
                      </span>

                      {/* Holiday tooltip */}
                      {holiday && hoveredHoliday === key && (
                        <div className="absolute bottom-full left-0 z-20 mb-1 px-2 py-1 rounded-lg text-xs whitespace-nowrap"
                          style={{
                            background: "rgba(13,41,81,0.98)", border: "1px solid rgba(239,68,68,0.3)",
                            color: "#FCA5A5", boxShadow: "0 4px 16px rgba(0,0,0,0.5)", backdropFilter: "blur(8px)"
                          }}>
                          {holiday}
                        </div>
                      )}

                      {/* Content items */}
                      {items.slice(0, 2).map((item) => (
                        <div key={item.id} className="text-xs px-1.5 py-0.5 rounded-md truncate" style={{
                          background: "rgba(37,99,235,0.2)", borderLeft: "2px solid #2563EB",
                          color: "#93C5FD", maxWidth: "100%"
                        }}>
                          {item.topic}
                        </div>
                      ))}
                      {items.length > 2 && (
                        <span className="text-xs" style={{ color: "#4A6FA5" }}>+{items.length - 2} lainnya</span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Right panel */}
      <div className="w-72 flex-shrink-0 flex flex-col p-6 pl-0 gap-4 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
        {selectedDate ? (
          <>
            <GlassCard className="p-4">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs" style={{ color: "#4A6FA5" }}>Tanggal Dipilih</p>
                  <h3 className="font-bold text-sm mt-0.5" style={{ color: "#F0F6FF", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    {formatDate(selectedDate)}
                  </h3>
                  {HOLIDAYS_2026[selectedDate] && (
                    <span className="text-xs mt-1 inline-block px-2 py-0.5 rounded-full" style={{
                      background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#FCA5A5"
                    }}>
                      🔴 {HOLIDAYS_2026[selectedDate]}
                    </span>
                  )}
                </div>
                <button onClick={() => setSelectedDate(null)} className="cursor-pointer" style={{ color: "#4A6FA5" }}>
                  <X size={16} />
                </button>
              </div>

              {selectedItems.length === 0 ? (
                <p className="text-xs" style={{ color: "#4A6FA5" }}>Tidak ada konten terjadwal</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {selectedItems.map((item) => (
                    <div key={item.id} className="flex items-start gap-2 p-2.5 rounded-xl" style={{
                      background: "rgba(10,22,40,0.6)", border: "1px solid rgba(96,165,250,0.1)"
                    }}>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate" style={{ color: "#F0F6FF" }}>{item.topic}</p>
                        <p className="text-xs mt-0.5" style={{ color: "#4A6FA5" }}>{item.format} · {item.tone}</p>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <StatusBadge status={item.status} />
                        <button
                          onClick={() => { onUnschedule(item.id); addToast("Jadwal dibatalkan"); }}
                          title="Batalkan jadwal"
                          className="cursor-pointer rounded-lg p-1 transition-all"
                          style={{
                            background: "rgba(239,68,68,0.1)",
                            border: "1px solid rgba(239,68,68,0.25)",
                            color: "#F87171",
                            display: "flex", alignItems: "center",
                          }}
                        >
                          <X size={12} strokeWidth={2.5} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>

            {/* Jadwalkan dari Library */}
            {unscheduled.length > 0 && (
              <GlassCard className="p-4">
                <h4 className="text-xs font-bold mb-3" style={{ color: "#94B4D4" }}>Jadwalkan dari Library</h4>
                <div className="flex flex-col gap-2 max-h-64 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
                  {unscheduled.map((item) => (
                    <div key={item.id} className="flex items-center gap-2 p-2.5 rounded-xl" style={{
                      background: "rgba(10,22,40,0.6)", border: "1px solid rgba(96,165,250,0.1)"
                    }}>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate" style={{ color: "#F0F6FF" }}>{item.topic}</p>
                        <p className="text-xs mt-0.5" style={{ color: "#4A6FA5" }}>{item.format}</p>
                      </div>
                      <button onClick={() => scheduleItem(item.id)}
                        className="text-xs px-2 py-1 rounded-lg cursor-pointer transition-all flex-shrink-0"
                        style={{ background: "rgba(37,99,235,0.2)", border: "1px solid rgba(37,99,235,0.3)", color: "#60A5FA" }}>
                        + Jadwal
                      </button>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-3 mt-12">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(37,99,235,0.08)", border: "1px solid rgba(96,165,250,0.15)" }}>
              <CalendarDays size={22} color="#2563EB" />
            </div>
            <p className="text-xs text-center" style={{ color: "#4A6FA5" }}>Pilih tanggal untuk melihat detail dan jadwalkan konten</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Library Page ─────────────────────────────────────────────────────────────

function AddContentModal({ onClose, onSave }: { onClose: () => void; onSave: (item: ContentItem) => void }) {
  const [topic, setTopic] = useState("");
  const [format, setFormat] = useState<Format>("Carousel");
  const [slideCount, setSlideCount] = useState(3);
  const [slides, setSlides] = useState<Slide[]>([{ headline: "", subheadline: "", isi: "" }]);
  const [caption, setCaption] = useState("");
  const [hashtag, setHashtag] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [status, setStatus] = useState<Status>("Draft");

  useEffect(() => {
    const count = format === "Single Post" ? 1 : slideCount;
    setSlides((prev) => {
      const next = [...prev];
      while (next.length < count) next.push({ headline: "", subheadline: "", isi: "" });
      return next.slice(0, count);
    });
  }, [format, slideCount]);

  function updateSlide(i: number, field: keyof Slide, value: string) {
    setSlides((prev) => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s));
  }

  function addHashtag() {
    const h = hashtag.trim().startsWith("#") ? hashtag.trim() : `#${hashtag.trim()}`;
    if (h.length > 1 && !hashtags.includes(h)) { setHashtags((prev) => [...prev, h]); setHashtag(""); }
  }

  function save() {
    if (!topic.trim()) return;
    const item: ContentItem = {
      id: Date.now().toString(),
      topic: topic.trim(),
      format,
      tone: "Formal",
      slides: slides.filter((s) => s.headline.trim()),
      hashtags,
      caption: caption.trim() ? { text: caption.trim(), hashtags } : undefined,
      status,
      createdAt: new Date().toISOString().split("T")[0],
    };
    onSave(item);
  }

  const formats: Format[] = ["Single Post", "Carousel", "Reels Script"];
  const statuses: Status[] = ["Draft", "Scheduled", "Posted"];

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-6"
      style={{ background: "rgba(10,22,40,0.8)", backdropFilter: "blur(8px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <GlassCard className="w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col" style={{ scrollbarWidth: "none" }}>
        <div className="flex items-center justify-between p-6 pb-4" style={{ borderBottom: "1px solid rgba(96,165,250,0.1)" }}>
          <div>
            <h2 className="font-bold text-lg" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#F0F6FF" }}>Tambah Konten Manual</h2>
            <p className="text-xs mt-0.5" style={{ color: "#4A6FA5" }}>Tulis konten Instagram secara manual</p>
          </div>
          <button onClick={onClose} className="cursor-pointer transition-colors p-1" style={{ color: "#4A6FA5" }}>
            <X size={20} />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-5">
          <InputField label="Judul / Topik" value={topic} onChange={setTopic} placeholder="e.g. Tips Legalitas UMKM" />

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold" style={{ color: "#94B4D4" }}>Format</label>
            <div className="flex gap-2">
              {formats.map((f) => <Chip key={f} label={f} active={format === f} onClick={() => setFormat(f)} />)}
            </div>
          </div>

          {format !== "Single Post" && (
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold" style={{ color: "#94B4D4" }}>Jumlah Slide</label>
              <div className="flex items-center gap-2">
                <button onClick={() => setSlideCount((n) => Math.max(1, n - 1))}
                  className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer"
                  style={{ background: "rgba(37,99,235,0.15)", border: "1px solid rgba(37,99,235,0.3)", color: "#60A5FA" }}>−</button>
                <span className="text-sm font-bold w-8 text-center" style={{ color: "#F0F6FF" }}>{slideCount}</span>
                <button onClick={() => setSlideCount((n) => Math.min(8, n + 1))}
                  className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer"
                  style={{ background: "rgba(37,99,235,0.15)", border: "1px solid rgba(37,99,235,0.3)", color: "#60A5FA" }}>+</button>
              </div>
            </div>
          )}

          {/* Slides */}
          <div className="flex flex-col gap-3">
            <label className="text-xs font-semibold" style={{ color: "#94B4D4" }}>Konten Slide</label>
            {slides.map((slide, i) => (
              <div key={i} className="p-4 rounded-xl flex flex-col gap-3" style={{
                background: "rgba(10,22,40,0.6)", border: "1px solid rgba(96,165,250,0.1)"
              }}>
                <span className="text-xs font-mono font-bold" style={{ color: "#4A6FA5" }}>SLIDE {i + 1}</span>
                <InputField label="Headline" value={slide.headline} onChange={(v) => updateSlide(i, "headline", v)} placeholder="Judul utama slide" />
                <InputField label="Subheadline" value={slide.subheadline || ""} onChange={(v) => updateSlide(i, "subheadline", v)} placeholder="Kalimat pendukung" />
                <TextareaField label="Isi" value={slide.isi || ""} onChange={(v) => updateSlide(i, "isi", v)} placeholder="Konten utama slide" rows={3} />
                {i === slides.length - 1 && (
                  <InputField label="CTA" value={slide.cta || ""} onChange={(v) => updateSlide(i, "cta", v)} placeholder="Call to action" />
                )}
              </div>
            ))}
          </div>

          <TextareaField label="Caption Instagram" value={caption} onChange={setCaption}
            placeholder="Hook... &#10;&#10;Pertanyaan/masalah...&#10;&#10;Penjelasan...&#10;&#10;-&#10;📌 CTA bersama Rely Consulting&#10;📱 @relycg&#10;#Hashtag" rows={6} />

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold" style={{ color: "#94B4D4" }}>Hashtag</label>
            <div className="flex gap-2">
              <input value={hashtag} onChange={(e) => setHashtag(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") addHashtag(); }}
                placeholder="#TambahHashtag"
                className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
                style={{ background: "rgba(15,30,58,0.6)", border: "1px solid rgba(96,165,250,0.2)", color: "#F0F6FF" }} />
              <button onClick={addHashtag} className="px-3 py-2 rounded-xl cursor-pointer"
                style={{ background: "rgba(37,99,235,0.2)", border: "1px solid rgba(37,99,235,0.3)", color: "#60A5FA" }}>
                <Plus size={16} />
              </button>
            </div>
            {hashtags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-1">
                {hashtags.map((h) => (
                  <span key={h} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full"
                    style={{ background: "rgba(37,99,235,0.1)", border: "1px solid rgba(96,165,250,0.2)", color: "#60A5FA" }}>
                    {h}
                    <button onClick={() => setHashtags((prev) => prev.filter((x) => x !== h))} className="cursor-pointer" style={{ color: "#4A6FA5" }}>
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold" style={{ color: "#94B4D4" }}>Status</label>
            <div className="flex gap-2">
              {statuses.map((s) => <Chip key={s} label={s} active={status === s} onClick={() => setStatus(s)} />)}
            </div>
          </div>
        </div>

        <div className="px-6 pb-6 flex justify-end gap-3">
          <GhostBtn onClick={onClose}>Batal</GhostBtn>
          <PrimaryBtn onClick={save} disabled={!topic.trim()}>
            <BookOpen size={14} /> Simpan ke Library
          </PrimaryBtn>
        </div>
      </GlassCard>
    </div>
  );
}

function ContentDetailModal({ item, onClose, designTasks }: { item: ContentItem; onClose: () => void; designTasks?: DesignTask[] }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    const text = item.slides.map((s, i) => `Slide ${i + 1}:\n${s.headline}\n${s.subheadline || ""}\n${s.isi || ""}`).join("\n\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-6"
      style={{ background: "rgba(10,22,40,0.85)", backdropFilter: "blur(8px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <GlassCard className="w-full max-w-2xl max-h-[90vh] overflow-y-auto" style={{ scrollbarWidth: "none" }}>
        <div className="flex items-start justify-between p-6 pb-4" style={{ borderBottom: "1px solid rgba(96,165,250,0.1)" }}>
          <div className="flex-1 mr-4">
            <div className="flex items-center gap-2 mb-2">
              <StatusBadge status={item.status} />
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(37,99,235,0.12)", border: "1px solid rgba(37,99,235,0.25)", color: "#60A5FA" }}>
                {item.format}
              </span>
            </div>
            <h2 className="font-bold text-lg" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#F0F6FF" }}>{item.topic}</h2>
            <p className="text-xs mt-1" style={{ color: "#4A6FA5" }}>
              {item.tone} · {item.slides.length} slide · Dibuat {formatDate(item.createdAt)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleCopy} className="p-2 rounded-lg cursor-pointer" style={{ color: copied ? "#34D399" : "#4A6FA5" }}>
              {copied ? <Check size={16} /> : <Copy size={16} />}
            </button>
            <button onClick={onClose} className="cursor-pointer p-1" style={{ color: "#4A6FA5" }}>
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6 flex flex-col gap-4">
          {item.slides.map((slide, i) => (
            <SlideCard key={i} slide={slide} index={i} total={item.slides.length} />
          ))}

          {item.caption && (
            <div className="rounded-xl p-4" style={{ background: "rgba(10,22,40,0.8)", border: "1px solid rgba(96,165,250,0.15)" }}>
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare size={14} color="#60A5FA" />
                <span className="text-xs font-semibold" style={{ color: "#60A5FA" }}>Caption Instagram</span>
              </div>
              <pre className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: "#94B4D4", fontFamily: "'DM Sans', sans-serif" }}>
                {item.caption.text}
              </pre>
              {item.caption.hashtags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3 pt-3" style={{ borderTop: "1px solid rgba(96,165,250,0.1)" }}>
                  {item.caption.hashtags.map((h) => (
                    <span key={h} className="text-xs px-2 py-0.5 rounded-full" style={{
                      background: "rgba(37,99,235,0.1)", border: "1px solid rgba(96,165,250,0.15)", color: "#60A5FA"
                    }}>{h}</span>
                  ))}
                </div>
              )}
            </div>
          )}

          {item.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {item.hashtags.map((h) => (
                <span key={h} className="text-xs px-2.5 py-1 rounded-full" style={{
                  background: "rgba(37,99,235,0.08)", border: "1px solid rgba(96,165,250,0.12)", color: "#60A5FA"
                }}>{h}</span>
              ))}
            </div>
          )}

          {/* File Desain from Designer */}
          {(() => {
            const dTask = designTasks ? designTasks.find((t) => t.contentId === item.id) : null;
            const links = dTask?.driveLinks || [];
            return (
              <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(96,165,250,0.12)" }}>
                <div className="px-4 pt-4 pb-3 flex items-center gap-2" style={{ borderBottom: "1px solid rgba(96,165,250,0.08)" }}>
                  <Palette size={14} color="#60A5FA" />
                  <span className="text-xs font-semibold" style={{ color: "#60A5FA" }}>File Desain</span>
                </div>
                <div className="p-4">
                  {links.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      {links.map((link, idx) => (
                        <div key={idx} className="flex items-center gap-2 px-3 py-2 rounded-xl"
                          style={{ background: "rgba(10,22,40,0.7)", border: "1px solid rgba(96,165,250,0.1)" }}>
                          <ExternalLink size={12} color="#60A5FA" />
                          <span className="flex-1 text-xs truncate" style={{ color: "#94B4D4" }}>{link}</span>
                          <a href={link} target="_blank" rel="noreferrer"
                            className="text-xs px-2 py-1 rounded-lg cursor-pointer"
                            style={{ background: "rgba(37,99,235,0.15)", border: "1px solid rgba(37,99,235,0.3)", color: "#60A5FA" }}>
                            Buka di Drive
                          </a>
                        </div>
                      ))}
                      <p className="text-xs mt-1" style={{ color: "#4A6FA5" }}>Diunggah oleh Designer</p>
                    </div>
                  ) : (
                    <p className="text-xs" style={{ color: "#4A6FA5" }}>
                      Desain belum tersedia. Designer sedang mengerjakan.
                    </p>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      </GlassCard>
    </div>
  );
}


function EditContentModal({ item, onClose, onSave }: {
  item: ContentItem;
  onClose: () => void;
  onSave: (updated: ContentItem) => void;
}) {
  const [topic, setTopic] = useState(item.topic);
  const [slides, setSlides] = useState<Slide[]>(item.slides.map((s) => ({ ...s })));
  const [captionText, setCaptionText] = useState(item.caption?.text || "");

  function updateSlideField(index: number, field: keyof Slide, value: string) {
    setSlides((prev) => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
  }

  function handleSave() {
    const updated: ContentItem = {
      ...item,
      topic,
      slides,
      caption: captionText
        ? { text: captionText, hashtags: item.caption?.hashtags || [] }
        : item.caption,
    };
    onSave(updated);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: "rgba(10,22,40,0.9)", backdropFilter: "blur(8px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl flex flex-col"
        style={{ background: "rgba(13,41,81,0.95)", border: "1px solid rgba(96,165,250,0.2)", scrollbarWidth: "none" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4" style={{ borderBottom: "1px solid rgba(96,165,250,0.1)" }}>
          <div className="flex items-center gap-2">
            <Pencil size={16} color="#60A5FA" />
            <h2 className="font-bold text-base" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#F0F6FF" }}>
              Edit Konten
            </h2>
          </div>
          <button onClick={onClose} className="cursor-pointer p-1" style={{ color: "#4A6FA5" }}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col gap-5 flex-1">
          {/* Topik */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold" style={{ color: "#60A5FA" }}>Topik / Judul</label>
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-sm outline-none"
              style={{
                background: "rgba(10,22,40,0.8)",
                border: "1px solid rgba(96,165,250,0.2)",
                color: "#F0F6FF",
              }}
            />
          </div>

          {/* Slides */}
          <div className="flex flex-col gap-3">
            <label className="text-xs font-semibold" style={{ color: "#60A5FA" }}>Slide Konten</label>
            {slides.map((slide, i) => (
              <div
                key={i}
                className="rounded-xl p-4 flex flex-col gap-3"
                style={{ background: "rgba(10,22,40,0.6)", border: "1px solid rgba(96,165,250,0.12)" }}
              >
                <span className="text-xs font-semibold" style={{ color: "#4A6FA5" }}>
                  SLIDE {i + 1}{i === 0 ? " — Hook" : i === slides.length - 1 ? " — Penutup" : ""}
                </span>

                <div className="flex flex-col gap-1">
                  <label className="text-xs" style={{ color: "#4A6FA5" }}>Headline</label>
                  <input
                    value={slide.headline}
                    onChange={(e) => updateSlideField(i, "headline", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                    style={{ background: "rgba(10,22,40,0.8)", border: "1px solid rgba(96,165,250,0.15)", color: "#F0F6FF" }}
                  />
                </div>

                {(slide.subheadline !== undefined || i === 0) && (
                  <div className="flex flex-col gap-1">
                    <label className="text-xs" style={{ color: "#4A6FA5" }}>Subheadline</label>
                    <input
                      value={slide.subheadline || ""}
                      onChange={(e) => updateSlideField(i, "subheadline", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                      style={{ background: "rgba(10,22,40,0.8)", border: "1px solid rgba(96,165,250,0.15)", color: "#F0F6FF" }}
                    />
                  </div>
                )}

                {slide.isi !== undefined && (
                  <div className="flex flex-col gap-1">
                    <label className="text-xs" style={{ color: "#4A6FA5" }}>Isi</label>
                    <textarea
                      value={slide.isi}
                      onChange={(e) => updateSlideField(i, "isi", e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
                      style={{ background: "rgba(10,22,40,0.8)", border: "1px solid rgba(96,165,250,0.15)", color: "#F0F6FF" }}
                    />
                  </div>
                )}

                {slide.closing !== undefined && (
                  <div className="flex flex-col gap-1">
                    <label className="text-xs" style={{ color: "#4A6FA5" }}>Closing</label>
                    <input
                      value={slide.closing}
                      onChange={(e) => updateSlideField(i, "closing", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                      style={{ background: "rgba(10,22,40,0.8)", border: "1px solid rgba(96,165,250,0.15)", color: "#F0F6FF" }}
                    />
                  </div>
                )}

                {slide.cta !== undefined && (
                  <div className="flex flex-col gap-1">
                    <label className="text-xs" style={{ color: "#4A6FA5" }}>CTA</label>
                    <input
                      value={slide.cta}
                      onChange={(e) => updateSlideField(i, "cta", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                      style={{ background: "rgba(10,22,40,0.8)", border: "1px solid rgba(96,165,250,0.15)", color: "#F0F6FF" }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Caption */}
          {item.caption && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold" style={{ color: "#60A5FA" }}>Caption Instagram</label>
              <textarea
                value={captionText}
                onChange={(e) => setCaptionText(e.target.value)}
                rows={5}
                className="w-full px-3 py-2 rounded-xl text-sm outline-none resize-none"
                style={{ background: "rgba(10,22,40,0.8)", border: "1px solid rgba(96,165,250,0.2)", color: "#F0F6FF" }}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4" style={{ borderTop: "1px solid rgba(96,165,250,0.1)" }}>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm cursor-pointer"
            style={{ background: "rgba(96,165,250,0.08)", border: "1px solid rgba(96,165,250,0.15)", color: "#94B4D4" }}
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer flex items-center gap-2"
            style={{ background: "linear-gradient(135deg, #1D4ED8, #2563EB)", color: "#fff" }}
          >
            <Check size={14} /> Simpan Perubahan
          </button>
        </div>
      </div>
    </div>
  );
}

function LibraryPage({ library, loading, onDelete, addToast, onNavigateGenerate, onUpdateStatus, onEdit, designTasks }: {
  library: ContentItem[];
  loading?: boolean;
  onDelete: (id: string) => void;
  addToast: (msg: string) => void;
  onNavigateGenerate: () => void;
  onUpdateStatus: (id: string, status: Status) => void;
  onEdit: (item: ContentItem) => void;
  designTasks: DesignTask[];
}) {
  const [filter, setFilter] = useState<"Semua" | Status>("Semua");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
  const [editItem, setEditItem] = useState<ContentItem | null>(null);
  const [newItem, setNewItem] = useState<ContentItem | null>(null);

  const filters: ("Semua" | Status)[] = ["Semua", "Draft", "Scheduled", "Posted"];
  const filtered = filter === "Semua" ? library : library.filter((item) => item.status === filter);

  function handleSave(item: ContentItem) {
    setNewItem(item);
    setShowAddModal(false);
    addToast("Konten manual disimpan ke Library");
  }

  useEffect(() => {
    if (newItem) {
      onUpdateStatus(newItem.id, newItem.status);
      setNewItem(null);
    }
  }, [newItem]);

  return (
    <div className="flex flex-col h-full p-6 min-h-0">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#F0F6FF" }}>Content Library</h2>
          <p className="text-xs mt-0.5" style={{ color: "#4A6FA5" }}>{library.length} konten tersimpan</p>
        </div>
        <div className="flex items-center gap-3">
          <GhostBtn onClick={() => setShowAddModal(true)}>
            <Plus size={15} /> Konten
          </GhostBtn>
          <PrimaryBtn onClick={onNavigateGenerate}>
            <Sparkles size={15} /> Generate Konten
          </PrimaryBtn>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-5">
        {filters.map((f) => (
          <Chip key={f} label={f} active={filter === f} onClick={() => setFilter(f)} />
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
          <p className="text-sm" style={{ color: "#4A6FA5" }}>Memuat konten...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: "rgba(37,99,235,0.08)", border: "1px solid rgba(96,165,250,0.15)" }}>
            <Library size={28} color="#2563EB" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-base" style={{ color: "#F0F6FF" }}>Belum ada konten tersimpan</p>
            <p className="text-sm mt-1" style={{ color: "#4A6FA5" }}>Generate konten dengan AI atau tambahkan secara manual</p>
          </div>
          <PrimaryBtn onClick={onNavigateGenerate}>
            <Sparkles size={15} /> Generate Konten Pertama
          </PrimaryBtn>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
          <div className="grid grid-cols-1 gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
            {filtered.map((item) => (
              <GlassCard key={item.id} hover className="p-5 flex flex-col gap-3 cursor-pointer"
                style={{ cursor: "pointer" }}>
                {/* Card header */}
                <div className="flex items-start justify-between">
                  <StatusBadge status={item.status} />
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditItem(item); }}
                      className="p-1.5 rounded-lg cursor-pointer transition-colors"
                      style={{ color: "#4A6FA5" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#60A5FA"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#4A6FA5"; }}
                      title="Edit konten"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDelete(item.id); addToast("Konten dihapus"); }}
                      className="p-1.5 rounded-lg cursor-pointer transition-colors"
                      style={{ color: "#4A6FA5" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#EF4444"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#4A6FA5"; }}
                      title="Hapus konten"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div onClick={() => setSelectedItem(item)} className="flex-1">
                  <h3 className="font-bold text-sm" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#F0F6FF" }}>
                    {item.topic}
                  </h3>
                  {item.caption && (
                    <p className="text-xs mt-2 leading-relaxed" style={{
                      color: "#94B4D4",
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}>
                      {item.caption.text.replace(/\n/g, " ")}
                    </p>
                  )}
                  {!item.caption && item.slides[0] && (
                    <p className="text-xs mt-2" style={{ color: "#94B4D4" }}>
                      {item.slides[0].subheadline || item.slides[0].isi || "—"}
                    </p>
                  )}
                </div>

                {/* Meta */}
                <div className="flex flex-wrap items-center gap-2 pt-2" style={{ borderTop: "1px solid rgba(96,165,250,0.08)" }}>
                  <span className="flex items-center gap-1 text-xs" style={{ color: "#4A6FA5" }}>
                    <Layers size={11} /> {item.format}
                  </span>
                  <span className="flex items-center gap-1 text-xs" style={{ color: "#4A6FA5" }}>
                    <Tag size={11} /> {item.tone}
                  </span>
                  <span className="flex items-center gap-1 text-xs" style={{ color: "#4A6FA5" }}>
                    <FileText size={11} /> {item.slides.length} slide
                  </span>
                  <span className="flex items-center gap-1 text-xs ml-auto" style={{ color: "#4A6FA5" }}>
                    <Clock size={11} /> {formatDate(item.createdAt)}
                  </span>
                </div>

                {item.scheduledDate && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg" style={{
                    background: "rgba(37,99,235,0.1)", border: "1px solid rgba(37,99,235,0.2)"
                  }}>
                    <CalendarDays size={11} color="#60A5FA" />
                    <span className="text-xs" style={{ color: "#60A5FA" }}>
                      Dijadwalkan: {formatDate(item.scheduledDate)}
                    </span>
                  </div>
                )}
              </GlassCard>
            ))}
          </div>
        </div>
      )}

      {showAddModal && <AddContentModal onClose={() => setShowAddModal(false)} onSave={(item) => {
        handleSave(item);
      }} />}

      {selectedItem && <ContentDetailModal item={selectedItem} onClose={() => setSelectedItem(null)} designTasks={designTasks} />}

      {editItem && (
        <EditContentModal
          item={editItem}
          onClose={() => setEditItem(null)}
          onSave={(updated) => {
            onEdit(updated);
            setEditItem(null);
            addToast("Konten berhasil diperbarui");
          }}
        />
      )}
    </div>
  );
}

// ─── Designer Workspace Page ──────────────────────────────────────────────────

type DesignerFilter = "Semua" | DesignerStatus;

// Design tasks pakai ID yang sama dengan ContentItem dari library
const INITIAL_DESIGN_TASKS: DesignTask[] = [
  { contentId: "1", designerStatus: "Selesai", note: "Sudah menggunakan font Clash Display untuk headline. Warna disesuaikan dengan brand guideline Q2.", driveLinks: ["https://drive.google.com/drive/folders/abc123-tips-legalitas"], startedAt: "2026-06-20 09:15", finishedAt: "2026-06-21 14:30" },
  { contentId: "2", designerStatus: "Sedang Dikerjakan", note: "Sedang proses slide 3 dan 4. Revisi layout carousel.", driveLinks: [], startedAt: "2026-06-23 10:00" },
  { contentId: "3", designerStatus: "Belum Dikerjakan", note: "", driveLinks: [] },
  { contentId: "4", designerStatus: "Belum Dikerjakan", note: "", driveLinks: [] },
];

function DesignerStatusBadge({ status }: { status: DesignerStatus }) {
  const cfg = {
    "Belum Dikerjakan": { bg: "rgba(74,111,165,0.15)", border: "rgba(74,111,165,0.3)", color: "#94B4D4", dot: "#4A6FA5", pulse: false },
    "Sedang Dikerjakan": { bg: "rgba(37,99,235,0.15)", border: "rgba(37,99,235,0.4)", color: "#60A5FA", dot: "#2563EB", pulse: true },
    "Selesai": { bg: "rgba(16,185,129,0.15)", border: "rgba(16,185,129,0.35)", color: "#34D399", dot: "#10B981", pulse: false },
  }[status];
  return (
    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color }}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.pulse ? "animate-pulse" : ""}`}
        style={{ background: cfg.dot }} />
      {status}
    </span>
  );
}

function DesignerWorkspacePage({ addToast, onNavigateLibrary, library, designTasks, setDesignTasks }: {
  addToast: (msg: string) => void;
  onNavigateLibrary: () => void;
  library: ContentItem[];
  designTasks: DesignTask[];
  setDesignTasks: React.Dispatch<React.SetStateAction<DesignTask[]>>;
}) {
  const [filter, setFilter] = useState<DesignerFilter>("Semua");
  const [selectedId, setSelectedId] = useState<string | null>(library[0]?.id ?? null);
  const [driveInput, setDriveInput] = useState("");
  const [noteInput, setNoteInput] = useState("");
  const [slideExpanded, setSlideExpanded] = useState(true);
  const [captionExpanded, setCaptionExpanded] = useState(false);

  const filterOptions: DesignerFilter[] = ["Semua", "Belum Dikerjakan", "Sedang Dikerjakan", "Selesai"];

  const filtered = filter === "Semua" ? library : library.filter((q) => {
    const task = designTasks.find((t) => t.contentId === q.id);
    return (task?.designerStatus ?? "Belum Dikerjakan") === filter;
  });

  const selectedItem = selectedId ? library.find((q) => q.id === selectedId) ?? null : null;
  const selectedTask = selectedId ? designTasks.find((t) => t.contentId === selectedId) : null;

  // Sync note input when selection changes
  useEffect(() => {
    setNoteInput(selectedTask?.note || "");
    setDriveInput("");
  }, [selectedId]);

  function getTask(id: string): DesignTask {
    return designTasks.find((t) => t.contentId === id) ?? { contentId: id, designerStatus: "Belum Dikerjakan", note: "", driveLinks: [] };
  }

  function updateTask(id: string, patch: Partial<DesignTask>) {
    setDesignTasks((prev) => {
      const exists = prev.find((t) => t.contentId === id);
      if (exists) return prev.map((t) => t.contentId === id ? { ...t, ...patch } : t);
      return [...prev, { contentId: id, designerStatus: "Belum Dikerjakan", note: "", driveLinks: [], ...patch }];
    });
  }

  function setStatus(id: string, status: DesignerStatus) {
    const now = new Date().toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" });
    const patch: Partial<DesignTask> = { designerStatus: status };
    if (status === "Sedang Dikerjakan") patch.startedAt = now;
    if (status === "Selesai") patch.finishedAt = now;
    updateTask(id, patch);
    addToast(`Status diperbarui: ${status}`);
  }

  function saveNote(id: string) {
    updateTask(id, { note: noteInput });
    addToast("✓ Catatan designer disimpan");
  }

  function saveLink(id: string) {
    const link = driveInput.trim();
    if (!link) return;
    const task = getTask(id);
    updateTask(id, { driveLinks: [...task.driveLinks, link] });
    setDriveInput("");
    addToast("✓ Link desain disimpan ke konten ini");
  }

  function deleteLink(id: string, idx: number) {
    const task = getTask(id);
    updateTask(id, { driveLinks: task.driveLinks.filter((_, i) => i !== idx) });
    addToast("Link desain dihapus");
  }

  function markDone(id: string) {
    setStatus(id, "Selesai");
    addToast("✓ Desain ditandai selesai");
  }

  const statusOrder: DesignerStatus[] = ["Belum Dikerjakan", "Sedang Dikerjakan", "Selesai"];

  const activeTask = selectedItem ? getTask(selectedItem.id) : null;

  return (
    <div style={{ display: "flex", height: "100%", minHeight: 0, overflow: "hidden" }}>
      {/* ── Left: Queue ── */}
      <div style={{ width: 320, flexShrink: 0, display: "flex", flexDirection: "column", borderRight: "1px solid rgba(96,165,250,0.1)", height: "100%" }}>
        {/* Header */}
        <div className="px-5 pt-6 pb-4">
          <h2 className="text-lg font-bold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#F0F6FF" }}>Antrian Desain</h2>
          <p className="text-xs mt-0.5" style={{ color: "#4A6FA5" }}>Konten siap didesain</p>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {filterOptions.map((f) => (
              <Chip key={f} label={f} active={filter === f} onClick={() => setFilter(f)} />
            ))}
          </div>
        </div>

        {/* Queue list */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0 12px 16px", display: "flex", flexDirection: "column", gap: 8, scrollbarWidth: "none" }}>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3" style={{ paddingTop: 40 }}>
              <Palette size={28} color="#2563EB" />
              <p className="text-xs text-center" style={{ color: "#4A6FA5" }}>Belum ada konten di antrian ini.</p>
            </div>
          ) : (
            filtered.map((item) => {
              const task = getTask(item.id);
              const isSelected = selectedId === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedId(item.id)}
                  style={{
                    width: "100%", textAlign: "left", borderRadius: 12, padding: "14px 12px",
                    cursor: "pointer", position: "relative", overflow: "hidden",
                    background: isSelected ? "rgba(37,99,235,0.15)" : "rgba(15,30,58,0.5)",
                    border: isSelected ? "1px solid rgba(37,99,235,0.45)" : "1px solid rgba(96,165,250,0.1)",
                    boxShadow: isSelected ? "0 0 20px rgba(37,99,235,0.15)" : "none",
                    transition: "all 0.2s",
                  }}
                >
                  {/* Status left edge */}
                  <div style={{
                    position: "absolute", left: 0, top: 0, bottom: 0, width: 3, borderRadius: "12px 0 0 12px",
                    background: task.designerStatus === "Selesai" ? "#10B981"
                      : task.designerStatus === "Sedang Dikerjakan" ? "#2563EB" : "rgba(74,111,165,0.4)"
                  }} />
                  <div style={{ paddingLeft: 8 }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
                      <h3 style={{ fontSize: 13, fontWeight: 600, color: "#F0F6FF", fontFamily: "'Plus Jakarta Sans', sans-serif", lineHeight: 1.4, flex: 1 }}>
                        {item.topic}
                      </h3>
                      <DesignerStatusBadge status={task.designerStatus} />
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, background: "rgba(37,99,235,0.12)", border: "1px solid rgba(37,99,235,0.25)", color: "#60A5FA" }}>
                        {item.format}
                      </span>
                      <span style={{ fontSize: 11, color: "#4A6FA5" }}>{item.slides.length} slide</span>
                      <span style={{ fontSize: 11, color: "#4A6FA5", marginLeft: "auto" }}>{formatDate(item.createdAt)}</span>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── Right: Detail ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, minWidth: 0, overflow: "hidden" }}>
        {!selectedItem || !activeTask ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
            <div style={{ width: 64, height: 64, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(37,99,235,0.08)", border: "1px solid rgba(96,165,250,0.15)" }}>
              <Palette size={28} color="#2563EB" />
            </div>
            <p style={{ fontSize: 13, color: "#4A6FA5" }}>Pilih konten dari antrian untuk mulai mengerjakan desain.</p>
          </div>
        ) : (
          <>
            {/* Scrollable content */}
            <div style={{ flex: 1, overflowY: "auto", scrollbarWidth: "none" }}>
              <div className="p-6 flex flex-col gap-5 pb-28">

                {/* Section 1: Brief */}
                <GlassCard className="p-5">
                  <h3 className="text-sm font-bold mb-4" style={{ color: "#F0F6FF", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    Brief Konten
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Topik", val: selectedItem.topic },
                      { label: "Format", val: selectedItem.format },
                      { label: "Jumlah Slide", val: `${selectedItem.slides.length} slide` },
                      { label: "Tone of Voice", val: selectedItem.tone },
                      { label: "Status Konten", val: selectedItem.status },
                    ].map(({ label, val }) => (
                      <div key={label} className="p-3 rounded-xl" style={{ background: "rgba(10,22,40,0.6)", border: "1px solid rgba(96,165,250,0.08)" }}>
                        <p className="text-xs" style={{ color: "#4A6FA5" }}>{label}</p>
                        <p className="text-sm font-semibold mt-0.5" style={{ color: "#94B4D4" }}>{val}</p>
                      </div>
                    ))}
                  </div>
                </GlassCard>

                {/* Section 2: Slide Breakdown */}
                <GlassCard className="overflow-hidden">
                  <button
                    onClick={() => setSlideExpanded((v) => !v)}
                    className="w-full flex items-center justify-between p-5 cursor-pointer"
                    style={{ borderBottom: slideExpanded ? "1px solid rgba(96,165,250,0.08)" : "none" }}
                  >
                    <h3 className="text-sm font-bold" style={{ color: "#F0F6FF", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      Referensi Slide
                    </h3>
                    {slideExpanded ? <ChevronUp size={15} color="#4A6FA5" /> : <ChevronDown size={15} color="#4A6FA5" />}
                  </button>
                  {slideExpanded && (
                    <div className="px-5 pb-5 flex flex-col gap-3">
                      {selectedItem.slides.map((slide, i) => (
                        <div key={i} className="rounded-xl p-4" style={{ background: "rgba(10,22,40,0.7)", border: "1px solid rgba(96,165,250,0.1)" }}>
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-xs font-mono font-bold" style={{ color: "#4A6FA5" }}>
                              SLIDE {i + 1}/{selectedItem.slides.length}
                            </span>
                            {i === 0 && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(96,165,250,0.1)", border: "1px solid rgba(96,165,250,0.2)", color: "#93C5FD" }}>Hook</span>}
                            {i === selectedItem.slides.length - 1 && i !== 0 && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(37,99,235,0.15)", border: "1px solid rgba(37,99,235,0.3)", color: "#60A5FA" }}>Penutup</span>}
                          </div>
                          <div className="space-y-2">
                            <div>
                              <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#4A6FA5" }}>Headline</span>
                              <p className="text-sm font-bold mt-0.5" style={{ color: "#F0F6FF" }}>{slide.headline}</p>
                            </div>
                            {slide.subheadline && (
                              <div>
                                <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#4A6FA5" }}>Subheadline</span>
                                <p className="text-sm mt-0.5" style={{ color: "#94B4D4" }}>{slide.subheadline}</p>
                              </div>
                            )}
                            {slide.isi && (
                              <div>
                                <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#4A6FA5" }}>Isi</span>
                                <p className="text-sm mt-0.5" style={{ color: "#94B4D4" }}>{slide.isi}</p>
                              </div>
                            )}
                            {slide.cta && (
                              <div className="pt-2 mt-1" style={{ borderTop: "1px solid rgba(96,165,250,0.1)" }}>
                                <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#2563EB" }}>CTA</span>
                                <p className="text-sm mt-0.5 font-medium" style={{ color: "#60A5FA" }}>{slide.cta}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      {/* Caption preview */}
                      {selectedItem.caption && (
                        <>
                          <button
                            onClick={() => setCaptionExpanded((v) => !v)}
                            className="flex items-center gap-2 cursor-pointer mt-1"
                          >
                            <MessageSquare size={13} color="#60A5FA" />
                            <span className="text-xs font-semibold" style={{ color: "#60A5FA" }}>Preview Caption</span>
                            {captionExpanded ? <ChevronUp size={12} color="#4A6FA5" /> : <ChevronDown size={12} color="#4A6FA5" />}
                          </button>
                          {captionExpanded && (
                            <div className="rounded-xl p-4" style={{ background: "rgba(10,22,40,0.7)", border: "1px solid rgba(96,165,250,0.12)" }}>
                              <pre className="text-xs whitespace-pre-wrap leading-relaxed" style={{ color: "#94B4D4", fontFamily: "'DM Sans', sans-serif" }}>
                                {selectedItem.caption.text}
                              </pre>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </GlassCard>

                {/* Section 3: Status */}
                <GlassCard className="p-5 flex flex-col gap-4">
                  <h3 className="text-sm font-bold" style={{ color: "#F0F6FF", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    Status Pengerjaan
                  </h3>
                  {/* Status selector */}
                  <div className="flex gap-2">
                    {statusOrder.map((s) => {
                      const isActive = activeTask.designerStatus === s;
                      const cfg = {
                        "Belum Dikerjakan": { active: "rgba(74,111,165,0.25)", activeBorder: "rgba(74,111,165,0.5)", activeColor: "#94B4D4" },
                        "Sedang Dikerjakan": { active: "rgba(37,99,235,0.2)", activeBorder: "rgba(37,99,235,0.5)", activeColor: "#60A5FA" },
                        "Selesai": { active: "rgba(16,185,129,0.15)", activeBorder: "rgba(16,185,129,0.4)", activeColor: "#34D399" },
                      }[s];
                      return (
                        <button
                          key={s}
                          onClick={() => setStatus(selectedItem.id, s)}
                          className="flex-1 py-2 px-3 rounded-xl text-xs font-semibold cursor-pointer transition-all duration-200"
                          style={{
                            background: isActive ? cfg.active : "rgba(15,30,58,0.5)",
                            border: isActive ? `1px solid ${cfg.activeBorder}` : "1px solid rgba(96,165,250,0.1)",
                            color: isActive ? cfg.activeColor : "#4A6FA5",
                          }}
                        >
                          {s}
                        </button>
                      );
                    })}
                  </div>
                  {/* Timestamps */}
                  {activeTask.startedAt && (
                    <p className="text-xs" style={{ color: "#4A6FA5" }}>
                      ⏱ Mulai dikerjakan: <span style={{ color: "#60A5FA" }}>{activeTask.startedAt}</span>
                    </p>
                  )}
                  {activeTask.finishedAt && (
                    <p className="text-xs" style={{ color: "#4A6FA5" }}>
                      ✓ Selesai: <span style={{ color: "#34D399" }}>{activeTask.finishedAt}</span>
                    </p>
                  )}
                  {/* Note */}
                  <TextareaField
                    label="Catatan Designer"
                    value={noteInput}
                    onChange={setNoteInput}
                    placeholder="Tambahkan catatan untuk tim, misalnya: revisi warna di slide 3, font diganti ke Clash Display, dll."
                    rows={3}
                  />
                  <GhostBtn onClick={() => saveNote(selectedItem.id)}>
                    <Check size={13} /> Simpan Catatan
                  </GhostBtn>
                </GlassCard>

                {/* Section 4: File Desain */}
                <GlassCard className="overflow-hidden">
                  <div className="p-5 pb-0">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="h-0.5 w-6 rounded-full" style={{ background: "linear-gradient(90deg, #1A4FBF, #2563EB)" }} />
                      <h3 className="text-sm font-bold" style={{ color: "#F0F6FF", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        File Desain
                      </h3>
                    </div>

                    <div className="flex flex-col gap-3 mb-4">
                      <label className="text-xs font-semibold" style={{ color: "#94B4D4" }}>Link Google Drive</label>
                      <div className="flex gap-2">
                        <input
                          value={driveInput}
                          onChange={(e) => setDriveInput(e.target.value)}
                          placeholder="https://drive.google.com/drive/folders/..."
                          className="flex-1 px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all"
                          style={{ background: "rgba(15,30,58,0.6)", border: "1px solid rgba(96,165,250,0.2)", color: "#F0F6FF" }}
                          onFocus={(e) => { e.currentTarget.style.border = "1px solid rgba(96,165,250,0.5)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.15)"; }}
                          onBlur={(e) => { e.currentTarget.style.border = "1px solid rgba(96,165,250,0.2)"; e.currentTarget.style.boxShadow = "none"; }}
                          onKeyDown={(e) => { if (e.key === "Enter") saveLink(selectedItem.id); }}
                        />
                      </div>
                      <button
                        onClick={() => saveLink(selectedItem.id)}
                        disabled={!driveInput.trim()}
                        className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 transition-all"
                        style={{ background: "linear-gradient(135deg, #1A4FBF, #2563EB)", color: "#F0F6FF", boxShadow: driveInput.trim() ? "0 0 20px rgba(37,99,235,0.3)" : "none" }}
                      >
                        <Link size={14} /> Simpan Link
                      </button>
                    </div>

                    {/* Saved links */}
                    {activeTask.driveLinks.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs font-semibold mb-2" style={{ color: "#94B4D4" }}>File Tersimpan</p>
                        <div className="flex flex-col gap-2">
                          {activeTask.driveLinks.map((link, idx) => (
                            <div key={idx} className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                              style={{ background: "rgba(10,22,40,0.7)", border: "1px solid rgba(96,165,250,0.12)" }}>
                              <ExternalLink size={13} color="#60A5FA" className="flex-shrink-0" />
                              <span className="flex-1 text-xs truncate" style={{ color: "#94B4D4" }}>{link}</span>
                              <a href={link} target="_blank" rel="noreferrer"
                                className="text-xs px-2 py-1 rounded-lg cursor-pointer flex-shrink-0"
                                style={{ background: "rgba(37,99,235,0.15)", border: "1px solid rgba(37,99,235,0.3)", color: "#60A5FA" }}>
                                Buka
                              </a>
                              <button
                                onClick={() => deleteLink(selectedItem.id, idx)}
                                className="p-1 rounded-lg cursor-pointer flex-shrink-0 transition-colors"
                                style={{ color: "#4A6FA5" }}
                                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#EF4444"; }}
                                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#4A6FA5"; }}
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Info banner */}
                    <div className="mb-5 px-3 py-2.5 rounded-xl flex items-start gap-2"
                      style={{ background: "rgba(37,99,235,0.08)", borderLeft: "2px solid rgba(37,99,235,0.5)" }}>
                      <p className="text-xs leading-relaxed" style={{ color: "#4A6FA5" }}>
                        Link ini akan muncul di detail konten pada halaman Content Library.
                      </p>
                    </div>
                  </div>
                </GlassCard>
              </div>

            </div>

            {/* ── Footer (outside scroll, always visible) ── */}
            <div style={{
              flexShrink: 0, padding: "12px 24px", display: "flex", alignItems: "center", gap: 12,
              background: "linear-gradient(0deg, #0A1628 70%, rgba(10,22,40,0.8))",
              borderTop: "1px solid rgba(96,165,250,0.1)",
            }}>
              <button
                onClick={() => markDone(selectedItem.id)}
                disabled={activeTask.designerStatus === "Selesai"}
                style={{
                  display: "flex", alignItems: "center", gap: 8, padding: "10px 20px",
                  borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: "pointer",
                  background: activeTask.designerStatus === "Selesai" ? "rgba(16,185,129,0.15)" : "linear-gradient(135deg, #1A4FBF, #2563EB)",
                  border: activeTask.designerStatus === "Selesai" ? "1px solid rgba(16,185,129,0.3)" : "none",
                  color: activeTask.designerStatus === "Selesai" ? "#34D399" : "#F0F6FF",
                  boxShadow: activeTask.designerStatus !== "Selesai" ? "0 0 20px rgba(37,99,235,0.3)" : "none",
                  opacity: activeTask.designerStatus === "Selesai" ? 0.8 : 1,
                  transition: "all 0.2s",
                }}
              >
                <Check size={14} strokeWidth={2.5} />
                {activeTask.designerStatus === "Selesai" ? "Sudah Selesai" : "Tandai Selesai"}
              </button>
              <GhostBtn onClick={onNavigateLibrary}>
                Lihat di Content Library <ArrowRight size={13} />
              </GhostBtn>
              <div style={{ marginLeft: "auto" }}>
                <DesignerStatusBadge status={activeTask.designerStatus} />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── App Shell ────────────────────────────────────────────────────────────────

function rowToItem(row: any): ContentItem {
  return {
    id: row.id,
    topic: row.topic,
    format: row.format as Format,
    tone: row.tone as Tone,
    slides: row.slides as Slide[],
    hashtags: row.hashtags as string[],
    caption: row.caption as Caption | undefined,
    status: row.status as Status,
    createdAt: row.created_at,
    scheduledDate: row.scheduled_date ?? undefined,
  };
}

function itemToRow(item: ContentItem) {
  return {
    id: item.id,
    topic: item.topic,
    format: item.format,
    tone: item.tone,
    slides: item.slides,
    hashtags: item.hashtags,
    caption: item.caption ?? null,
    status: item.status,
    created_at: item.createdAt,
    scheduled_date: item.scheduledDate ?? null,
  };
}

export default function App() {
  const [page, setPage] = useState<Page>("generate");
  const [library, setLibrary] = useState<ContentItem[]>([]);
  const [loadingLibrary, setLoadingLibrary] = useState(true);
  const [designTasks, setDesignTasks] = useState<DesignTask[]>(INITIAL_DESIGN_TASKS);
  const [toasts, setToasts] = useState<ToastMsg[]>([]);

  useEffect(() => {
    async function fetchLibrary() {
      setLoadingLibrary(true);
      const { data, error } = await supabase
        .from("content_library")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && data) {
        setLibrary(data.map(rowToItem));
      }
      setLoadingLibrary(false);
    }
    fetchLibrary();
  }, []);

  function addToast(message: string) {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }

  function removeToast(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  async function addToLibrary(item: ContentItem) {
    setLibrary((prev) => [item, ...prev]);
    await supabase.from("content_library").insert(itemToRow(item));
  }

  async function deleteFromLibrary(id: string) {
    setLibrary((prev) => prev.filter((item) => item.id !== id));
    await supabase.from("content_library").delete().eq("id", id);
  }

  async function scheduleContent(id: string, date: string) {
    setLibrary((prev) => prev.map((item) =>
      item.id === id ? { ...item, scheduledDate: date, status: "Scheduled" } : item
    ));
    await supabase.from("content_library").update({ scheduled_date: date, status: "Scheduled" }).eq("id", id);
  }

  async function unscheduleContent(id: string) {
    setLibrary((prev) => prev.map((item) =>
      item.id === id ? { ...item, scheduledDate: undefined, status: "Draft" } : item
    ));
    await supabase.from("content_library").update({ scheduled_date: null, status: "Draft" }).eq("id", id);
  }

  async function updateStatus(id: string, status: Status) {
    setLibrary((prev) => {
      const exists = prev.find((item) => item.id === id);
      if (exists) return prev.map((item) => item.id === id ? { ...item, status } : item);
      return prev;
    });
    await supabase.from("content_library").update({ status }).eq("id", id);
  }

  async function updateLibraryItem(updated: ContentItem) {
    setLibrary((prev) => prev.map((item) => item.id === updated.id ? updated : item));
    await supabase.from("content_library").update(itemToRow(updated)).eq("id", updated.id);
  }

  return (
    <div
      className="flex h-screen w-full overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #0A1628 0%, #0D2951 50%, #1A3A6B 100%)",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* Background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <div className="absolute rounded-full"
          style={{ width: 600, height: 600, top: -200, right: -200, background: "radial-gradient(circle, rgba(37,99,235,0.12) 0%, transparent 70%)", filter: "blur(40px)" }} />
        <div className="absolute rounded-full"
          style={{ width: 400, height: 400, bottom: -100, left: -100, background: "radial-gradient(circle, rgba(26,79,191,0.1) 0%, transparent 70%)", filter: "blur(40px)" }} />
        <div className="absolute rounded-full"
          style={{ width: 300, height: 300, top: "50%", left: "40%", background: "radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%)", filter: "blur(60px)" }} />
      </div>

      <div className="relative flex w-full h-full" style={{ zIndex: 1 }}>
        <Sidebar current={page} onNavigate={setPage} />

        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {page === "generate" && (
            <GeneratePage onAddToLibrary={addToLibrary} addToast={addToast} />
          )}
          {page === "calendar" && (
            <CalendarPage library={library} onSchedule={scheduleContent} onUnschedule={unscheduleContent} addToast={addToast} />
          )}
          {page === "library" && (
            <LibraryPage
              library={library}
              loading={loadingLibrary}
              onDelete={deleteFromLibrary}
              addToast={addToast}
              onNavigateGenerate={() => setPage("generate")}
              onUpdateStatus={updateStatus}
              onEdit={updateLibraryItem}
              designTasks={designTasks}
            />
          )}
          {page === "designer" && (
            <DesignerWorkspacePage
              addToast={addToast}
              onNavigateLibrary={() => setPage("library")}
              library={library}
              designTasks={designTasks}
              setDesignTasks={setDesignTasks}
            />
          )}
        </main>
      </div>

      <Toast toasts={toasts} remove={removeToast} />
    </div>
  );
}

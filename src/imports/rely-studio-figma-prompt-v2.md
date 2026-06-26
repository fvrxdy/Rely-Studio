Berikut adalah prompt desain (revisi) untuk membuat website "Rely Studio" dengan sistem warna biru gradient premium dan gaya desain ultra-modern:

---

Create a complete high-fidelity desktop web application called "Rely Studio", an AI-powered Instagram content planning and generation platform for the digital marketing team of Rely Consulting Group.

---

PROJECT CONTEXT

Rely Studio is an internal AI tool used by the digital marketing team to generate Instagram carousel/post content (slide-by-slide copywriting: headline, subheadline, isi) and Instagram captions, organize them in a content calendar, and store them in a library — all centered around Rely Consulting Group's brand voice (business, legal, tax, financial, and IT consulting).

Content can be created in two ways: **AI-generated** (via the Generate Content page) or **manually written** (via a "+ Konten" form inside Content Library).

This is a single-team internal tool — no login/role system, no admin panel, no performance/analytics dashboard, no settings page. It opens directly into the app with a persistent left sidebar.

TARGET USER

Digital Marketing Team member who writes/generates and schedules Instagram content daily.

TECH NOTE: Build with **React** (component-based, functional components + hooks for state). This is a frontend-only/high-fidelity prototype — AI calls can be mocked with loading states (see "AI INTEGRATION" section below for the assumed API).

---

DESIGN STYLE & AESTHETIC DIRECTION

- Ultra-premium modern SaaS — inspired by Linear, Vercel, Clerk, Resend, and Stripe Dashboard
- Deep blue gradient system as the visual identity — dark navy to vibrant blue to soft sky blue
- Glassmorphism cards with frosted glass effects on gradient backgrounds
- Subtle mesh gradient backgrounds with soft glow orbs
- Micro-animations and smooth transitions throughout
- Clean, editorial, and breathtakingly spacious layout
- NOT generic — must feel like a $50M funded startup product
- Luxury fintech + creative studio atmosphere
- Trustworthy, intelligent, and cutting-edge

---

COLOR SYSTEM

```
Primary Dark:     #0A1628   (deep navy — background base)
Primary Mid:      #0D2951   (dark blue — sidebar, cards)
Primary Blue:     #1A4FBF   (brand blue — buttons, accents)
Accent Blue:      #2563EB   (vivid blue — CTAs, highlights)
Sky Blue:         #3B82F6   (medium blue — hover states)
Light Blue:       #60A5FA   (soft blue — tags, badges)
Ice Blue:         #BFDBFE   (very light blue — subtle tints)
Glow Blue:        #1D4ED8   (glow effect color)

Surface Dark:     #0F1E3A   (card backgrounds)
Surface Mid:      #152847   (elevated surfaces)
Surface Light:    #1E3A5F   (hover surfaces)

Text Primary:     #F0F6FF   (almost white)
Text Secondary:   #94B4D4   (muted blue-gray)
Text Muted:       #4A6FA5   (very muted)

Holiday Red:      #EF4444   (tanggal merah / public holiday marker on calendar)

Gradient Hero:    linear-gradient(135deg, #0A1628 0%, #0D2951 50%, #1A3A6B 100%)
Gradient Card:    linear-gradient(145deg, rgba(26,79,191,0.15) 0%, rgba(13,41,81,0.8) 100%)
Gradient Button:  linear-gradient(135deg, #1A4FBF 0%, #2563EB 100%)
Gradient Accent:  linear-gradient(135deg, #2563EB 0%, #60A5FA 100%)
Glow Effect:      0 0 40px rgba(37,99,235,0.4), 0 0 80px rgba(37,99,235,0.15)
```

---

VISUAL SYSTEM

- Border radius: 16–24px for cards, 12px for buttons, 8px for inputs
- Glassmorphism: `backdrop-filter: blur(16px)` on semi-transparent surfaces
- Borders: `1px solid rgba(96,165,250,0.15)` for subtle glass borders
- Shadows: layered blue-tinted shadows for depth
- Mesh gradient background with 2–3 glowing orbs per page
- Typography: **Clash Display** or **Cabinet Grotesk** for headings + **DM Sans** or **Outfit** for body
- Noise texture overlay (very subtle, 2–4% opacity) on backgrounds for premium feel
- Gradient text for hero headlines: `background-clip: text` with blue gradient
- Animated gradient borders on focus states
- Hover states: cards lift with blue glow shadow
- Icons: Lucide or Phosphor — always in soft blue tones
- Chips/tags: frosted glass style with light blue border
- Active sidebar items: gradient fill with left border accent

---

COMPONENT STYLE GUIDE

Buttons:
- Primary: gradient blue (#1A4FBF → #2563EB), white text, soft glow on hover
- Secondary: glass surface, light blue border, sky blue text
- Ghost: transparent, text in #60A5FA

Cards:
- Background: `linear-gradient(145deg, rgba(21,40,71,0.9), rgba(15,30,58,0.95))`
- Border: `1px solid rgba(96,165,250,0.12)`
- Hover: lift + blue glow shadow
- Glassmorphism variant for feature highlights

Input Fields & Textareas:
- Background: `rgba(15,30,58,0.6)`
- Border: `1px solid rgba(96,165,250,0.2)`, glows on focus
- Text: #F0F6FF, placeholder in #4A6FA5

Pills/Chips (selectable):
- Inactive: glass surface, muted text
- Active: gradient blue fill, white/light text, soft glow border

Tables/Grids:
- Dark surface rows or cards, alternating subtle tints
- Blue accent on selected/hovered rows
- Status badges: colored glass pills (Draft = muted gray-blue, Scheduled = blue glow, Posted = green glow)

Sidebar:
- Deep navy background with gradient
- Active items: glass fill with blue left border accent
- Icons: colored in #60A5FA

---

PLATFORM NAME

**Rely Studio**

TAGLINE

*Rencanakan, Buat, dan Kelola Konten Instagram dengan Kecerdasan AI*

---

NAVIGATION (Persistent Left Sidebar)

- Logo "Rely Studio" with small gradient icon mark at top
- Nav items with icons: **Generate Content**, **Content Calendar**, **Content Library**
- Active item highlighted with gradient fill + left border accent

(Performance Insight and Brand Settings pages have been removed from this version.)

---

PAGE 1 — GENERATE CONTENT (Core AI Feature, default landing page)

Two-column layout:

**Left: Input Brief Form** (glass card, ~380px wide)
- Topic/theme text input
- Quick-pick topic chip suggestions below input (e.g., "Tips Legalitas UMKM", "Edukasi Pajak Bulanan", "Studi Kasus Klien", "Promosi Layanan Konsultasi IT", "Quote Motivasi Bisnis")
- Target audience dropdown (UMKM, Startup, Korporat, General Public)
- Content goal selector chips (Edukasi, Promosi, Engagement, Awareness)
- Format selector chips (Single Post, Carousel, Reels Script) — selecting "Single Post" auto-locks slide count to 1
- Tone of voice selector chips (Formal, Santai, Storytelling)
- **Jumlah Slide selector**: a stepper/segmented control to choose how many slides to generate (range 1–8), only editable when format is Carousel or Reels Script
- Gradient "Generate with AI" button with glow + sparkle icon, loading shimmer state ("AI sedang menyusun konten...")

**Right: Generated Results** (scrollable glassmorphism cards)

Each generated result is a "result group" card containing:
- Tone badge + format badge at top
- **Slide-by-slide breakdown**, one mini-card per slide, each clearly split into three labeled fields:
  - **Headline**
  - **Subheadline**
  - **Isi** (body content — can be short paragraph or bullet list; omitted on the opening hook slide if not needed)
  - The final slide additionally shows a **CTA** field (e.g., "Konsultasikan strategi bisnis Anda bersama Rely Consulting Group")
  - Middle slides may optionally show a small **Closing** line (a short wrap-up sentence for that slide)
- Hashtag chips row at the bottom of the result card
- **Action row** per result card:
  - "Generate Ulang" (ghost button, regenerates fresh variation from the same brief)
  - "Perbaiki dengan Catatan" — an inline text input + send icon where the user types feedback (e.g., "kurang storytelling di slide 3", "buat lebih singkat", "ganti CTA-nya") and the AI regenerates that result incorporating the note — similar to giving feedback to an AI assistant
  - "Copy" icon button
  - "Generate Caption" (secondary glass button — see caption behavior below)
  - "Tambahkan ke Content Library" (gradient button) — saves the result as a new card in Content Library with status "Draft", shows a success toast
- Empty state before generating: centered icon + "Hasil generate AI akan muncul di sini"
- Loading state: centered spinner + "AI sedang menyusun konten..."

**Caption Generation behavior** (triggered by "Generate Caption" button on a result card):
- Below the slide breakdown, a new glass sub-card appears (with its own loading shimmer "AI sedang menulis caption...") showing the generated caption, structured as:
  1. Hook line with a relevant emoji
  2. A short problem/question statement
  3. An explanatory paragraph
  4. A closing/reflective sentence
  5. Visual separator ("-")
  6. CTA line with a 📌 pin emoji inviting consultation with Rely Consulting
  7. Instagram handle line (e.g., "📱 @relycg")
  8. Hashtag chips row (5–8 relevant hashtags)
- Caption sub-card also has its own "Generate Ulang" and "Copy" actions
- Sample caption to use as the reference style/structure for mock data:

```
Banyak kesepakatan bisnis saat ini terjadi melalui WhatsApp. 📱
Namun ketika muncul perbedaan pendapat atau sengketa, pertanyaannya adalah: apakah chat tersebut dapat dijadikan bukti hukum?
Meskipun percakapan elektronik dapat memiliki nilai pembuktian, dokumentasi yang lengkap dan kesepakatan yang jelas tetap menjadi langkah penting untuk melindungi bisnis dari risiko yang tidak diinginkan.
Karena dalam bisnis, yang tertulis dan terdokumentasi dengan baik sering kali lebih kuat daripada yang hanya diingat.
-
📌 Konsultasikan kebutuhan bisnis dan legal Anda bersama Rely Consulting
📱 @relycg
#RelyConsulting #LegalInsight #BusinessLaw #WhatsAppChat #DigitalEvidence #BusinessProtection #LegalAwareness
```

**Sample slide-content data** to use as mock data for the carousel breakdown (5-slide educational carousel, follows the headline/subheadline/isi/closing/CTA structure above):

- Slide 1 — Headline: "Netflix Mengalahkan TV Bukan Karena Lebih Besar" · Subheadline: "Tetapi karena lebih cepat memahami perubahan perilaku konsumen."
- Slide 2 — Headline: "Dulu, TV Adalah Raja Hiburan" · Subheadline: "Hampir setiap rumah mengandalkan televisi sebagai sumber hiburan utama." · Isi: "Orang harus menyesuaikan waktu untuk menonton acara favoritnya. Jika terlewat, mereka harus menunggu jadwal tayang berikutnya." · Closing: "Tidak banyak yang membayangkan cara menonton akan berubah drastis."
- Slide 3 — Headline: "Lalu Netflix Datang dengan Cara Berbeda" · Subheadline: "Netflix tidak mencoba menjadi stasiun TV yang lebih besar." · Isi: "Mereka menawarkan sesuatu yang lebih sesuai kebutuhan konsumen: menonton kapan saja, di mana saja, dan memilih tontonan sendiri." · Closing: "Netflix tidak mengubah produknya — Netflix mengubah pengalaman konsumennya."
- Slide 4 — Headline: "Pelajaran Penting untuk Bisnis" · Subheadline: "Banyak bisnis fokus mengalahkan kompetitor, tetapi lupa memahami perubahan pelanggan." · Isi: "Cara membeli, berkomunikasi, dan mencari informasi terus berubah — bisnis yang mampu membaca perubahan biasanya lebih unggul."
- Slide 5 — Headline: "Pemenang Tidak Selalu yang Terbesar" · Subheadline: "Sering kali yang menang adalah yang paling cepat beradaptasi." · Isi: "Keberhasilan bisnis ditentukan oleh kemampuan memahami pasar, berinovasi, dan berani berubah sebelum terlambat." · CTA: "Konsultasikan strategi dan pengembangan bisnis Anda bersama Rely Consulting Group."

---

PAGE 2 — CONTENT CALENDAR (Kalender Indonesia 2026 — tanggal nyata)

Top Bar:
- Month navigation (prev/next arrows + current month/year label, e.g., "Juni 2026")

Calendar Grid:
- 7-column month grid (Min–Sab), glass cells per day, for the **real 2026 calendar** (correct weekday-to-date mapping for the whole year)
- **Tanggal merah** (national holidays + cuti bersama) rendered with a red/accent tint and small label tooltip on hover/tap showing the holiday name
- Content items shown as small colored tags inside day cells (truncated topic name, left border accent)
- "+N lainnya" indicator if more than 2 items in a day
- Selected day highlighted with accent border

Right Side Panel (appears when a day is selected):
- Glass panel showing selected date (and holiday name if applicable)
- List of content scheduled that day with status badges
- "Jadwalkan dari Library" section: scrollable list of unscheduled content from Library with a quick "schedule" action button per item

**2026 Indonesian national holiday & cuti bersama data** (use this real data to mark tanggal merah, per SKB 3 Menteri 2025 No. 1497/2/5 Tahun 2025):

| Tanggal | Hari | Keterangan |
|---|---|---|
| 1 Januari | Kamis | Tahun Baru 2026 Masehi |
| 16 Januari | Jumat | Isra Mikraj Nabi Muhammad SAW |
| 16 Februari | Senin | Cuti Bersama Tahun Baru Imlek |
| 17 Februari | Selasa | Tahun Baru Imlek 2577 Kongzili |
| 18 Maret | Rabu | Cuti Bersama Hari Suci Nyepi |
| 19 Maret | Kamis | Hari Suci Nyepi (Tahun Baru Saka 1948) |
| 20 Maret | Jumat | Cuti Bersama Idulfitri |
| 21 Maret | Sabtu | Idulfitri 1447 H (hari 1) |
| 22 Maret | Minggu | Idulfitri 1447 H (hari 2) |
| 23 Maret | Senin | Cuti Bersama Idulfitri |
| 24 Maret | Selasa | Cuti Bersama Idulfitri |
| 3 April | Jumat | Wafat Yesus Kristus |
| 5 April | Minggu | Kebangkitan Yesus Kristus (Paskah) |
| 1 Mei | Jumat | Hari Buruh Internasional |
| 14 Mei | Kamis | Kenaikan Yesus Kristus |
| 15 Mei | Jumat | Cuti Bersama Kenaikan Yesus Kristus |
| 27 Mei | Rabu | Iduladha 1447 H |
| 28 Mei | Kamis | Cuti Bersama Iduladha |
| 31 Mei | Minggu | Hari Raya Waisak 2570 BE |
| 1 Juni | Senin | Hari Lahir Pancasila |
| 16 Juni | Selasa | 1 Muharam, Tahun Baru Islam 1448 H |
| 17 Agustus | Senin | Hari Kemerdekaan RI (Proklamasi) |
| 25 Agustus | Selasa | Maulid Nabi Muhammad SAW |
| 24 Desember | Kamis | Cuti Bersama Hari Raya Natal |
| 25 Desember | Jumat | Hari Raya Natal |

*(Total: 17 hari libur nasional + 8 hari cuti bersama, sesuai SKB 3 Menteri yang ditetapkan 19 September 2025.)*

---

PAGE 3 — CONTENT LIBRARY

Top Bar:
- Page title "Content Library"
- Two action buttons top-right:
  - **"+ Konten"** (secondary glass button) — opens a modal/page to write content **manually**
  - **"Generate Konten"** (primary gradient button) — navigates directly to Page 1 (Generate Content)
- Status filter chips: Semua, Draft, Scheduled, Posted

Content Grid:
- Responsive card grid (glass cards)
- Each card: status badge top-left, delete icon top-right, topic title (bold), caption preview text (truncated 3 lines), meta row (format · tone · jumlah slide · date created)
- Clicking a card opens a detail view showing the full slide-by-slide breakdown + caption

Empty state: centered icon + "Belum ada konten tersimpan"

**"+ Konten" Manual Entry Modal/Page:**
- Topic/title text input
- Format selector chips (Single Post, Carousel, Reels Script)
- Jumlah Slide stepper (1–8), dynamically generates that many slide input blocks below
- Per-slide input block: Headline field, Subheadline field, Isi textarea (the last slide block also shows a CTA field)
- Caption textarea (free text, placeholder hints at the hook → body → CTA → handle → hashtags structure)
- Hashtag input with "+" add button, hashtag chips list below with remove (x) icon per chip
- Status dropdown (Draft / Scheduled / Posted)
- "Simpan ke Library" gradient button → success toast "Konten manual disimpan ke Library"

---

AI INTEGRATION (design assumption for prototyping)

- Content & caption generation is assumed to call a generative text API — **OpenAI GPT-4o / GPT-4o-mini (Chat Completions API)** is the default assumption; the Anthropic Claude API is an acceptable alternative if preferred.
- Since this is a high-fidelity prototype, actual API calls can be mocked: show the existing shimmer/loading states ("AI sedang menyusun konten...", "AI sedang menulis caption...") for ~1–2 seconds before populating with sample data.
- The "Perbaiki dengan Catatan" feedback box represents sending the user's note + the previous draft back to the model as additional context for a refined regeneration.

---

ADDITIONAL REQUIREMENTS

- Realistic sample content data: topics like "Tips Legalitas UMKM", "Edukasi Pajak Bulanan", "Studi Kasus Klien", "Promosi Layanan Konsultasi IT", "Quote Motivasi Bisnis" — use the Netflix carousel sample and WhatsApp-evidence caption sample above as realistic mock data wherever example content is needed
- Notification components: small toast at bottom-right, glass background + blue border + checkmark icon (e.g., "Konten disimpan ke Library", "Konten dijadwalkan", "Konten manual disimpan ke Library")
- Consistent motion: card hover lifts, button glow pulses, AI generation loading shimmer, smooth tab/page transitions
- All components portfolio-quality — suitable for a university mini project presentation
- Must feel like a real internal SaaS tool used daily by a marketing team, not a generic template

---

**Final aesthetic reference: Linear.app × Vercel Dashboard × Clerk.com — but for an AI-powered Instagram content studio. Premium, dark blue, glassy, and unforgettable.**

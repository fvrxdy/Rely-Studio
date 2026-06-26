# Figma Make Prompt — Rely Studio: Designer Jobdesk Page

> Gunakan prompt ini di **Figma Make** untuk menambahkan halaman baru ke website Rely Studio yang sudah ada.

---

## CONTEXT UPDATE

Add a new page to the existing **Rely Studio** web application — an internal tool for the digital marketing team of Rely Consulting Group. The existing app has three pages: **Generate Content**, **Content Calendar**, and **Content Library**. You are adding a fourth page specifically for the **Designer role**.

This page must match the existing design system exactly:
- Color system: deep navy `#0A1628` base, `#0D2951` surfaces, `#2563EB` accent blue
- Glassmorphism cards with `backdrop-filter: blur(16px)`
- Typography: Clash Display / Cabinet Grotesk for headings + DM Sans / Outfit for body
- Mesh gradient backgrounds with glowing orbs
- Border radius: 16–24px cards, 12px buttons
- Consistent with Linear × Vercel × Clerk aesthetic already established

---

## NEW PAGE — DESIGNER WORKSPACE

### Navigation

Add **"Designer Workspace"** to the persistent left sidebar with:
- Icon: `Palette` or `PenTool` (Lucide/Phosphor, colored `#60A5FA`)
- Position: below "Content Library" in the sidebar nav
- Active state: gradient fill + left blue border accent (same as other nav items)

---

### Page Layout

Two-column layout:

**Left column (~340px) — Content Queue**
**Right column (flexible) — Design Task Detail**

---

### LEFT COLUMN — Content Queue

**Header:**
- Title: "Antrian Desain"
- Subtitle: small muted text — "Konten siap didesain"
- Filter chips row: `Semua` · `Belum Dikerjakan` · `Sedang Dikerjakan` · `Selesai`

**Queue List (scrollable):**

Each queue item is a compact glass card showing:
- **Status dot** (left edge color indicator):
  - Gray/muted = Belum Dikerjakan
  - Blue pulsing = Sedang Dikerjakan  
  - Green = Selesai
- **Content title** (bold, e.g., "Tips Legalitas UMKM")
- **Format badge** (Carousel · Single Post · Reels Script) — frosted glass chip style
- **Jumlah slide** (small muted text, e.g., "5 slides")
- **Date added** (small muted text, e.g., "23 Jun 2026")
- **Designer status badge** in top-right corner:
  - `Belum Dikerjakan` — muted gray glass pill
  - `Sedang Dikerjakan` — blue glow pill with animated pulse dot
  - `Selesai` — green glass pill

Clicking a queue item selects it and loads its detail in the right column (selected state: blue glow border on the card).

**Empty state:** centered icon + "Belum ada konten di antrian. Tambahkan konten ke Library terlebih dahulu."

---

### RIGHT COLUMN — Design Task Detail

Default state (nothing selected): centered illustration + "Pilih konten dari antrian untuk mulai mengerjakan desain."

When a content item is selected, show:

#### Section 1 — Content Brief

Glass card titled "Brief Konten":
- **Topik:** [content title]
- **Format:** [Carousel / Single Post / Reels Script]
- **Jumlah Slide:** [number]
- **Tone of Voice:** [Formal / Santai / Storytelling]
- **Status Konten:** [Draft / Scheduled / Posted] — from Content Library

#### Section 2 — Slide Breakdown (Reference for Designer)

Glass card titled "Referensi Slide" with a subtle expand/collapse toggle.

Rendered as a clean read-only slide-by-slide breakdown — same structure as Content Library detail view:
- Each slide shows Headline, Subheadline, Isi, and CTA (for last slide)
- Slide number badge on each card (e.g., "Slide 1", "Slide 2")
- Soft separator between slides
- Read-only — no editing here (editing is in Content Library)

Below the slides: Caption preview (collapsible, titled "Preview Caption")

#### Section 3 — Design Status & Tracking

Glass card titled "Status Pengerjaan":

- **Status selector** — segmented control / large chips:
  - `Belum Dikerjakan` → `Sedang Dikerjakan` → `Selesai`
  - Changing status updates the queue item's status dot in real time
  - When set to "Sedang Dikerjakan": shows timestamp "Mulai dikerjakan: [waktu sekarang]"
  - When set to "Selesai": shows timestamp "Selesai: [waktu sekarang]"

- **Catatan Designer** — textarea (glass input style):
  - Placeholder: "Tambahkan catatan untuk tim, misalnya: revisi warna di slide 3, font diganti ke Clash Display, dll."
  - "Simpan Catatan" ghost button below

#### Section 4 — Upload & Link Desain

Glass card titled "File Desain" with a subtle gradient top border in blue.

**Upload area:**
- Dashed border glass box with upload icon + text: "Tempel link Google Drive hasil desain"
- Below the dashed area: labeled input field — "Link Google Drive"
  - Placeholder: "https://drive.google.com/drive/folders/..."
  - Glass input style (background `rgba(15,30,58,0.6)`, border `1px solid rgba(96,165,250,0.2)`)
  - Input glows blue on focus

- **"Simpan Link"** — primary gradient button (`#1A4FBF → #2563EB`), full width, glow on hover
  - On save: toast notification bottom-right — "✓ Link desain disimpan ke konten ini"
  - After saving: link appears below the input as a clickable pill chip — glass style with external link icon + truncated URL text + copy icon on the right

**Saved links list** (shown if any links already saved):
- Label: "File Tersimpan"
- Each link rendered as a glass pill row:
  - Google Drive icon (colored `#60A5FA`) + truncated URL text
  - "Buka" button (ghost, small) — opens link in new tab
  - "Hapus" icon (trash, ghost small, muted red on hover)
- Subtle separator between each link row

**Connection to Content Library:**
- Below the saved links, a small info banner (glass, `rgba(37,99,235,0.1)` bg, blue left border): 
  - Text: "Link ini akan muncul di detail konten pada halaman Content Library."
  - This ensures the team can access the design file directly from the Content Library detail view.

#### Section 5 — Action Row (Bottom of right column, sticky)

Sticky footer bar inside the right column:
- "Tandai Selesai" — primary gradient button with checkmark icon (disabled if status is already Selesai, green state when active)
- "Lihat di Content Library" — secondary glass button with arrow-right icon — navigates to Content Library filtered to this specific content
- Status summary chip on the right side showing current status

---

### CONTENT LIBRARY UPDATE

In the existing **Content Library** page, update each content detail modal/view to include:

**New section at the bottom of the detail view** titled "File Desain" (only shown if a designer has saved a link):
- Same glass pill style showing the Google Drive link(s)
- "Buka di Drive" button → opens link in new tab
- Small muted text: "Diunggah oleh Designer"

If no link has been saved yet:
- Muted placeholder row: "Desain belum tersedia. Designer sedang mengerjakan."

---

### SAMPLE / MOCK DATA

Use these mock items in the queue for the prototype:

1. **"Tips Legalitas UMKM"** — Carousel, 5 slides — Status: Selesai — Drive link saved
2. **"Edukasi Pajak Bulanan Q2 2026"** — Carousel, 6 slides — Status: Sedang Dikerjakan — no link yet
3. **"Netflix vs TV: Pelajaran Bisnis"** — Carousel, 5 slides — Status: Belum Dikerjakan
4. **"Promosi Layanan Konsultasi IT"** — Single Post, 1 slide — Status: Belum Dikerjakan
5. **"Quote Motivasi Bisnis Juni"** — Single Post, 1 slide — Status: Selesai — Drive link saved

---

### TOAST NOTIFICATIONS

Follow existing toast style (glass background + blue border + checkmark icon, bottom-right):

| Action | Toast Message |
|---|---|
| Simpan Link Drive | "✓ Link desain disimpan ke konten ini" |
| Simpan Catatan | "✓ Catatan designer disimpan" |
| Tandai Selesai | "✓ Desain ditandai selesai" |
| Hapus Link | "Link desain dihapus" |
| Status diubah | "Status diperbarui: [status baru]" |

---

### MICRO-INTERACTIONS & ANIMATIONS

- Queue items lift with blue glow shadow on hover (same as existing card hover behavior)
- Status selector chips animate with smooth color transition when switching
- "Tandai Selesai" button: on click → brief scale pulse animation → button turns green with checkmark
- Link saved: input area briefly glows blue + link pill slides in from bottom with fade
- Pulse animation on the "Sedang Dikerjakan" status dot (CSS `@keyframes pulse`, 2s infinite)
- Right column slides/fades in when a queue item is selected (smooth ~200ms transition)

---

### VISUAL CONSISTENCY CHECKLIST

All elements must use the existing design tokens:
- `#0A1628` — page background base
- `#0F1E3A` — card backgrounds
- `#152847` — elevated surfaces / hover
- `#2563EB` — primary accent, buttons, active states
- `#60A5FA` — icons, tags, muted accents
- `#F0F6FF` — primary text
- `#94B4D4` — secondary/muted text
- Glassmorphism: `backdrop-filter: blur(16px)` on all cards
- Gradient buttons: `linear-gradient(135deg, #1A4FBF 0%, #2563EB 100%)`
- Card borders: `1px solid rgba(96,165,250,0.12)`
- Mesh gradient background orbs (2–3 per page, `rgba(37,99,235,0.15)` glow)

---

### WORKFLOW SUMMARY (untuk referensi Figma)

```
Content Library (copywriter selesai nulis konten)
         ↓
Designer Workspace — Antrian Desain
         ↓
Designer buka konten → baca brief + slide breakdown
         ↓
Ubah status → "Sedang Dikerjakan"
         ↓
Kerjakan desain di Figma / Canva / tools lain
         ↓
Upload ke Google Drive → paste link di "File Desain"
         ↓
Klik "Tandai Selesai"
         ↓
Link otomatis muncul di Content Library detail view
```

---

**Design reference for this page: same as the rest of Rely Studio — Linear × Vercel × Clerk — premium dark navy glassmorphism SaaS. The Designer Workspace should feel like a professional task management view embedded within the same visual universe.**

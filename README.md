# QR Studio

A production-ready QR Code Generator with a real-time monitoring dashboard, built with Next.js 14 App Router, TypeScript, MongoDB, and Recharts.

---

## Features

- **Generator** — Create QR codes for URLs, text, email addresses, and phone numbers with live preview, colour customisation, and size control
- **History** — Paginated table of all saved QR codes with download, copy, and delete actions
- **Dashboard** — Analytics: total QRs, total scans, type distribution donut chart, QRs-over-time line chart, top QRs by scan count
- **Scan tracking** — Each QR code gets a unique public scan URL; every scan increments the counter and logs a `ScanEvent`
- **Dark mode** — System-preference aware, toggleable via the header

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS |
| State | Zustand |
| Database | MongoDB + Mongoose |
| QR generation | `qrcode` |
| Charts | Recharts |
| Validation | Zod |
| Notifications | react-hot-toast |
| Icons | lucide-react |
| Dark mode | next-themes |

---

## Project Structure

```
├── app/
│   ├── (dashboard)/
│   │   ├── layout.tsx          # Sidebar + header shell
│   │   ├── generator/          # QR generator page
│   │   ├── history/            # Paginated QR history
│   │   └── dashboard/          # Analytics dashboard
│   ├── api/
│   │   ├── qr/route.ts         # POST — programmatic QR creation
│   │   └── scan/[publicId]/    # GET — scan tracking + redirect
│   ├── layout.tsx              # Root layout (ThemeProvider, Toaster)
│   └── not-found.tsx
├── components/
│   ├── dashboard/              # StatCard, charts, TopQrsTable
│   ├── generator/              # QrGeneratorForm, QrPreviewPanel
│   ├── history/                # HistoryTable, Pagination
│   ├── layout/                 # Sidebar, Header, MobileDrawer
│   └── ui/                     # Badge, ConfirmDialog, EmptyState, QrThumbnail
├── lib/
│   ├── mongoose.ts             # Connection singleton
│   ├── utils.ts                # cn, formatDate, truncate, getBaseUrl
│   └── actions/
│       └── qr.ts               # Server Actions: createQr, deleteQr, getQrList, getQrStats, getTopQrs
├── models/
│   ├── QrCode.ts
│   └── ScanEvent.ts
├── scripts/
│   ├── seed.ts                 # Insert 10 sample QR codes
│   └── createIndexes.ts        # Create all MongoDB indexes
├── store/
│   └── qr-store.ts             # Zustand store (form + preview state)
└── types/
    └── index.ts                # IQrCode, IQrFormState, IQrStats, ApiResponse<T>
```

---

## Setup

### 1. Clone and install

```bash
git clone <repo-url>
cd qr-generator
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in:

```env
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/<dbname>
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Getting a MongoDB URI:**
1. Create a free cluster at [MongoDB Atlas](https://cloud.mongodb.com)
2. Go to **Connect → Drivers → Node.js**
3. Copy the connection string and replace `<password>` with your DB user's password

### 3. Create database indexes

Run once before first use (or after resetting the DB):

```bash
npx ts-node --project tsconfig.scripts.json scripts/createIndexes.ts
```

### 4. Seed sample data (optional)

```bash
npx ts-node --project tsconfig.scripts.json scripts/seed.ts
```

This inserts 10 sample QR codes of mixed types with realistic scan counts so the dashboard has something to display immediately.

### 5. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to `/generator`.

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | ✅ Yes | MongoDB connection string |
| `NEXT_PUBLIC_APP_URL` | ✅ Yes | Public base URL (no trailing slash) |
| `NEXTAUTH_SECRET` | No | Reserved for future auth integration |

---

## How Scan Tracking Works

Every saved QR code gets a unique `publicId` (10-char nanoid). Its scan URL is:

```
https://your-domain.com/api/scan/<publicId>
```

When this URL is visited:

1. `GET /api/scan/[publicId]` is called
2. `QrCode.scanCount` is atomically incremented with `$inc` (single round-trip, race-condition safe)
3. A `ScanEvent` document is created with `userAgent` and `referer` headers
4. **URL type** → 302 redirect to the target URL
5. **Other types** → JSON response with the content

The dashboard aggregates `scanCount` values across all documents — no need to count `ScanEvent` rows for totals.

---

## Production Deployment (Vercel)

1. Push to GitHub
2. Import the repo in [Vercel](https://vercel.com)
3. Add environment variables in **Project Settings → Environment Variables**
4. Deploy — Vercel automatically runs `next build`

> The Mongoose connection singleton (`lib/mongoose.ts`) caches the connection on `global` and handles serverless cold starts correctly. `bufferCommands: false` ensures DB errors surface immediately rather than queuing indefinitely.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint check |
| `npm run seed` | Insert 10 sample QR codes |
| `npx ts-node --project tsconfig.scripts.json scripts/createIndexes.ts` | Create MongoDB indexes |

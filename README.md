# Orchard Health: NAFHA citrus pilot

A web app for a 3–4 month, one-district pilot. It has two modules and works on top of the existing
**NAFHA orchard database** instead of replacing it.

| Module | What it does |
| --- | --- |
| **1. Pest & disease identification** | A lead farmer photographs a mandarin tree. The AI suggests one of: citrus greening (HLB), Asian citrus psyllid, fruit fly, canker, gummosis, or healthy. **An expert checks every result** until the AI meets the agreed accuracy threshold. The farmer then gets guidance as **Nepali voice** plus text. |
| **2. Planting-material QA** | A **nursery registry** with certification and disease-test status. **Batch codes and QR labels** for saplings, and a public **verify page** so farmers can check the source before buying. **Farmer reports** of suspect material go to the authority. **Greening found in a new orchard is traced back** to its source nursery and batch. |

Stack: Next.js 15 (App Router, server components and route handlers), TypeScript, Tailwind CSS v4.

## Run it

```bash
cd orchard-health
npm install
npm run dev        # http://localhost:3000
```

On first run the app creates `data/db.json` with **sample data**: 12 orchards, 5 nurseries,
7 batches and 44 historical cases. Pick a role in the sidebar (lead farmer, expert, authority,
admin) to try each user's view.

## Deploy on Vercel (auto-deploy from GitHub)

1. In Vercel: **Add New → Project → Import** `infocare-Git/pest-management`. The framework is detected
   as Next.js and no settings need to change. After that, every push to `main` deploys to
   production automatically, and other branches get preview URLs.
2. **Connect storage** so data survives redeploys: Project → **Storage → Create → Upstash (Redis)
   → Connect to project**. This adds the `KV_REST_API_URL` and `KV_REST_API_TOKEN` (or
   `UPSTASH_REDIS_REST_*`) environment variables. Then redeploy. The app stores its database and
   photos there automatically.
   Without it the site still works, but uses temporary storage: a yellow banner says so, and data
   is lost on each redeploy or cold start.
3. Optional environment variables: `PUBLIC_BASE_URL` (the address printed in QR codes, e.g.
   `https://pest-management.vercel.app`), `CLASSIFIER_URL` and `CLASSIFIER_TOKEN`.

Vercel limits each request to 4.5 MB. The app shrinks photos on the phone (about 200 KB each),
so a submission with 4 photos stays well under that limit.

## Walkthrough

1. **Lead farmer**: open *Check a tree*, add photos, link the NAFHA orchard and submit. The case
   shows "Awaiting expert check". Guidance stays hidden until an expert has checked it.
2. **Expert**: open *Expert review*. Greening cases are listed first. Open a case, confirm or
   correct the AI, and the guidance is released.
3. If the expert confirms **greening** and the orchard was planted within the last N years
   (default 3), a **trace-back** is raised against the source nursery and batch. The batch's
   verify page then warns buyers.
4. **Authority**: *Flags & trace-backs* lists trace-backs and farmer reports, with status and notes.
   *Nursery registry* is where you update certification and test status, add batches and print
   QR labels.
5. **Farmer buying saplings**: scans the QR (or opens `/verify` and types the code) and sees
   **किन्न सुरक्षित / सावधानी / नकिन्नुहोस्** with the reasons.
6. **Admin**: *AI accuracy* shows progress against the threshold, per-condition results and a
   confusion matrix. *Pilot settings* allows switching to **graduated** mode only after the threshold
   is met.

## How expert validation works

- **Validation mode** (the default for the pilot): an expert reviews every case.
- An expert's label is the ground truth. "Photo not clear" labels are left out of the accuracy figures.
- **Graduation needs all four of these** (all can be changed in settings): at least `minReviewedCases`
  reviewed cases (150), at least `minGreeningCases` reviewed greening cases (30), overall accuracy at
  or above the threshold (90%), and **greening sensitivity** at or above the threshold. Greening
  sensitivity is the share of expert-confirmed greening cases the AI also called greening.
- **After graduation**, a case still goes to an expert if any of these apply: AI confidence is
  below 70%, the AI predicts greening (because it triggers a nursery trace-back), or the case is
  picked for a random 10% spot-check. Everything else is released to the farmer automatically.

## Before field use: what still has to be plugged in

| Item | Where | Status |
| --- | --- | --- |
| **Trained image model** | `src/server/classifier.ts` | A **demo classifier** is included. It gives stable fake predictions from the image bytes and is **not a real model**. Set `CLASSIFIER_URL` (and optionally `CLASSIFIER_TOKEN`) to point at a model service trained on NAFHA's labelled photos. The request/response format is documented in that file. The expert-reviewed cases from the pilot become labelled training data. |
| **NAFHA orchard database** | `src/server/nafha.ts` | All orchard, nursery and batch access goes through the `NafhaOrchardDb` interface. It currently runs on a mock that holds sample records in the app's own store. To connect, add an implementation (direct SQL, REST API or sync job) and choose it in `createAdapter()`. Nurseries and batches are meant to be new tables in the NAFHA database, linked to its orchard IDs. |
| **Guidance content** | `src/lib/catalog.ts` | The English steps and Nepali scripts are a **draft**. A NAFHA plant-protection expert must sign them off, and confirm the 3–4 priority pests and diseases. |
| **Nepali voice** | `public/audio/<condition>.mp3` | If a recording exists (e.g. `citrus_greening.mp3`) it is played. Otherwise the app uses the device's Nepali text-to-speech, which many phones lack. **Recorded audio from a native speaker is strongly recommended.** |
| **Login** | `src/server/auth.ts` | The role is a cookie set from the sidebar, with no authentication. Add real logins (NAFHA accounts or phone OTP) before use outside a supervised pilot. |
| **Data store** | `src/server/storage.ts` | Upstash Redis when configured (Vercel). Otherwise local files in `data/`. The whole database is a single JSON document guarded by a write lock, which is fine for one district. Move to Postgres or the NAFHA database for anything larger. |
| **QR base URL** | env `PUBLIC_BASE_URL` | Set it to the public address so printed QR codes point to the right host. |
| **Second crop** | `src/lib/types.ts` (`Crop`), `catalog.ts` | Add it once it has been confirmed. |

## API (for SMS/IVR or the NAFHA system)

| Method | Path | Who |
| --- | --- | --- |
| `GET` | `/api/verify/{batchCode}` | Public. Returns the verdict and reasons in Nepali and English |
| `POST` | `/api/cases` (multipart: `photos`, `orchardId`, `farmerName`, …) | Lead farmer |
| `POST` | `/api/cases/{id}/review` `{condition, note}` | Expert |
| `POST` | `/api/reports` (multipart) | Public |
| `PATCH` | `/api/flags/{report\|alert}/{id}` `{status, note}` | Authority |
| `POST` / `PATCH` | `/api/nurseries`, `/api/nurseries/{id}`, `/api/nurseries/{id}/batches`, `/api/batches/{id}` | Authority |
| `PATCH` | `/api/settings`, `POST /api/settings/reset` | Admin |

## Project layout

```
src/
  app/                 pages (server components) and api/ route handlers
  components/          UI: forms, photo capture, Nepali voice player, sidebar
  lib/
    catalog.ts         pests and diseases, symptoms, guidance (EN + Nepali voice script)
    types.ts           domain model
  server/
    nafha.ts           NAFHA orchard database adapter (integration boundary)
    classifier.ts      image classifier (demo + HTTP model service)
    services.ts        review gate, accuracy, greening trace-back, batch verification
    db.ts / seed.ts    pilot JSON store and sample data
```

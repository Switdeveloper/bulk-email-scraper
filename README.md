# ⚡ OPERATION MAIL — Bulk Email & Lead Scraper

A **Naval Command Center** themed web app for scraping leads via Apify and sending bulk emails via Brevo.

---

## 🚀 One-Click Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/import/project?template=https://github.com/Switdeveloper/bulk-email-scraper)

---

## Features

- 🔍 **Lead Scraper** — Scrape Google Maps businesses with emails via Apify
- 📧 **Bulk Email Sender** — Send via Brevo SMTP with rate limiting
- 👥 **Lead Database** — All leads stored locally in JSON
- 📊 **Command Dashboard** — Live stats, country distribution charts
- 🎨 **Naval Command Center Theme** — Dark radar-style UI

---

## Setup

### 1. Clone & Install
```bash
git clone https://github.com/Switdeveloper/bulk-email-scraper.git
cd bulk-email-scraper
npm install
```

### 2. Configure API Keys
Copy `.env.local.example` to `.env.local`:
```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```env
APIFY_API_KEY=your_apify_token_here
```

### 3. Run Locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

### 4. Deploy to Vercel
```bash
npm i -g vercel
vercel --prod
```
Or push to GitHub and connect to Vercel.

---

## API Keys Needed

### Brevo (Sendinblue)
1. Sign up at [brevo.com](https://brevo.com)
2. Settings → SMTP → Create API key
3. Paste in the app's Settings tab

### Apify
1. Sign up at [apify.com](https://apify.com)
2. Account → Integrations → Copy API token
3. Paste in `.env.local` AND the app's Settings tab

---

## Email Pitch Template

> **Subject:** Quick question about your website
>
> Hi [Business Name],
>
> I noticed your website could be doing more for your business. Slow load times, outdated design, and manual processes cost you customers every day.
>
> I help businesses like yours with:
> - 🌐 Website Design — Modern, high-converting sites
> - ⚡ Automation — n8n workflows eliminate repetitive tasks
> - 🤖 AI Agents — Handle customer service 24/7
>
> I can have a new website or automation running within **48 hours**.
>
> Reply **"YES"** to schedule a free consultation.

---

## Target Countries
USA, UK, Canada, Australia, Singapore, New Zealand, Switzerland, Netherlands, Sweden, Norway, Denmark, Germany

## Tech Stack
- **Next.js 14** (App Router)
- **TypeScript**
- **Apify API** (Google Maps scraper)
- **Brevo SMTP** (email delivery)
- **JSON file database** (no external DB needed)
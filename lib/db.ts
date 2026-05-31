// lib/db.ts — JSON file-based database (works on Vercel serverless!)
import fs from 'fs'
import path from 'path'

// Use /tmp on Vercel serverless (writable), fallback to cwd for local dev
const isVercel = process.env.VERCEL === '1'
const DATA_DIR = isVercel ? '/tmp/data' : path.join(process.cwd(), 'data')
const DB_FILE = path.join(DATA_DIR, 'db.json')

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
}

function readDB() {
  ensureDir()
  if (!fs.existsSync(DB_FILE)) {
    return initDB()
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return initDB()
  }
}

function initDB() {
  const db = {
    settings: {
      brevoApiKey: '',
      apifyApiKey: '',
      senderEmail: 'switdeveloper@gmail.com',
      senderName: 'Swit Developer',
      emailSubject: 'Quick question about your website',
    },
    leads: [],
    campaigns: [],
    sentLog: [],
  }
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2))
  return db
}

export function getDB() {
  return readDB()
}

export function saveDB(data: ReturnType<typeof readDB>) {
  ensureDir()
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2))
}

export interface Lead {
  id: string
  name: string
  email: string
  website: string
  phone: string
  address: string
  country: string
  industry: string
  scrapedAt: string
  used: boolean
}

export interface Campaign {
  id: string
  name: string
  country: string
  industry: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  totalLeads: number
  sentCount: number
  createdAt: string
  completedAt?: string
}

export interface SentEmail {
  id: string
  leadId: string
  leadEmail: string
  businessName: string
  subject: string
  status: 'sent' | 'failed' | 'pending'
  sentAt: string
  country: string
  industry: string
}

export function getLeads(): Lead[] {
  return getDB().leads
}

export function addLeads(leads: Lead[]) {
  const db = getDB()
  const existing = new Set(db.leads.map((l: Lead) => l.email))
  const newLeads = leads.filter((l: Lead) => !existing.has(l.email))
  db.leads.push(...newLeads)
  saveDB(db)
  return newLeads
}

export function markLeadsUsed(ids: string[]) {
  const db = getDB()
  db.leads = db.leads.map((l: Lead) =>
    ids.includes(l.id) ? { ...l, used: true } : l
  )
  saveDB(db)
}

export function getUnsentLeads(country?: string, industry?: string, limit = 50): Lead[] {
  const db = getDB()
  return db.leads
    .filter((l: Lead) => {
      if (l.used) return false
      if (country && l.country !== country) return false
      if (industry && l.industry !== industry) return false
      return true
    })
    .slice(0, limit)
}

export function addSentEmails(emails: SentEmail[]) {
  const db = getDB()
  db.sentLog.push(...emails)
  saveDB(db)
}

export function getSettings() {
  return getDB().settings
}

export function saveSettings(settings: Record<string, string>) {
  const db = getDB()
  db.settings = { ...db.settings, ...settings }
  saveDB(db)
}

export function getStats() {
  const db = getDB()
  const totalLeads = db.leads.length
  const totalSent = db.sentLog.length
  const usedLeads = db.leads.filter((l: Lead) => l.used).length
  const byCountry: Record<string, number> = {}
  db.leads.forEach((l: Lead) => {
    byCountry[l.country] = (byCountry[l.country] || 0) + 1
  })
  return { totalLeads, totalSent, usedLeads, byCountry }
}
// app/api/scrape/route.ts — Scrape Google Maps for leads
import { NextRequest, NextResponse } from 'next/server'
import { scrapeGoogleMaps, enrichWithApifyEmails } from '@/lib/apify'
import { addLeads, Lead } from '@/lib/db'
import { v4 as uuid } from 'crypto'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const { keyword, country, maxItems = 50 } = await req.json()

    if (!keyword || !country) {
      return NextResponse.json(
        { error: 'keyword and country are required' },
        { status: 400 }
      )
    }

    // Scrape Google Maps
    const places = await scrapeGoogleMaps(keyword, country, maxItems)

    // Enrich with emails from websites
    const enriched = await enrichWithApifyEmails(places)

    // Convert to Lead format
    const leads: Lead[] = enriched.map((place) => ({
      id: crypto.randomUUID(),
      name: place.title || place.name || 'Unknown',
      email:
        (place as any).enrichedEmail ||
        place.emails?.[0] ||
        place.email ||
        '',
      website: place.websiteUrl || place.url || '',
      phone: place.phone || '',
      address: place.address || '',
      country: country,
      industry: keyword,
      scrapedAt: new Date().toISOString(),
      used: false,
    })).filter((l) => l.email)

    // Save to DB
    const newLeads = addLeads(leads)

    return NextResponse.json({
      totalFound: places.length,
      withEmails: leads.length,
      saved: newLeads.length,
      leads: newLeads.slice(0, 20), // Return sample
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
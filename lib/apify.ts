// lib/apify.ts — Apify Google Maps & Website Scraper
import axios from 'axios'

const APIFY_BASE = 'https://api.apify.com/v2'

interface ApifyPlace {
  title?: string
  name?: string
  emails?: string[]
  email?: string
  websiteUrl?: string
  url?: string
  phone?: string
  address?: string
  location?: { country?: string }
  extraFields?: Record<string, any>
}

export async function scrapeGoogleMaps(
  keyword: string,
  country: string,
  maxItems: number = 50
): Promise<ApifyPlace[]> {
  const locationMap: Record<string, string> = {
    usa: 'United States',
    uk: 'London, United Kingdom',
    canada: 'Canada',
    australia: 'Sydney, Australia',
    singapore: 'Singapore',
    'new zealand': 'New Zealand',
    switzerland: 'Switzerland',
    netherlands: 'Netherlands',
    sweden: 'Sweden',
    norway: 'Norway',
    denmark: 'Denmark',
    germany: 'Germany',
  }

  const location = locationMap[country.toLowerCase()] || country

  // Use compass~crawler-google-places (paid actor: ~$2.10 per 1000 places, extracts emails)
  const input = {
    queries: [{ term: keyword, location: location }],
    maxItems,
    scrapeEmails: true, // Enable email extraction (key feature!)
    reviewsLimit: 0,     // Skip reviews to save credits
    output: { format: 'json' },
  }

  try {
    const response = await axios.post(
      'https://api.apify.com/v2/acts/compass~crawler-google-places/run-sync-get-dataset-items',
      { input },
      {
        params: { token: process.env.APIFY_API_KEY },
        timeout: 120000, // 2 min timeout for paid actor
      }
    )
    const items: ApifyPlace[] = response.data?.data || []
    console.log(`[Apify] Got ${items.length} places, filtering for emails...`)
    // Return only places that have emails
    return items.filter((p) => p.emails?.length || p.email)
  } catch (error: any) {
    console.error('Apify scrape error:', error?.response?.data || error.message)
    return []
  }
}

export async function scrapeWebsiteEmails(urls: string[]): Promise<Record<string, string>> {
  if (!urls.length) return {}

  try {
    const response = await axios.post(
      'https://api.apify.com/v2/acts/mtrunko~email-extractor/run-sync-get-dataset-items',
      { input: { urls: urls.slice(0, 20) } },
      { params: { token: process.env.APIFY_API_KEY } }
    )
    const items = response.data?.data || []
    const emailMap: Record<string, string> = {}
    for (const item of items) {
      if (item.email) {
        emailMap[item.url] = item.email
      }
    }
    return emailMap
  } catch (error: any) {
    console.error('Email scrape error:', error?.response?.data || error.message)
    return {}
  }
}

// Keep email enrichment separate for cases where the paid actor returns no emails
export async function enrichWithApifyEmails(places: ApifyPlace[]): Promise<ApifyPlace[]> {
  // The paid actor already extracts emails — only scrape websites for places without emails
  const placesNeedingScrape = places.filter(
    (p) => !p.emails?.length && !p.email && (p.websiteUrl || p.url)
  )

  const websites = placesNeedingScrape
    .map((p) => p.websiteUrl || p.url)
    .filter(Boolean) as string[]

  if (websites.length) {
    const emailMap = await scrapeWebsiteEmails(websites)
    placesNeedingScrape.forEach((place) => {
      const site = place.websiteUrl || place.url
      if (site && emailMap[site]) {
        ;(place as any).enrichedEmail = emailMap[site]
      }
    })
  }

  return places.map((place) => {
    if (place.emails?.length || place.email) return place
    const site = place.websiteUrl || place.url
    if (site && (place as any).enrichedEmail) {
      return { ...place, email: (place as any).enrichedEmail }
    }
    return place
  })
}
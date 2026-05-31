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

  const input = {
   狭: keyword,
    location: location,
    maxItems,
    maxConcurrency: 5,
    scrape: ['email', 'phones', 'urls', 'addresses'],
  }

  try {
    const response = await axios.post(
      'https://api.apify.com/v2/acts/apify~google-maps-scraper/run-sync-get-dataset-items',
      { input },
      {
        params: { token: process.env.APIFY_API_KEY },
        timeout: 60000,
      }
    )
    return response.data?.data || []
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

export async function enrichWithApifyEmails(places: ApifyPlace[]): Promise<ApifyPlace[]> {
  const placesWithEmail = places.filter((p) => p.emails?.length || p.email)
  const placesNeedingScrape = places.filter(
    (p) => !p.emails?.length && !p.email && (p.websiteUrl || p.url)
  )

  // Try to get emails from website scraper for places without emails
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

  return placesNeedingScrape
}
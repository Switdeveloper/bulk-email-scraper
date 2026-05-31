// app/api/leads/route.ts — Get leads
import { NextRequest, NextResponse } from 'next/server'
import { getLeads, getStats } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const country = searchParams.get('country')
  const industry = searchParams.get('industry')
  const unused = searchParams.get('unused') === 'true'

  let leads = getLeads()
  if (country) leads = leads.filter((l) => l.country === country)
  if (industry) leads = leads.filter((l) => l.industry === industry)
  if (unused) leads = leads.filter((l) => !l.used)

  return NextResponse.json({ leads, stats: getStats() })
}
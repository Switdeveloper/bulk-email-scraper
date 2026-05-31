// app/api/stats/route.ts — Dashboard stats
import { NextResponse } from 'next/server'
import { getStats, getSettings } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET() {
  return NextResponse.json(getStats())
}
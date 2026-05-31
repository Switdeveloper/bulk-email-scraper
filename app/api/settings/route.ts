// app/api/settings/route.ts — Get & save settings
import { NextRequest, NextResponse } from 'next/server'
import { getSettings, saveSettings } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET() {
  return NextResponse.json(getSettings())
}

export async function POST(req: NextRequest) {
  try {
    const settings = await req.json()
    saveSettings(settings)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
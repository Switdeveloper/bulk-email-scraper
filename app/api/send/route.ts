// app/api/send/route.ts — Send bulk emails via Brevo
import { NextRequest, NextResponse } from 'next/server'
import { sendBrevoEmail, buildEmailHtml } from '@/lib/brevo'
import { getSettings, getUnsentLeads, markLeadsUsed, addSentEmails, SentEmail } from '@/lib/db'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const { country, industry, count = 10, customMessage } = await req.json()
    const settings = getSettings()

    if (!settings.brevoApiKey) {
      return NextResponse.json({ error: 'Brevo API key not configured' }, { status: 400 })
    }

    const leads = getUnsentLeads(country, industry, count)
    if (!leads.length) {
      return NextResponse.json({ error: 'No unused leads found. Try scraping more first.' }, { status: 400 })
    }

    const results: { email: string; success: boolean; error?: string }[] = []
    const sentEmails: SentEmail[] = []

    for (const lead of leads) {
      const html = buildEmailHtml(lead.name, customMessage)
      const result = await sendBrevoEmail(
        {
          to: [{ email: lead.email, name: lead.name }],
          subject: settings.emailSubject || 'Quick question about your website',
          htmlContent: html,
          from: { email: settings.senderEmail, name: settings.senderName },
        },
        settings.brevoApiKey
      )

      results.push({
        email: lead.email,
        success: result.success,
        error: result.error,
      })

      sentEmails.push({
        id: crypto.randomUUID(),
        leadId: lead.id,
        leadEmail: lead.email,
        businessName: lead.name,
        subject: settings.emailSubject || 'Quick question about your website',
        status: result.success ? 'sent' : 'failed',
        sentAt: new Date().toISOString(),
        country: lead.country,
        industry: lead.industry,
      })

      // Rate limit: 1 second between emails
      await new Promise((r) => setTimeout(r, 1000))
    }

    // Mark leads as used and save sent log
    markLeadsUsed(leads.map((l) => l.id))
    addSentEmails(sentEmails)

    const successCount = results.filter((r) => r.success).length

    return NextResponse.json({
      sent: successCount,
      failed: results.length - successCount,
      results,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
// lib/brevo.ts — Brevo (Sendinblue) SMTP email sender
import axios from 'axios'

interface EmailPayload {
  to: { email: string; name: string }[]
  subject: string
  htmlContent: string
  from: { email: string; name: string }
}

export async function sendBrevoEmail(payload: EmailPayload, apiKey: string) {
  try {
    const response = await axios.post(
      'https://api.brevo.com/v3/smtp/email',
      payload,
      {
        headers: {
          'api-key': apiKey,
          'Content-Type': 'application/json',
        },
      }
    )
    return { success: true, messageId: response.data?.messageId }
  } catch (error: any) {
    return {
      success: false,
      error: error?.response?.data?.message || error.message,
    }
  }
}

export function buildEmailHtml(businessName: string, customMessage?: string) {
  const serviceList = `
    <ul style="color: #cbd5e1; line-height: 2; text-align: left; display: inline-block;">
      <li>🌐 <strong>Website Design</strong> — Modern, high-converting sites</li>
      <li>⚡ <strong>Automation</strong> — n8n workflows eliminate repetitive tasks</li>
      <li>🤖 <strong>AI Agents</strong> — Handle customer service 24/7</li>
    </ul>
  `
  const base = customMessage || `I help businesses like yours with:<br><br>${serviceList}<br><br>I can have a new website or automation running within <strong>48 hours</strong>.<br><br>Reply <strong>"YES"</strong> to schedule a free consultation and get a custom quote.`
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #0a0e1a; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #0f172a; border: 1px solid #1e3a5f; border-radius: 8px; padding: 40px; }
    .header { border-bottom: 2px solid #00d4ff; padding-bottom: 20px; margin-bottom: 30px; }
    .header h1 { color: #00d4ff; margin: 0; font-size: 24px; letter-spacing: 1px; }
    .greeting { color: #e2e8f0; font-size: 16px; line-height: 1.6; }
    .highlight { color: #00d4ff; font-weight: bold; }
    .cta { background: #00d4ff; color: #0a0e1a !important; padding: 12px 30px; border-radius: 5px; text-decoration: none; display: inline-block; margin: 20px 0; font-weight: bold; }
    .footer { color: #64748b; font-size: 12px; margin-top: 30px; border-top: 1px solid #1e3a5f; padding-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚡ SWIT DEVELOPER</h1>
    </div>
    <p class="greeting">Hi <span class="highlight">${businessName}</span>,</p>
    <p class="greeting">I noticed your website could be doing more for your business. Slow load times, outdated design, and manual processes cost you customers every day.</p>
    <p class="greeting">${base}</p>
    <a href="mailto:switdeveloper@gmail.com?subject=YES" class="cta">REPLY "YES" → FREE CONSULTATION</a>
    <p class="greeting">Best regards,<br><strong>Swit Developer</strong><br>🌐 switdeveloper.com<br>⚡ AI & Automation Specialist</p>
    <div class="footer">
      You received this email because you're a business owner. To unsubscribe, reply with "UNSUBSCRIBE".
    </div>
  </div>
</body>
</html>
`.trim()
}
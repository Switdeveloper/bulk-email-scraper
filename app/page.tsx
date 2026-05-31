'use client'
import { useState, useEffect, useCallback } from 'react'

// — Types —
interface Lead { id: string; name: string; email: string; website: string; phone: string; address: string; country: string; industry: string; used: boolean; scrapedAt: string }
interface Stats { totalLeads: number; totalSent: number; usedLeads: number; byCountry: Record<string, number> }
interface Settings { brevoApiKey: string; apifyApiKey: string; senderEmail: string; senderName: string; emailSubject: string }

// — Constants —
const COUNTRIES = ['USA','UK','Canada','Australia','Singapore','New Zealand','Switzerland','Netherlands','Sweden','Norway','Denmark','Germany']
const INDUSTRIES = ['restaurants','hotels','clinics','real estate agencies','law firms','accountants','gyms','salons','photographers','event planners']

// — API helpers —
const api = {
  async getStats(): Promise<Stats> { const r = await fetch('/api/stats'); return r.json() },
  async getLeads(country?: string, unused?: boolean): Promise<{ leads: Lead[] }> {
    let url = '/api/leads'
    const params = new URLSearchParams()
    if (country) params.set('country', country)
    if (unused) params.set('unused', 'true')
    if (params.toString()) url += '?' + params.toString()
    const r = await fetch(url); return r.json()
  },
  async getSettings(): Promise<Settings> { const r = await fetch('/api/settings'); return r.json() },
  async saveSettings(s: Partial<Settings>): Promise<void> { await fetch('/api/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(s) }) },
  async scrape(keyword: string, country: string): Promise<{ totalFound: number; withEmails: number; saved: number }> {
    const r = await fetch('/api/scrape', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ keyword, country, maxItems: 30 }) })
    return r.json()
  },
  async send(country: string, industry: string, count: number, customMessage?: string): Promise<{ sent: number; failed: number }> {
    const r = await fetch('/api/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ country, industry, count, customMessage }) })
    return r.json()
  },
}

// — Components —
function StatusBar() {
  const [time, setTime] = useState('')
  useEffect(() => {
    const update = () => setTime(new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC')
    update(); const i = setInterval(update, 1000)
    return () => clearInterval(i)
  }, [])
  return (
    <div style={{ background: 'var(--navy-dark)', borderBottom: '1px solid var(--border)', padding: '8px 30px', display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)' }}>
      <span>🔴 LIVE SYSTEMS</span>
      <span>{time}</span>
    </div>
  )
}

function StatCard({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="stat-card radar-sweep">
      <div className="value">{value}</div>
      <div className="label">{label}</div>
    </div>
  )
}

function Alert({ type, children }: { type: 'success' | 'error' | 'info'; children: React.ReactNode }) {
  return <div className={`alert alert-${type}`}>{children}</div>
}

// — Main App —
export default function Home() {
  const [tab, setTab] = useState<'dashboard' | 'scrape' | 'send' | 'leads' | 'settings'>('dashboard')
  const [stats, setStats] = useState<Stats>({ totalLeads: 0, totalSent: 0, usedLeads: 0, byCountry: {} })
  const [leads, setLeads] = useState<Lead[]>([])
  const [settings, setSettings] = useState<Settings>({ brevoApiKey: '', apifyApiKey: '', senderEmail: 'switdeveloper@gmail.com', senderName: 'Swit Developer', emailSubject: 'Quick question about your website' })
  const [loading, setLoading] = useState(false)
  const [alert, setAlert] = useState<{ type: 'success' | 'error' | 'info'; msg: string } | null>(null)

  // Scrape form
  const [scrapeKeyword, setScrapeKeyword] = useState('restaurants')
  const [scrapeCountry, setScrapeCountry] = useState('Australia')
  const [scrapeResult, setScrapeResult] = useState<{ totalFound: number; withEmails: number; saved: number } | null>(null)

  // Send form
  const [sendCountry, setSendCountry] = useState('Australia')
  const [sendIndustry, setSendIndustry] = useState('restaurants')
  const [sendCount, setSendCount] = useState(10)
  const [customMsg, setCustomMsg] = useState('')
  const [sendResult, setSendResult] = useState<{ sent: number; failed: number } | null>(null)

  const showAlert = (type: 'success' | 'error' | 'info', msg: string) => {
    setAlert({ type, msg })
    setTimeout(() => setAlert(null), 5000)
  }

  const loadData = useCallback(async () => {
    try {
      const [s, ld] = await Promise.all([api.getStats(), api.getLeads()])
      setStats(s)
      setLeads(ld.leads)
    } catch {}
  }, [])

  const loadSettings = useCallback(async () => {
    try {
      const s = await api.getSettings()
      setSettings(s)
    } catch {}
  }, [])

  useEffect(() => { loadData(); loadSettings() }, [loadData, loadSettings])

  // Scrape handler
  const handleScrape = async () => {
    if (!scrapeKeyword || !scrapeCountry) return
    setLoading(true)
    setScrapeResult(null)
    try {
      const r = await api.scrape(scrapeKeyword, scrapeCountry)
      setScrapeResult(r)
      showAlert('success', `✓ Scraped ${r.withEmails} leads with emails. ${r.saved} saved to DB.`)
      loadData()
    } catch (e: any) {
      showAlert('error', `Scrape failed: ${e.message}`)
    }
    setLoading(false)
  }

  // Send handler
  const handleSend = async () => {
    setLoading(true)
    setSendResult(null)
    try {
      const r = await api.send(sendCountry, sendIndustry, sendCount, customMsg || undefined)
      setSendResult(r)
      showAlert('success', `✓ Sent ${r.sent} emails. ${r.failed} failed.`)
      loadData()
    } catch (e: any) {
      showAlert('error', `Send failed: ${e.message}`)
    }
    setLoading(false)
  }

  // Save settings
  const handleSaveSettings = async () => {
    try {
      await api.saveSettings(settings)
      showAlert('success', '✓ Settings saved!')
    } catch (e: any) {
      showAlert('error', `Save failed: ${e.message}`)
    }
  }

  const unusedLeads = leads.filter(l => !l.used)

  return (
    <>
      <StatusBar />
      <nav>
        <div className="logo">⚡ OPERATION<span>MAIL</span></div>
        <div className="nav-links">
          {(['dashboard','scrape','send','leads','settings'] as const).map(t => (
            <a key={t} href="#" className={tab === t ? 'active' : ''} onClick={e => { e.preventDefault(); setTab(t) }}>
              {t === 'dashboard' && '📊'}{t === 'scrape' && '🔍'}{t === 'send' && '📧'}{t === 'leads' && '👥'}{t === 'settings' && '⚙️'} {' ' + t.toUpperCase()}
            </a>
          ))}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="radar-dot" />
          <span style={{ fontSize: '11px', color: 'var(--radar-green)', letterSpacing: '2px' }}>SYSTEM ONLINE</span>
        </div>
      </nav>

      <div className="container">
        {alert && <Alert type={alert.type}>{alert.msg}</Alert>}

        {/* — DASHBOARD — */}
        {tab === 'dashboard' && (
          <div>
            <div className="stats-grid">
              <StatCard value={stats.totalLeads} label="Total Leads" />
              <StatCard value={stats.totalSent} label="Emails Sent" />
              <StatCard value={unusedLeads.length} label="Ready to Use" />
              <StatCard value={Object.keys(stats.byCountry).length} label="Countries" />
            </div>

            <div className="grid-2">
              <div className="panel">
                <div className="panel-title">📡 Lead Distribution by Country</div>
                {Object.keys(stats.byCountry).length === 0 ? (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>No data yet. Scrape some leads!</p>
                ) : (
                  <div className="bar-chart">
                    {Object.entries(stats.byCountry).slice(0, 8).map(([country, count]) => (
                      <div key={country} className="bar" style={{ height: `${Math.min(100, (count / Math.max(...Object.values(stats.byCountry))) * 100)}%` }}>
                        <div className="tooltip">{country}: {count}</div>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '16px' }}>
                  {Object.entries(stats.byCountry).map(([c, n]) => (
                    <span key={c} className="badge badge-info">{c} ({n})</span>
                  ))}
                </div>
              </div>

              <div className="panel">
                <div className="panel-title">⚡ Quick Actions</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <button className="btn btn-primary" onClick={() => setTab('scrape')}>🔍 SCRAPE NEW LEADS</button>
                  <button className="btn btn-outline" onClick={() => setTab('send')}>📧 SEND CAMPAIGN</button>
                  <button className="btn btn-outline" onClick={() => setTab('leads')}>👥 VIEW ALL LEADS ({leads.length})</button>
                </div>
                <div className="section-divider" />
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.8' }}>
                  <div>📧 <strong style={{ color: 'var(--blue-accent)' }}>{stats.totalSent}</strong> emails sent total</div>
                  <div>👥 <strong style={{ color: 'var(--radar-green)' }}>{unusedLeads.length}</strong> leads ready to contact</div>
                  <div>🌐 <strong style={{ color: 'var(--blue-accent)' }}>{Object.keys(stats.byCountry).length}</strong> countries targeted</div>
                </div>
              </div>
            </div>

            <div className="panel" style={{ marginTop: '20px' }}>
              <div className="panel-title">📋 Recent Leads</div>
              {leads.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>No leads yet. Scrape some!</p>
              ) : (
                <table>
                  <thead><tr><th>#</th><th>Business</th><th>Email</th><th>Country</th><th>Industry</th><th>Status</th></tr></thead>
                  <tbody>
                    {leads.slice(0, 10).map((l, i) => (
                      <tr key={l.id}>
                        <td>{i + 1}</td>
                        <td>{l.name}</td>
                        <td><span style={{ color: 'var(--blue-accent)' }}>{l.email}</span></td>
                        <td>{l.country}</td>
                        <td><span className="badge badge-info">{l.industry}</span></td>
                        <td><span className={`badge ${l.used ? 'badge-warning' : 'badge-success'}`}>{l.used ? 'USED' : 'READY'}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* — SCRAPE — */}
        {tab === 'scrape' && (
          <div className="grid-2">
            <div className="panel">
              <div className="panel-title">🔍 Lead Scraper</div>
              <div className="form-group">
                <label>Industry / Keyword</label>
                <select className="form-control" value={scrapeKeyword} onChange={e => setScrapeKeyword(e.target.value)}>
                  {INDUSTRIES.map(ind => <option key={ind} value={ind}>{ind}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Country</label>
                <select className="form-control" value={scrapeCountry} onChange={e => setScrapeCountry(e.target.value)}>
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <button className="btn btn-primary" onClick={handleScrape} disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
                {loading ? <><span className="spinner" /> SCRAPING...</> : '🚀 START SCRAPE'}
              </button>
              {scrapeResult && (
                <div style={{ marginTop: '20px', fontSize: '13px', lineHeight: '2' }}>
                  <div>📍 Places found: <strong style={{ color: 'var(--blue-accent)' }}>{scrapeResult.totalFound}</strong></div>
                  <div>📧 With emails: <strong style={{ color: 'var(--radar-green)' }}>{scrapeResult.withEmails}</strong></div>
                  <div>💾 Saved to DB: <strong style={{ color: 'var(--radar-green)' }}>{scrapeResult.saved}</strong></div>
                </div>
              )}
            </div>
            <div className="panel">
              <div className="panel-title">📡 How It Works</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '2.2' }}>
                <div>1️⃣ Select an <strong style={{ color: 'var(--blue-accent)' }}>industry</strong> and <strong style={{ color: 'var(--blue-accent)' }}>country</strong></div>
                <div>2️⃣ Click <strong style={{ color: 'var(--radar-green)' }}>START SCRAPE</strong> — Apify hits Google Maps</div>
                <div>3️⃣ We extract emails from business websites</div>
                <div>4️⃣ Leads are saved to your <strong style={{ color: 'var(--blue-accent)' }}>local database</strong></div>
                <div>5️⃣ Go to <strong style={{ color: 'var(--blue-accent)' }}>SEND</strong> tab to blast emails!</div>
              </div>
              <div className="section-divider" />
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                <span className="badge badge-info" style={{ marginRight: '8px' }}>Apify API</span>
                <span className="badge badge-success">Google Maps</span>
              </div>
            </div>
          </div>
        )}

        {/* — SEND — */}
        {tab === 'send' && (
          <div className="grid-2">
            <div className="panel">
              <div className="panel-title">📧 Campaign Sender</div>
              <div className="form-group">
                <label>Country</label>
                <select className="form-control" value={sendCountry} onChange={e => setSendCountry(e.target.value)}>
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Industry</label>
                <select className="form-control" value={sendIndustry} onChange={e => setSendIndustry(e.target.value)}>
                  {INDUSTRIES.map(ind => <option key={ind} value={ind}>{ind}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Number of Emails (max 10/recommended)</label>
                <input type="number" className="form-control" value={sendCount} min={1} max={50} onChange={e => setSendCount(parseInt(e.target.value))} />
              </div>
              <div className="form-group">
                <label>Custom Message (optional — leave blank for default pitch)</label>
                <textarea className="form-control" value={customMsg} onChange={e => setCustomMsg(e.target.value)} placeholder="I help businesses like yours with..." />
              </div>
              <button className="btn btn-primary" onClick={handleSend} disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
                {loading ? <><span className="spinner" /> SENDING...</> : '📤 SEND CAMPAIGN'}
              </button>
              {sendResult && (
                <div style={{ marginTop: '20px', fontSize: '13px', lineHeight: '2' }}>
                  <div>✅ <strong style={{ color: 'var(--radar-green)' }}>{sendResult.sent}</strong> emails sent</div>
                  <div>❌ <strong style={{ color: 'var(--red-alert)' }}>{sendResult.failed}</strong> failed</div>
                </div>
              )}
            </div>
            <div className="panel">
              <div className="panel-title">📡 Email Preview</div>
              <div style={{ background: 'var(--navy-mid)', borderRadius: '8px', padding: '20px', fontSize: '13px' }}>
                <div style={{ borderBottom: '2px solid var(--blue-accent)', paddingBottom: '12px', marginBottom: '16px' }}>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '11px', marginBottom: '4px' }}>SUBJECT:</div>
                  <div style={{ color: 'var(--blue-accent)' }}>{settings.emailSubject}</div>
                </div>
                <p style={{ lineHeight: '1.8' }}>
                  Hi <span style={{ color: 'var(--radar-green)', fontWeight: 'bold' }}>[Business Name]</span>,<br /><br />
                  I noticed your website could be doing more for your business. Slow load times, outdated design, and manual processes cost you customers every day.<br /><br />
                  I help businesses like yours with:<br />
                  <span style={{ color: 'var(--text-secondary)' }}>🌐 Website Design — Modern, high-converting sites<br />
                  ⚡ Automation — n8n workflows eliminate repetitive tasks<br />
                  🤖 AI Agents — Handle customer service 24/7</span><br />
                  I can have a new website or automation running within <strong>48 hours</strong>.<br /><br />
                  Reply <strong style={{ color: 'var(--radar-green)' }}>"YES"</strong> to schedule a free consultation.<br /><br />
                  Best regards,<br />
                  <strong>Swit Developer</strong>
                </p>
              </div>
              <div className="section-divider" />
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                <span className="badge badge-success">Brevo SMTP</span>
                <span className="badge badge-info" style={{ marginLeft: '8px' }}>1 email/sec rate limit</span>
              </div>
            </div>
          </div>
        )}

        {/* — LEADS — */}
        {tab === 'leads' && (
          <div>
            <div className="panel">
              <div className="panel-title">👥 Lead Database ({leads.length} total, {unusedLeads.length} unused)</div>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <button className="btn btn-outline" onClick={() => api.getLeads().then(r => setLeads(r.leads))}>Refresh</button>
                <button className="btn btn-outline" onClick={() => api.getLeads(undefined, true).then(r => setLeads(r.leads))}>Show Unused Only</button>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table>
                  <thead><tr><th>#</th><th>Business</th><th>Email</th><th>Website</th><th>Country</th><th>Industry</th><th>Status</th></tr></thead>
                  <tbody>
                    {leads.map((l, i) => (
                      <tr key={l.id}>
                        <td>{i + 1}</td>
                        <td>{l.name}</td>
                        <td><span style={{ color: 'var(--blue-accent)', fontSize: '12px' }}>{l.email}</span></td>
                        <td><a href={l.website} target="_blank" style={{ fontSize: '11px' }}>{l.website ? '🌐' : '—'}</a></td>
                        <td>{l.country}</td>
                        <td><span className="badge badge-info">{l.industry}</span></td>
                        <td><span className={`badge ${l.used ? 'badge-warning' : 'badge-success'}`}>{l.used ? 'USED' : 'READY'}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* — SETTINGS — */}
        {tab === 'settings' && (
          <div className="grid-2">
            <div className="panel">
              <div className="panel-title">⚙️ API Configuration</div>
              <div className="form-group">
                <label>Brevo API Key</label>
                <input type="password" className="form-control" value={settings.brevoApiKey} onChange={e => setSettings(s => ({ ...s, brevoApiKey: e.target.value }))} placeholder="xkeys-xxxx" />
              </div>
              <div className="form-group">
                <label>Apify API Key</label>
                <input type="password" className="form-control" value={settings.apifyApiKey} onChange={e => setSettings(s => ({ ...s, apifyApiKey: e.target.value }))} placeholder="Apify API token" />
              </div>
              <div className="section-divider" />
              <div className="panel-title">📤 Sender Info</div>
              <div className="form-group">
                <label>Sender Email</label>
                <input type="email" className="form-control" value={settings.senderEmail} onChange={e => setSettings(s => ({ ...s, senderEmail: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Sender Name</label>
                <input type="text" className="form-control" value={settings.senderName} onChange={e => setSettings(s => ({ ...s, senderName: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Default Email Subject</label>
                <input type="text" className="form-control" value={settings.emailSubject} onChange={e => setSettings(s => ({ ...s, emailSubject: e.target.value }))} />
              </div>
              <button className="btn btn-primary" onClick={handleSaveSettings}>💾 SAVE SETTINGS</button>
            </div>
            <div className="panel">
              <div className="panel-title">🔐 API Keys Setup Guide</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '2' }}>
                <div style={{ color: 'var(--blue-accent)', fontWeight: 'bold', marginBottom: '10px' }}>BREVO (formerly Sendinblue):</div>
                <div>1. Go to <a href="https://brevo.com" target="_blank">brevo.com</a> → Settings → SMTP</div>
                <div>2. Create a new SMTP key</div>
                <div>3. Copy the key (starts with <code style={{ color: 'var(--radar-green)' }}>xkeys-</code>)</div>
                <div>4. Paste above and save</div>
                <div style={{ marginTop: '20px', color: 'var(--blue-accent)', fontWeight: 'bold', marginBottom: '10px' }}>APIFY:</div>
                <div>1. Go to <a href="https://apify.com" target="_blank">apify.com</a> → Account → Integrations</div>
                <div>2. Copy your API token</div>
                <div>3. Paste above and save</div>
              </div>
              <div className="section-divider" />
              <div style={{ background: 'var(--navy-mid)', padding: '16px', borderRadius: '8px', fontSize: '12px' }}>
                <div style={{ color: 'var(--red-alert)', marginBottom: '8px' }}>⚠️ SECURITY NOTE</div>
                <div style={{ color: 'var(--text-secondary)' }}>API keys are stored in a local JSON file on the server. For production, use environment variables (.env).</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
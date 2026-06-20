// Closed-beta waitlist capture — Vercel serverless function.
//
// POST { email, keepsakeConsent } -> writes one row to public.waitlist in the
// shared Supabase project, via the SERVICE-ROLE key (server-side only; never
// exposed to the browser). The table has no anon INSERT policy by design, so
// this function is the only write path. See okujiKobo migration 102_waitlist.sql.
//
// keepsakeConsent is the explicit, separate keepsake opt-in (ruling 7). It is
// stored as the upstream of profiles.keepsake_consent_at — an admin propagates
// it onto a profile when the waitlister is selected into the beta.
//
// Required env (set in the okuji-landing Vercel project):
//   SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL)
//   SUPABASE_SERVICE_ROLE_KEY

const { createClient } = require('@supabase/supabase-js')

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Vercel's Node runtime parses a JSON body automatically; guard anyway.
  let body = req.body
  if (typeof body === 'string') {
    try { body = JSON.parse(body) } catch { body = {} }
  }
  body = body || {}

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  if (!email || email.length > 320 || !EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' })
  }
  const keepsakeConsent = body.keepsakeConsent === true

  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('[waitlist] missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY')
    return res.status(500).json({ error: 'The waitlist is temporarily unavailable.' })
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } })

  // Upsert on email: re-submitting updates the consent choice (and updated_at
  // via the table trigger) instead of erroring on the unique constraint.
  const { error } = await supabase
    .from('waitlist')
    .upsert(
      { email, keepsake_consent: keepsakeConsent, source: 'okuji-landing' },
      { onConflict: 'email' },
    )

  if (error) {
    console.error('[waitlist] upsert failed:', error.message)
    return res.status(500).json({ error: 'Could not join the waitlist. Please try again.' })
  }

  return res.status(200).json({ ok: true })
}

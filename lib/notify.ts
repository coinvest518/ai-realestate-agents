import nodemailer from 'nodemailer'

const SMTP_HOST = process.env.SMTP_HOST || ''
const SMTP_PORT = Number(process.env.SMTP_PORT || 587)
const SMTP_USER = process.env.SMTP_USER || ''
const SMTP_PASS = process.env.SMTP_PASS || ''
const FROM_EMAIL = process.env.FROM_EMAIL || 'no-reply@example.com'

let transporter: any = null
function getTransport() {
  if (transporter) return transporter
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
  })
  return transporter
}

export async function sendEmail(to: string, subject: string, text: string, html?: string) {
  try {
    if (!SMTP_HOST) {
      console.warn('SMTP not configured, skipping email to', to)
      return
    }
    const tr = getTransport()
    await tr.sendMail({ from: FROM_EMAIL, to, subject, text, html })
  } catch (err) {
    console.warn('sendEmail error', err)
  }
}

export default sendEmail

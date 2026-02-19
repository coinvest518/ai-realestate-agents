import crypto from "crypto"

const ALGO = "aes-256-gcm"

function getKey() {
  const secret = process.env.INTEGRATIONS_ENCRYPTION_KEY || ""
  if (!secret || secret.length < 8) throw new Error("INTEGRATIONS_ENCRYPTION_KEY must be set and >= 8 chars")
  return crypto.scryptSync(secret, "integrations", 32)
}

export function encrypt(text: string) {
  const iv = crypto.randomBytes(12)
  const key = getKey()
  const cipher = crypto.createCipheriv(ALGO, key, iv)
  const enc = Buffer.concat([cipher.update(text, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${iv.toString("base64")}:${tag.toString("base64")}:${enc.toString("base64")}`
}

export function decrypt(payload: string) {
  const [ivB, tagB, encB] = payload.split(":")
  if (!ivB || !tagB || !encB) throw new Error("Invalid payload")
  const iv = Buffer.from(ivB, "base64")
  const tag = Buffer.from(tagB, "base64")
  const enc = Buffer.from(encB, "base64")
  const key = getKey()
  const decipher = crypto.createDecipheriv(ALGO, key, iv)
  decipher.setAuthTag(tag)
  const out = Buffer.concat([decipher.update(enc), decipher.final()])
  return out.toString("utf8")
}

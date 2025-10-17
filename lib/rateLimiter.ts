import type { NextApiRequest, NextApiResponse } from 'next'

type RateLimitRecord = { timestamps: number[] }
const store = new Map<string, RateLimitRecord>()

const WINDOW_MINUTES = Number(process.env.RATE_LIMIT_WINDOW) || 1
const MAX_REQUESTS = Number(process.env.RATE_LIMIT_MAX) || 10

export default function rateLimiter(req: NextApiRequest, res: NextApiResponse) {
  const ip =
    (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown'
  const now = Date.now()
  const record = store.get(ip) || { timestamps: [] }

  record.timestamps = record.timestamps.filter(
    ts => now - ts < WINDOW_MINUTES * 60 * 1000
  )

  if (record.timestamps.length >= MAX_REQUESTS) {
    res.status(429).json({ error: 'Too many requests, please try again later.' })
    throw new Error('Rate limit exceeded')
  }

  record.timestamps.push(now)
  store.set(ip, record)
}

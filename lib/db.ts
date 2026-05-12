import { PrismaClient } from '@prisma/client'
import { Pool, neonConfig } from '@neondatabase/serverless'
import { PrismaNeon } from '@prisma/adapter-neon'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import path from 'path'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

function createPrisma() {
  const dbUrl = process.env.DATABASE_URL

  // Neon / Postgres (production)
  if (dbUrl && (dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://'))) {
    // Use WebSocket in Node.js runtime (Vercel serverless)
    if (typeof WebSocket === 'undefined') {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      neonConfig.webSocketConstructor = require('ws')
    }
    // Strip channel_binding param — not supported by all Neon driver versions
    const connectionString = dbUrl.replace(/[&?]channel_binding=[^&]*/g, '')
    const pool = new Pool({ connectionString })
    const adapter = new PrismaNeon(pool)
    return new PrismaClient({ adapter })
  }

  // SQLite / libsql (local dev)
  let url: string
  if (dbUrl && !dbUrl.includes('undefined')) {
    url = dbUrl.startsWith('file:.')
      ? `file:${path.resolve(process.cwd(), dbUrl.replace('file:', ''))}`
      : dbUrl
  } else {
    url = `file:${path.resolve(process.cwd(), 'dev.db')}`
  }
  const adapter = new PrismaLibSql({ url })
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? createPrisma()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

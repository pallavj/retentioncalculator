import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

function createPrisma() {
  const dbUrl = process.env.DATABASE_URL

  // Neon / Postgres (production) — use HTTP fetch, no WebSocket needed
  if (dbUrl && (dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://'))) {
    const { Pool, neonConfig } = require('@neondatabase/serverless')
    const { PrismaNeon } = require('@prisma/adapter-neon')
    neonConfig.poolQueryViaFetch = true // HTTP mode — works in all serverless envs
    const pool = new Pool({ connectionString: dbUrl })
    const adapter = new PrismaNeon(pool)
    return new PrismaClient({ adapter })
  }

  // SQLite / libsql (local dev)
  const { PrismaLibSql } = require('@prisma/adapter-libsql')
  const path = require('path')
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

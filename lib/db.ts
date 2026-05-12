import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import path from 'path'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

function createPrisma() {
  const dbUrl = process.env.DATABASE_URL

  // Neon / Postgres (production) — HTTP transport, no WebSocket needed
  if (dbUrl && (dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://'))) {
    const { neon } = require('@neondatabase/serverless')
    const { PrismaNeonHttp } = require('@prisma/adapter-neon')
    // Strip channel_binding — not supported by Neon HTTP driver
    const connectionString = dbUrl.replace(/[&?]channel_binding=[^&]*/g, '')
    const sql = neon(connectionString)
    const adapter = new PrismaNeonHttp(sql)
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

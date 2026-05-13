import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }

function createPrisma(): PrismaClient {
  const dbUrl = process.env.DATABASE_URL

  // Neon / Postgres (production) — HTTP transport, no WebSocket needed
  if (dbUrl && (dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://'))) {
    const { PrismaNeonHttp } = require('@prisma/adapter-neon')
    const connectionString = dbUrl.replace(/[&?]channel_binding=[^&]*/g, '')
    const adapter = new PrismaNeonHttp(connectionString)
    return new PrismaClient({ adapter } as never)
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
  return new PrismaClient({ adapter } as never)
}

// Lazy singleton — only initialised when first accessed, not at module import time
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    if (!globalForPrisma.prisma) {
      globalForPrisma.prisma = createPrisma()
    }
    const client = globalForPrisma.prisma
    const value = (client as never as Record<string | symbol, unknown>)[prop]
    return typeof value === 'function' ? value.bind(client) : value
  },
})

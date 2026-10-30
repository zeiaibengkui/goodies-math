import { PGlite } from '@electric-sql/pglite'

type PGliteGlobal = typeof globalThis & {
  __goodiesMathDb?: Promise<PGlite>
}

const globalForDb = globalThis as PGliteGlobal

let database: Promise<PGlite> | undefined

async function createDb() {
  const config = useRuntimeConfig()
  const dataDir = config.pgliteDataDir || '.data/pglite'
  const db = new PGlite(dataDir)

  await db.waitReady
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS plan_selections (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      plan_id TEXT NOT NULL,
      selected_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `)

  return db
}

export function getDb() {
  if (!database) {
    database = globalForDb.__goodiesMathDb ?? createDb()
    globalForDb.__goodiesMathDb = database
  }

  return database
}

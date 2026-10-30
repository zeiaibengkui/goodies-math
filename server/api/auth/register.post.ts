import { randomUUID } from 'node:crypto'
import { getDb } from '../../utils/db'
import { hashPassword } from '../../utils/password'

type RegisterBody = {
  name?: unknown
  email?: unknown
  password?: unknown
}

function isUniqueViolation(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === '23505'
  )
}

export default defineEventHandler(async (event) => {
  const body = await readBody<RegisterBody>(event)
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password = typeof body?.password === 'string' ? body.password : ''
  const requestedName = typeof body?.name === 'string' ? body.name.trim() : ''

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    throw createError({ statusCode: 400, statusMessage: '请输入有效邮箱' })
  }
  if (password.length < 8 || password.length > 128) {
    throw createError({ statusCode: 400, statusMessage: '密码需为 8–128 位' })
  }

  const name = (requestedName || email.split('@')[0] || '访客').slice(0, 40)
  const db = await getDb()
  const existing = await db.query<{ id: string }>('SELECT id FROM users WHERE email = $1 LIMIT 1', [email])
  if (existing.rows.length > 0) {
    throw createError({ statusCode: 409, statusMessage: '该邮箱已注册' })
  }

  const id = randomUUID()
  try {
    await db.query(
      'INSERT INTO users (id, email, name, password_hash) VALUES ($1, $2, $3, $4)',
      [id, email, name, await hashPassword(password)]
    )
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw createError({ statusCode: 409, statusMessage: '该邮箱已注册' })
    }
    throw error
  }

  return {
    ok: true,
    user: { id, email, name }
  }
})

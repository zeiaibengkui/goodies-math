import { getServerSession } from '#auth'
import { findPlan } from '~~/shared/plans'
import { getDb } from '../../utils/db'

type SelectBody = {
  planId?: unknown
}

export default defineEventHandler(async (event) => {
  const session = await getServerSession(event)
  const userId = session?.user?.id
  if (!userId) {
    throw createError({ statusCode: 401, statusMessage: '请先登录' })
  }

  const body = await readBody<SelectBody>(event)
  const planId = typeof body?.planId === 'string' ? body.planId : ''
  const plan = findPlan(planId)
  if (!plan || plan.free) {
    throw createError({ statusCode: 400, statusMessage: '请选择有效的付费方案' })
  }

  const db = await getDb()
  await db.query(
    `
      INSERT INTO plan_selections (user_id, plan_id, selected_at)
      VALUES ($1, $2, now())
      ON CONFLICT (user_id)
      DO UPDATE SET plan_id = EXCLUDED.plan_id, selected_at = now()
    `,
    [userId, plan.id]
  )

  return {
    ok: true,
    plan: {
      id: plan.id,
      name: plan.name,
      price: plan.price,
      period: plan.period
    }
  }
})

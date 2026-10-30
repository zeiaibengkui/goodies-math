import { getServerSession } from '#auth'
import { findPlan } from '~~/shared/plans'
import { getDb } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const session = await getServerSession(event)
  const userId = session?.user?.id
  if (!userId) return { plan: null }

  const db = await getDb()
  const result = await db.query<{ plan_id: string; selected_at: string | Date }>(
    'SELECT plan_id, selected_at FROM plan_selections WHERE user_id = $1 LIMIT 1',
    [userId]
  )
  const row = result.rows[0]
  if (!row) return { plan: null }

  const plan = findPlan(row.plan_id)
  if (!plan) return { plan: null }

  return {
    plan: {
      id: plan.id,
      name: plan.name,
      price: plan.price,
      period: plan.period,
      selectedAt: row.selected_at
    }
  }
})

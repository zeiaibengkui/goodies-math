import CredentialsProvider from 'next-auth/providers/credentials'
import { NuxtAuthHandler } from '#auth'
import { getDb } from '../../utils/db'
import { verifyPassword } from '../../utils/password'

type UserRow = {
  id: string
  email: string
  name: string
  password_hash: string
}

export default NuxtAuthHandler({
  secret: useRuntimeConfig().authSecret,
  pages: {
    signIn: '/'
  },
  session: {
    strategy: 'jwt'
  },
  providers: [
    // @ts-expect-error CredentialsProvider needs .default during SSR
    CredentialsProvider.default({
      name: 'Credentials',
      credentials: {
        email: { label: '邮箱', type: 'email' },
        password: { label: '密码', type: 'password' }
      },
      async authorize(credentials: Partial<Record<'email' | 'password', string>> | undefined) {
        const email = credentials?.email?.trim().toLowerCase() ?? ''
        const password = credentials?.password ?? ''
        if (!email || !password) return null

        const db = await getDb()
        const result = await db.query<UserRow>(
          'SELECT id, email, name, password_hash FROM users WHERE email = $1 LIMIT 1',
          [email]
        )
        const user = result.rows[0]
        if (!user) return null

        const valid = await verifyPassword(password, user.password_hash)
        if (!valid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id
      return token
    },
    async session({ session, token }) {
      if (session.user) session.user.id = String(token.id ?? token.sub ?? '')
      return session
    }
  }
})

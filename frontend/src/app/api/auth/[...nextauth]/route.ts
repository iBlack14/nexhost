// src/app/api/auth/[...nextauth]/route.ts
import NextAuth, { AuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import EmailProvider  from 'next-auth/providers/email'
import { Pool }       from 'pg'
import PostgresAdapter from '@auth/pg-adapter'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

export const authOptions: AuthOptions = {
  adapter: PostgresAdapter(pool),
  providers: [
    GoogleProvider({
      clientId:     process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    EmailProvider({
      server:       process.env.EMAIL_SERVER,
      from:         process.env.EMAIL_FROM || 'noreply@nexhost.pe',
    }),
  ],
  session: { strategy: 'jwt' },
  pages: {
    signIn:  '/login',
    error:   '/login',
    signOut: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // Fetch role from DB on first login
        const res = await pool.query(
          'SELECT role, status, plan_id FROM users WHERE email = $1',
          [user.email]
        )
        if (res.rows.length) {
          token.role   = res.rows[0].role
          token.status = res.rows[0].status
          token.planId = res.rows[0].plan_id
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role   = token.role
        ;(session.user as any).status = token.status
        ;(session.user as any).planId = token.planId
        ;(session.user as any).id     = token.sub
      }
      return session
    },
    async signIn({ user }) {
      // Auto-crear usuario en nuestra tabla si no existe
      await pool.query(
        `INSERT INTO users (name, email, image)
         VALUES ($1, $2, $3)
         ON CONFLICT (email) DO UPDATE SET
           name  = EXCLUDED.name,
           image = EXCLUDED.image`,
        [user.name, user.email, user.image]
      )
      return true
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }

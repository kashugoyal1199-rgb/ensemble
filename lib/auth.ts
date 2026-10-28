import type { NextAuthOptions } from 'next-auth'
import { getServerSession } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { NextResponse } from 'next/server'
import type { Role } from './huddle'

const list = (v?: string) =>
  (v || '')
    .split(',')
    .map(s => s.trim().toLowerCase())
    .filter(Boolean)

/** Admin Leads are identified by email. Everyone else who signs in is a Team Lead. */
export const roleFor = (email: string): Role => (list(process.env.ADMIN_EMAILS).includes(email.toLowerCase()) ? 'admin' : 'subordinate')

/** Optional: restrict sign-in to one Google Workspace domain, e.g. usefaff.com */
const allowedDomain = () => (process.env.ALLOWED_EMAIL_DOMAIN || '').trim().toLowerCase().replace(/^@/, '')

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      authorization: { params: { prompt: 'select_account' } },
    }),
  ],
  session: { strategy: 'jwt', maxAge: 60 * 60 * 12 },
  pages: { signIn: '/', error: '/' },
  callbacks: {
    async signIn({ profile }) {
      const p = profile as { email?: string; email_verified?: boolean } | undefined
      const email = p?.email?.toLowerCase()
      if (!email || p?.email_verified !== true) return '/?error=unverified'
      const domain = allowedDomain()
      if (domain && !email.endsWith(`@${domain}`)) return '/?error=domain'
      return true
    },
    async jwt({ token }) {
      // Recomputed on every token refresh so ADMIN_EMAILS changes apply on next request.
      if (token.email) token.role = roleFor(token.email)
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = (token.role as Role) ?? 'subordinate'
      }
      return session
    },
  },
}

/** For API route handlers. Returns the user, or a ready-made error response. */
export async function requireUser(opts: { admin?: boolean } = {}) {
  const session = await getServerSession(authOptions)
  const email = session?.user?.email
  if (!session?.user || !email) {
    return { error: NextResponse.json({ error: 'Sign in required' }, { status: 401 }) } as const
  }
  if (opts.admin && session.user.role !== 'admin') {
    return { error: NextResponse.json({ error: 'Admin access required' }, { status: 403 }) } as const
  }
  return { user: { name: session.user.name ?? email, email, role: session.user.role } } as const
}

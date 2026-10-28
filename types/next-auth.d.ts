import 'next-auth'
import 'next-auth/jwt'
import type { Role } from '@/lib/huddle'

declare module 'next-auth' {
  interface Session {
    user: {
      name?: string | null
      email?: string | null
      image?: string | null
      role: Role
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: Role
  }
}

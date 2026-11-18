import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import sql from '@/lib/db';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email = credentials.email.toLowerCase().trim();
        const users = await sql`
          SELECT * FROM users WHERE email = ${email}
        `;
        const user = users[0];
        if (!user) return null;
        if (user.is_banned) throw new Error('BANNED: ' + (user.ban_reason || 'This account has been banned.'));
        if (!user.verified) throw new Error('Please verify your email before signing in');
        const valid = await bcrypt.compare(credentials.password, user.password);
        if (!valid) return null;
        return { id: user.id, email: user.email };
      },
    }),
  ],
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/login',
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
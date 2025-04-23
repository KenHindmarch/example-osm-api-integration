import NextAuth from 'next-auth';
import { OSMProvider } from './lib/auth/providers';

export const { handlers, signIn, signOut, auth } = NextAuth({
    debug: process.env.NODE_ENV === 'development',
    secret: process.env.NEXTAUTH_SECRET,
    session: {
      strategy: "jwt",
    },
    providers: [OSMProvider],
    callbacks: {
      async redirect({ url, baseUrl }) {
        return baseUrl;
      },
      async signIn({ profile, account }) {
        try {
          return true;
        } catch (error) {
          console.error('Error during signin:', error);
          return false;
        }
      },
      async jwt({ token, account, profile }) {
        if (account && profile) {
          Object.assign(token, {
            accessToken: account.access_token,
            refreshToken: account.refresh_token,
            expires_at: account.expires_at,
            id: account.providerAccountId,
            name: profile.name,
            email: profile.email,
            image: profile.image,
          });
         }
         return { ...token };
      },
      async session({ session, token }) {
        if (token && session.user) {
          session.user.name = token.name as string;
          session.user.email = token.email as string;
          session.user.image = token.image as string;
        }
        return session;
      },
    },
  });
  
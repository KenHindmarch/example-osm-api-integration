import NextAuth from 'next-auth';
import { JWT } from 'next-auth/jwt';

export const { handlers, signIn, signOut, auth } = NextAuth({
    // debug: true,
    secret: process.env.NEXTAUTH_SECRET,
    session: {
      strategy: "jwt",
    },
    providers: [
      {
        id: 'osm',
        name: 'Online Scout Manager',
        type: 'oauth',
        wellKnown:
          'https://www.onlinescoutmanager.co.uk/.well-known/openid-configuration',
        issuer: process.env.AUTH0_ISSUER,
        authorization: {
          url: 'https://www.onlinescoutmanager.co.uk/oauth/openid/authorize',
          params: {
            scope:
              'openid email profile',
          },
        },
        userinfo: {
          url: 'https://www.onlinescoutmanager.co.uk/oauth/resource',
        },
        profile(profile) {
            return {...profile}
        },
        token: {
          url: 'https://www.onlinescoutmanager.co.uk/oauth/openid/token',
        },
        clientId: process.env.AUTH0_ID,
        clientSecret: process.env.AUTH0_SECRET,
      },
    ],
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
            const {
                access_token,
                expires_at,
                providerAccountId,
                refresh_token,
            } = account;

            const {                
                name,
                email,
                image,
            } = profile;
            token.accessToken = access_token;
            token.expires_at = expires_at;
            token.id = providerAccountId;
            token.refreshToken = refresh_token;
    
            token.name = name;
            token.email = email;
            token.image = image; 

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
  
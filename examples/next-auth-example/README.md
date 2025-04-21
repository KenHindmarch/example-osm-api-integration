This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

# To create your own Next.js app with OSM Auth integration

## You will need
- Node installed to give access to npx
- An OSM account with an application setup

## Creating the app
In a terminal run the following command
```bash
npx create-next-app@latest next-auth-example --typescript --tailwind --use-pnpm 
cd next-auth-example
```
You can accept all of the other options including ES-lint and the App Router. 

For this example we will be using:
- [Tailwind](https://tailwindcss.com/) - for utility based styling without the need for using CSS
- [Typescript](https://www.typescriptlang.org/) - to extend javascript with a stronly typed language
- [pnpm](https://pnpm.io/) - a more effeicent package manager than npm

## Required packages for Auth
In order to allow us to use the OSM OAuth provider we are going to use next-auth:
```bash
pnpm add next-auth@latest
```

## Auth config
The first step we need to complete is setting up a `.env.local` file to store our configuration details from OSM.
```dotenv
OSM_AUTH0_SECRET=your-osm-application-secret
OSM_AUTH0_ID=your-osm-application-id
OSM_AUTH0_ISSUER='https://www.onlinescoutmanager.co.uk'

NEXTAUTH_SECRET=your-next-auth-secret
```

To allow us to utilise next-auth we will need to create an `auth.ts` in the project root:
```typescript
import NextAuth from 'next-auth';
import { JWT } from 'next-auth/jwt';

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
  
```
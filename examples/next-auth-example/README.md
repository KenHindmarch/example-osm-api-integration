

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

### Environment variables
The first step we need to complete is setting up a `.env.local` file to store our configuration details from OSM.
```dotenv
OSM_AUTH0_SECRET=your-osm-application-secret
OSM_AUTH0_ID=your-osm-application-id
OSM_AUTH0_ISSUER='https://www.onlinescoutmanager.co.uk'

NEXTAUTH_SECRET=your-next-auth-secret
```

### OSM auth provider
Then we can create our OSM auth provider config in a `lib/auth` directory.
```typescript
// lib/auth/providers.ts
import { OAuthConfig } from 'next-auth/providers/oauth';

export const OSMProvider: OAuthConfig<any> = {
  id: 'osm',
  name: 'Online Scout Manager',
  type: 'oauth',
  wellKnown: 'https://www.onlinescoutmanager.co.uk/.well-known/openid-configuration',
  issuer: process.env.AUTH0_ISSUER,
  authorization: {
    url: 'https://www.onlinescoutmanager.co.uk/oauth/openid/authorize',
    params: {
      scope: 'openid email profile',
    },
  },
  userinfo: {
    url: 'https://www.onlinescoutmanager.co.uk/oauth/resource',
  },
  profile(profile) {
    return { ...profile };
  },
  token: {
    url: 'https://www.onlinescoutmanager.co.uk/oauth/openid/token',
  },
  clientId: process.env.AUTH0_ID,
  clientSecret: process.env.AUTH0_SECRET,
};
```

### `Auth.ts` configuration file
To allow us to utilise next-auth we will need to create an `auth.ts` in the project root. Into this we will pull our OSM auth provider and we can also set up callback events for custom handling of sign-in and redirect. We can also setup callbacks to handle how the access token and session objects are built. For now we will keep this simple.
```typescript
// auth.ts

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
```

### Auth API endpoints
Finally to allow our app to be able to use the next-auth functionality we need API routes to handle calls to `signIn`, `callback`, `signOut`, etc. The dynamic API route is placed in `/app/api/auth/[...nextauth]/route.ts` as below:
```typescript
// /app/api/auth/[...nextauth]/route.ts
import { handlers } from '@/auth';
export const { GET, POST } = handlers;
```
This uses the handlers from the `auth.ts` configuration file and will use the various callback methods defined in that file e.g. `signIn`.

## Auth Client Session provider
Now that we have the auth functionality setup we need the app to be able to use it. To allow this we need to wrap the app with a `SessionProvider` from next-auth. This is a client component and as we cannot use a client component in the main layout it is advised to create the provider in a seperate client based file. For this example app we will place it in a `components/providers` directory in the root directory to keep everything tidy.

```typescript
// components/providers/ClientSessionProvider.tsx
'use client';

import { SessionProvider } from 'next-auth/react';

export default function ClientSessionProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <SessionProvider>{children}</SessionProvider>;
}
```

### Add the provider to the layout
Now that we have a client based SessionProvider we can update our Layout to allow our app to use it, anything inside of the provider will now have access to the auth functionality. (If you try to access auth functionality outside of the provider you will receieve an error).
```typescript
// app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ClientSessionProvider from "@/components/providers/ClientSessionProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Example OSM Auth App",
  description: "An app to show how to setup a next.js app with OSM auth integration",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <ClientSessionProvider>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          {children}
        </body>
      </ClientSessionProvider>
    </html>
  );
}
```

### Optional: `AppProviders.tsx` component
As your app grows you may find you need more than one provider to be place around the app in the layout, eg. useContexts, theme providers, etc. To simplify this for any future providers we can create a central provider component to place in our layout:
```typescript
// components/providers/AppProviders.tsx
'use client';

import React from 'react';
import ClientSessionProvider from './ClientSessionProvider'; // Or the correct provider for client session

interface AppProvidersProps {
  children: React.ReactNode;
}

const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {

    return (
        <ClientSessionProvider>
            {children}
        </ClientSessionProvider>
    );
};

export default AppProviders;
```

And the updated layout:
```typescript
// app/layout.tsx
..
import AppProviders from "@/components/providers/AppProviders";
..
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <AppProviders>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          {children}
        </body>
      </AppProviders>
    </html>
  );
}
```
#### Extending the providers
To then extend the included providers we now only need to update AppProviders and it will be included in the whole app without having to modify our layout. For example if we wanted to include the useQuery hook we could extend it like so:
```typescript
// components/providers/AppProviders.tsx
'use client';

import React from 'react';
import ClientSessionProvider from './ClientSessionProvider'; 
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

interface AppProvidersProps {
  children: React.ReactNode;
}

const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  const queryClient = new QueryClient();

  return (
    <ClientSessionProvider>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </ClientSessionProvider>
  );
};

export default AppProviders;
```


## Accessing the auth functionality
As we are using Next.js there are two ways to access the auth functionality depending on whether we are updating a server or client component (the easiest way to tell is usually by checking the top of the form for `"useClient";`).

### Server access
In a server component we can access the auth component directly to check if a session object exists, this should indicate our user is successfully logged in.

```typescript

```

### Client access

In a client compoinent we can use next-auth's `useSession` hook to access the auth functionality and determine if a user is logged in.

```typescript

```

# Next.js boilerplate
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
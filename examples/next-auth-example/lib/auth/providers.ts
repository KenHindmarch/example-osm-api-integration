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

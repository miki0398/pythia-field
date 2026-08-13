export const auth0Config = {
  domain: import.meta.env.VITE_AUTH0_DOMAIN || "YOUR_AUTH0_DOMAIN.us.auth0.com",
  clientId: import.meta.env.VITE_AUTH0_CLIENT_ID || "YOUR_AUTH0_CLIENT_ID",
  redirectUri: `${window.location.origin}/callback`,
  audience: import.meta.env.VITE_AUTH0_AUDIENCE || "https://pythia-field-api",
};

export interface Auth0User {
  sub: string;
  name?: string;
  email?: string;
  email_verified?: boolean;
  picture?: string;
  updated_at?: string;
}
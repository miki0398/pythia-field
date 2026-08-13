import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { Auth0Provider } from "@auth0/auth0-react";
import "./index.css";

import { useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { upsertAuthUser } from "./services/supabase-client";

const domain = import.meta.env.VITE_AUTH0_DOMAIN;
const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID;

function InitializeUser() {
  const { user, isLoading } = useAuth0();

  useEffect(() => {
    if (!isLoading && user && user.sub) {
      console.log('Attempting to save user:', user.sub);
      upsertAuthUser(user).catch(err => console.error('Failed to store user:', err));
    }
  }, [user, isLoading]);

  return null;
}



createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: window.location.origin + "/callback",
      }}
    >
      <>
  <InitializeUser />
  <App />
</>
    </Auth0Provider>
  </StrictMode>,
);
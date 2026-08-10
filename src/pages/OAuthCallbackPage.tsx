import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { exchangeCodeForToken } from "../services/gmail-connector";

export function OAuthCallbackPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // Why: Extract auth code from URL and exchange for access token
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    if (!code) {
      setError("No authorization code received");
      setLoading(false);
      return;
    }

    handleCallback(code);
  }, []);

  const handleCallback = async (code: string) => {
    try {
      // Why: Exchange code for Gmail access token
      const accessToken = await exchangeCodeForToken(code);

      // Why: Store token in sessionStorage (not localStorage, for security)
      sessionStorage.setItem("gmail_access_token", accessToken);

      // Why: Redirect back to home
      navigate("/");
    } catch (err) {
      setError(`OAuth failed: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      height: "100vh",
      background: "linear-gradient(135deg, rgba(26,92,107,0.3), rgba(184,150,46,0.2))",
      color: "#e8d4b8",
      fontSize: "18px"
    }}>
      {loading && <div>Connecting Gmail...</div>}
      {error && <div style={{ color: "#ff6b6b" }}>{error}</div>}
    </div>
  );
}
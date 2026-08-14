import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { exchangeCodeForToken } from "../services/calendar-connector";

export function CalendarOAuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const error = params.get("error");

      if (error) {
        console.error("Calendar OAuth error:", error);
        navigate("/");
        return;
      }

      if (code) {
        try {
          const accessToken = await exchangeCodeForToken(code);
          console.log("Calendar access token obtained");
          localStorage.setItem("calendar_access_token", accessToken);
          navigate("/");
        } catch (err) {
          console.error("Token exchange failed:", err);
          navigate("/");
        }
      }
    };

    handleCallback();
  }, [navigate]);

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
      Processing Calendar authorization...
    </div>
  );
}
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";

export function Auth0CallbackPage() {
  const navigate = useNavigate();
  const { isLoading, error } = useAuth0();

  useEffect(() => {
    if (!isLoading && !error) {
      navigate("/", { replace: true });
    }
  }, [isLoading, error, navigate]);

  if (isLoading) {
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
        Authenticating with Auth0...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        background: "linear-gradient(135deg, rgba(26,92,107,0.3), rgba(184,150,46,0.2))",
        color: "#ff6b6b",
        fontSize: "18px"
      }}>
        <div>
          <div>Authentication Error</div>
          <div style={{ fontSize: "14px", marginTop: "10px" }}>{error.message}</div>
        </div>
      </div>
    );
  }

  return null;
}
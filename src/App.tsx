import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from './pages/HomePage'
import { OAuthCallbackPage } from "./pages/OAuthCallbackPage";
import { Auth0CallbackPage } from "./pages/Auth0CallbackPage";
import { ProtectedRoute } from "./components/ProtectedRoute";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/callback" element={<Auth0CallbackPage />} />
        <Route path="/oauth/gmail/callback" element={<OAuthCallbackPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}
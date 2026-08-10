import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from './pages/HomePage'
import { OAuthCallbackPage } from "./pages/OAuthCallbackPage";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/oauth/gmail/callback" element={<OAuthCallbackPage />} />
      </Routes>
    </Router>
  );
}
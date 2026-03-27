import { Navigate, Route, Routes } from "react-router-dom";

import { AppLayout } from "./layouts/AppLayout";
import { HomePage } from "./pages/HomePage";
import { LearnPage } from "./pages/LearnPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { ProfileSelect } from "./pages/ProfileSelect";
import { ProfilePage } from "./pages/ProfilePage";
import { StudioPage } from "./pages/StudioPage";
import { ToolsPage } from "./pages/ToolsPage";

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/learn" element={<LearnPage />} />
        <Route path="/studio" element={<StudioPage />} />
        <Route path="/tools" element={<ToolsPage />} />
        <Route path="/profile" element={<ProfilePage />} />

        <Route path="/login" element={<Navigate to="/?auth=login" replace />} />
        <Route path="/signup" element={<Navigate to="/?auth=signup" replace />} />
        <Route path="/profile-select" element={<ProfileSelect />} />

        <Route path="/home" element={<Navigate to="/" replace />} />
        <Route path="/dashboard" element={<Navigate to="/learn" replace />} />

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

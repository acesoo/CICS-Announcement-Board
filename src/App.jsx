// src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AppShell from "./components/AppShell";

import LoginPage        from "./pages/LoginPage";
import BlockedPage      from "./pages/BlockedPage";
import StudentDashboard from "./pages/StudentDashboard";
import AdminDashboard   from "./pages/AdminDashboard";
import LibraryPage      from "./pages/LibraryPage";
import UploadPage       from "./pages/UploadPage";
import WhitelistPage    from "./pages/WhitelistPage";
import AuditPage        from "./pages/AuditPage";

import "./styles/globals.css";

function DashboardRouter() {
  const { profile, whitelistData } = useAuth();
  const role = profile?.role || whitelistData?.role;
  if (role === "admin") return <AdminDashboard />;
  return <StudentDashboard />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login"   element={<LoginPage />} />
          <Route path="/blocked" element={<BlockedPage />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardRouter />} />
            <Route path="library" element={<LibraryPage />} />
            <Route path="upload"
              element={<ProtectedRoute requireAdmin><UploadPage /></ProtectedRoute>}
            />
            <Route path="whitelist"
              element={<ProtectedRoute requireAdmin><WhitelistPage /></ProtectedRoute>}
            />
            <Route path="audit"
              element={<ProtectedRoute requireAdmin><AuditPage /></ProtectedRoute>}
            />
          </Route>

          <Route path="/onboarding" element={<Navigate to="/" replace />} />
          <Route path="*"           element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

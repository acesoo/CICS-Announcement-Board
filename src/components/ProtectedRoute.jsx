// src/components/ProtectedRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const { user, profile, whitelistData, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center",
        justifyContent: "center", background: "var(--surface-2)",
      }}>
        <span className="spinner" style={{ width: 32, height: 32 }} />
      </div>
    );
  }

  // Not signed in at all
  if (!user) return <Navigate to="/login" replace />;

  // Signed in but not in whitelist or revoked
  if (!whitelistData || whitelistData.approved !== true) {
    return <Navigate to="/login" replace />;
  }

  // Build effective profile from whitelist if Firestore profile write failed
  const effectiveProfile = profile || {
    uid:         user.uid,
    email:       user.email,
    displayName: user.displayName,
    photoURL:    user.photoURL,
    role:        whitelistData.role    || "student",
    program:     whitelistData.program || null,
    blocked:     false,
  };

  // Blocked user
  if (effectiveProfile.blocked) return <Navigate to="/blocked" replace />;

  // Admin-only route accessed by student
  if (requireAdmin && effectiveProfile.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  // All good — render children with effective profile available
  return children;
}

// src/pages/BlockedPage.jsx
import React from "react";
import { logOut } from "../lib/firebase";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";

export default function BlockedPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logOut();
    navigate("/login");
  }

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "linear-gradient(135deg, #0A3D8F 0%, #081E4A 100%)", padding: "2rem",
    }}>
      <div style={{
        background: "white", borderRadius: 20, padding: "2.5rem",
        maxWidth: 440, width: "100%", textAlign: "center",
        boxShadow: "0 24px 64px rgba(0,0,0,0.35)",
      }}>
        <div style={{ fontSize: 48, marginBottom: "1rem" }}>🚫</div>
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 24, marginBottom: 8 }}>
          Account Restricted
        </h1>
        <p style={{ fontSize: 14, color: "#4A5568", lineHeight: 1.6, marginBottom: "1.5rem" }}>
          Your access to the CICS Announcement Board has been restricted by an administrator.
          {profile?.blockReason && (
            <><br /><br /><strong>Reason:</strong> {profile.blockReason}</>
          )}
        </p>
        <p style={{ fontSize: 13, color: "#8A9AB5", marginBottom: "1.5rem" }}>
          If you believe this is an error, please contact your CICS administrator.
        </p>
        <button
          onClick={handleLogout}
          style={{
            padding: "11px 24px", borderRadius: 10, border: "none",
            background: "#0A3D8F", color: "white", fontFamily: "'DM Sans', sans-serif",
            fontSize: 14, fontWeight: 600, cursor: "pointer",
          }}
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}

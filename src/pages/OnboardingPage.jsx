// src/pages/OnboardingPage.jsx
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import neuLogo from "../assets/neu-logo.png";
import "./OnboardingPage.css";

export default function OnboardingPage() {
  const { user, profile, whitelistData, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const assignedProgram = whitelistData?.program || null;
  const isAdmin = whitelistData?.role === "admin";

  useEffect(() => {
    // Just redirect — profile is already built from whitelist in AuthContext
    // No need to write to Firestore here, AuthContext handles it
    const timer = setTimeout(() => {
      navigate("/");
    }, 1500);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="onboard-bg">
      <div className="onboard-card fade-in">
        <img src={neuLogo} alt="New Era University" className="onboard-neu-logo" />
        <h1 className="onboard-title">Setting up your account…</h1>
        <p className="onboard-sub">
          {isAdmin
            ? "Welcome, Admin. Redirecting to your dashboard."
            : assignedProgram
            ? `Your program has been set to ${assignedProgram}. Redirecting…`
            : "Please wait while we set up your account."}
        </p>
        <div className="onboard-spinner-row">
          <span className="spinner" style={{ width: 28, height: 28 }} />
        </div>
      </div>
    </div>
  );
}

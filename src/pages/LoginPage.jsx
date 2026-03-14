// src/pages/LoginPage.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithGoogle } from "../lib/firebase";
import neuLogo from "../assets/neu-logo.png";
import "./LoginPage.css";

export default function LoginPage() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleGoogleLogin() {
    setError("");
    setLoading(true);
    try {
      await signInWithGoogle();
      navigate("/");
    } catch (err) {
      if (err.message === "NOT_REGISTERED") {
        setError(
          "Account not registered. Your @neu.edu.ph account is not yet registered in the CICS Board. Please contact your administrator to be added."
        );
      } else if (err.message === "NOT_WHITELISTED") {
        setError(
          "Access Denied — your account has been revoked. Please contact your CICS administrator."
        );
      } else if (err.message === "ACCESS_DENIED") {
        setError(
          "Access Denied — Please sign in with your @neu.edu.ph account."
        );
      } else if (err.code === "auth/popup-closed-by-user") {
        setError("Sign-in cancelled. Please try again.");
      } else if (err.code === "auth/popup-blocked") {
        setError("Popup was blocked. Please allow popups for this site and try again.");
      } else {
        setError("Sign-in failed. Please try again.");
        console.error("Login error:", err);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-bg">
      <div className="login-wrapper">
        <div className="login-box">
          <div className="login-logo">
            <img src={neuLogo} alt="New Era University" className="neu-logo-login" />
            <h1 className="login-title">CICS Announcement Board</h1>
            <p className="login-school">New Era University</p>
            <p className="login-sub">Quezon City, Philippines</p>
          </div>

          <div className="login-divider" />

          <button
            className="google-btn"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            {loading
              ? <span className="spinner" style={{ width: 18, height: 18 }} />
              : <GoogleIcon />}
            {loading ? "Signing in…" : "Sign in with Google"}
          </button>

          {error && (
            <div className="error-msg" role="alert">
              ⚠ {error}
            </div>
          )}

          <p className="login-note">
            <span className="neu-badge"><StarIcon /> @neu.edu.ph accounts only</span>
          </p>
        </div>

        <div className="login-footer">
          © 2026 New Era University — College of Information and Computing Sciences.
          All rights reserved.
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
      <path d="M5 1L6.2 3.8H9L6.9 5.7L7.6 8.5L5 7L2.4 8.5L3.1 5.7L1 3.8H3.8L5 1Z" fill="currentColor"/>
    </svg>
  );
}

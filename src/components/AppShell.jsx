// src/components/AppShell.jsx
import React, { useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import { logOut } from "../lib/firebase";
import neuLogo from "../assets/neu-logo.png";
import "./AppShell.css";

const studentNav = [
  { to: "/",        label: "Dashboard",        icon: <DashIcon /> },
  { to: "/library", label: "Document Library", icon: <LibIcon /> },
];

const adminNav = [
  { to: "/",          label: "Dashboard",        icon: <DashIcon /> },
  { to: "/library",   label: "Document Library", icon: <LibIcon /> },
  { to: "/upload",    label: "Upload Document",  icon: <UploadIcon /> },
  { to: "/whitelist", label: "Access Control",   icon: <ShieldIcon /> },
  { to: "/audit",     label: "Audit History",    icon: <AuditIcon /> },
];

export default function AppShell() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [photoError, setPhotoError] = useState(false);

  // Close sidebar whenever route changes
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const isAdmin = profile?.role === "admin";
  const navItems = isAdmin ? adminNav : studentNav;
  const initials = (user?.displayName || "U")
    .split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  async function handleLogout() {
    await logOut();
    navigate("/login");
  }

  const showPhoto = user?.photoURL && !photoError;

  return (
    <div className="app-shell">

      {/* ── Mobile header (hidden on desktop) ── */}
      <header className="mobile-header">
        <button
          className="icon-btn"
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation menu"
        >
          <MenuIcon />
        </button>
        <div className="mobile-logo-row">
          <img src={neuLogo} alt="NEU" className="mobile-neu-logo" />
          <span className="mobile-logo">CICS Board</span>
        </div>
        <div className="mobile-avatar">{initials}</div>
      </header>

      {/* ── Overlay (mobile only, closes sidebar) ── */}
      <div
        className={`overlay ${mobileOpen ? "open" : ""}`}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />

      {/* ── Sidebar ── */}
      <nav className={`sidebar ${mobileOpen ? "open" : ""}`} aria-label="Main navigation">
        <div className="sidebar-logo">
          <img src={neuLogo} alt="NEU Logo" className="neu-logo" />
          <div>
            <div className="s-title">CICS Board</div>
            <div className="s-sub">Quezon City, Philippines</div>
          </div>
        </div>

        <div className="sidebar-nav">
          {isAdmin ? (
            <>
              <div className="nav-section-label">General</div>
              {adminNav.slice(0, 2).map((item) => (
                <NavLink
                  key={item.to} to={item.to} end={item.to === "/"}
                  className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
                >
                  {item.icon}<span>{item.label}</span>
                </NavLink>
              ))}
              <div className="nav-section-label">Management</div>
              {adminNav.slice(2).map((item) => (
                <NavLink
                  key={item.to} to={item.to} end={item.to === "/"}
                  className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
                >
                  {item.icon}<span>{item.label}</span>
                </NavLink>
              ))}
            </>
          ) : (
            <>
              <div className="nav-section-label">Menu</div>
              {studentNav.map((item) => (
                <NavLink
                  key={item.to} to={item.to} end={item.to === "/"}
                  className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
                >
                  {item.icon}<span>{item.label}</span>
                </NavLink>
              ))}
            </>
          )}
        </div>

        <div className="sidebar-footer">
          <div className="user-chip">
            {showPhoto ? (
              <img
                src={user.photoURL} alt={user.displayName}
                className="user-photo"
                onError={() => setPhotoError(true)}
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="user-avatar">{initials}</div>
            )}
            <div className="user-info">
              <div className="u-name">{user?.displayName || "User"}</div>
              <div className="u-role">
                {isAdmin ? "Administrator" : `Student · ${profile?.program || ""}`}
              </div>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <LogoutIcon /> Sign out
          </button>
        </div>
      </nav>

      {/* ── Main page content ── */}
      <main className="main-content">
        <Outlet />
      </main>

      {/* ── Bottom nav (mobile only) ── */}
      <nav className="bottom-nav" aria-label="Mobile navigation">
        {navItems.slice(0, 3).map((item) => (
          <NavLink
            key={item.to} to={item.to} end={item.to === "/"}
            className={({ isActive }) => `bottom-item ${isActive ? "active" : ""}`}
          >
            {item.icon}
            <span>{item.label.split(" ")[0]}</span>
          </NavLink>
        ))}
      </nav>

    </div>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────
function MenuIcon()   { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="22" height="22"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>; }
function DashIcon()   { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="17" height="17"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>; }
function LibIcon()    { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="17" height="17"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>; }
function UploadIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="17" height="17"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>; }
function ShieldIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="17" height="17"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>; }
function AuditIcon()  { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="17" height="17"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>; }
function LogoutIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>; }

// src/pages/UserManagementPage.jsx
import React, { useEffect, useState } from "react";
import { getAllUsers, setUserBlocked } from "../lib/firebase";
import "./UserManagementPage.css";

const BLOCK_REASONS = [
  "Policy Violation",
  "Unauthorized Activity",
  "Administrative Hold",
  "Suspicious Downloads",
  "Other",
];

function UserAvatar({ photoURL, displayName }) {
  const [error, setError] = useState(false);
  const initials = (displayName || "?")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  if (photoURL && !error) {
    return (
      <div className="u-avatar">
        <img
          src={photoURL}
          alt={displayName}
          className="u-photo"
          onError={() => setError(true)}
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }
  return <div className="u-avatar"><span>{initials}</span></div>;
}

export default function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);
  const [reason, setReason] = useState(BLOCK_REASONS[0]);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const all = await getAllUsers();
    setUsers(all);
    setLoading(false);
  }

  const filtered = users.filter(
    (u) =>
      u.displayName?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.program?.toLowerCase().includes(search.toLowerCase())
  );

  function openBlockModal(user) {
    setModal(user);
    setReason(BLOCK_REASONS[0]);
    setNotes("");
  }

  async function confirmBlock() {
    setSaving(true);
    await setUserBlocked(modal.id, true, `${reason}${notes ? ": " + notes : ""}`);
    await load();
    setSaving(false);
    setModal(null);
  }

  async function handleUnblock(uid) {
    await setUserBlocked(uid, false);
    await load();
  }

  return (
    <div className="users-page fade-in">
      <div className="dash-topbar">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-sub">Manage student accounts and access permissions</p>
        </div>
        <div className="search-bar">
          <SearchIcon />
          <input
            type="text"
            placeholder="Search by name, email, program…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Summary chips */}
      <div className="user-summary">
        <div className="summary-chip">
          <span className="s-num">{users.length}</span>
          <span className="s-label">Total</span>
        </div>
        <div className="summary-chip active">
          <span className="s-num">{users.filter((u) => !u.blocked).length}</span>
          <span className="s-label">Active</span>
        </div>
        <div className="summary-chip blocked">
          <span className="s-num">{users.filter((u) => u.blocked).length}</span>
          <span className="s-label">Blocked</span>
        </div>
      </div>

      {/* Table */}
      <div className="table-wrap card">
        {loading ? (
          <div className="loading-row" style={{ padding: "2rem" }}>
            <span className="spinner" /> Loading students…
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state" style={{ padding: "2.5rem" }}>No students found.</div>
        ) : (
          <table className="user-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Program</th>
                <th>Last Login</th>
                <th>Downloads</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="user-cell">
                      <UserAvatar photoURL={u.photoURL} displayName={u.displayName} />
                      <div>
                        <div className="u-name">{u.displayName || "—"}</div>
                        <div className="u-email">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="prog-pill">{u.program || "—"}</span>
                  </td>
                  <td className="muted-cell">{formatDate(u.lastLogin)}</td>
                  <td className="bold-cell">{u.downloadCount || 0}</td>
                  <td>
                    <span className={`badge ${u.blocked ? "badge-blocked" : "badge-active"}`}>
                      <span className="status-dot" />
                      {u.blocked ? "Blocked" : "Active"}
                    </span>
                    {u.blocked && u.blockReason && (
                      <div className="block-reason" title={u.blockReason}>
                        {u.blockReason.length > 28
                          ? u.blockReason.slice(0, 28) + "…"
                          : u.blockReason}
                      </div>
                    )}
                  </td>
                  <td>
                    {u.blocked ? (
                      <button className="action-btn unblock" onClick={() => handleUnblock(u.id)}>
                        Unblock
                      </button>
                    ) : (
                      <button className="action-btn block" onClick={() => openBlockModal(u)}>
                        Block
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Block Modal */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Block Student Access</h2>
            <p className="modal-sub">
              <strong>{modal.displayName}</strong> will lose access to the CICS Document
              Repository. Please provide a reason for auditing purposes.
            </p>
            <div className="form-group">
              <label className="form-label">Reason</label>
              <select
                className="form-input"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              >
                {BLOCK_REASONS.map((r) => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ marginTop: 12 }}>
              <label className="form-label">Additional Notes (optional)</label>
              <input
                className="form-input"
                type="text"
                placeholder="Brief description…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            <div className="modal-footer">
              <button className="btn-ghost" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn-danger" onClick={confirmBlock} disabled={saving}>
                {saving
                  ? <span className="spinner" style={{ width: 16, height: 16 }} />
                  : "Block Access"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function formatDate(ts) {
  if (!ts) return "—";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
}

function SearchIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
}

// src/pages/WhitelistPage.jsx
import React, { useEffect, useState } from "react";
import {
  getAllWhitelistEntries,
  addToWhitelist,
  setWhitelistApproved,
  updateWhitelistRole,
  removeFromWhitelist,
} from "../lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import "./WhitelistPage.css";

const PROGRAMS = [
  { code: "CS",  name: "Computer Science" },
  { code: "IT",  name: "Information Technology" },
  { code: "IS",  name: "Information Systems" },
  { code: "EMC", name: "Entertainment & Multimedia Computing" },
];

const BLOCK_REASONS = [
  "Policy Violation",
  "Unauthorized Activity",
  "Administrative Hold",
  "Suspicious Downloads",
  "Other",
];

export default function WhitelistPage() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [blockModal, setBlockModal] = useState(null);
  const [blockReason, setBlockReason] = useState(BLOCK_REASONS[0]);
  const [blockNotes, setBlockNotes] = useState("");
  const [blocking, setBlocking] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState("student");
  const [newProgram, setNewProgram] = useState("CS");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const all = await getAllWhitelistEntries();
    setEntries(all);
    setLoading(false);
  }

  const filtered = entries.filter(
    (e) =>
      e.email?.toLowerCase().includes(search.toLowerCase()) ||
      e.role?.toLowerCase().includes(search.toLowerCase()) ||
      e.program?.toLowerCase().includes(search.toLowerCase()) ||
      e.displayName?.toLowerCase().includes(search.toLowerCase())
  );

  const pendingCount = entries.filter((e) => e.pending && e.role === "student").length;

  async function handleAdd() {
    setAddError("");
    if (!newEmail.trim()) return setAddError("Email is required.");
    if (!newEmail.endsWith("@neu.edu.ph")) return setAddError("Must be an @neu.edu.ph email.");
    if (entries.find((e) => e.email === newEmail.trim())) return setAddError("Already in the list.");
    if (newRole === "student" && !newProgram) return setAddError("Please select a program.");
    setAdding(true);
    try {
      await addToWhitelist(newEmail.trim().toLowerCase(), newRole, newRole === "admin" ? null : newProgram);
      await load();
      setShowAddModal(false);
      setNewEmail(""); setNewRole("student"); setNewProgram("CS");
    } catch (err) {
      setAddError("Failed: " + err.message);
    } finally {
      setAdding(false);
    }
  }

  async function handleBlock() {
    setBlocking(true);
    try {
      await updateDoc(doc(db, "whitelist", blockModal.email), {
        approved:    false,
        blocked:     true,
        blockReason: `${blockReason}${blockNotes ? ": " + blockNotes : ""}`,
      });
      await load();
      setBlockModal(null);
    } catch (err) {
      alert("Failed to block: " + err.message);
    } finally {
      setBlocking(false);
    }
  }

  async function handleUnblock(email) {
    await updateDoc(doc(db, "whitelist", email), {
      approved: true, blocked: false, blockReason: "",
    });
    await load();
  }

  async function handleRoleChange(email, role) {
    await updateWhitelistRole(email, role);
    await load();
  }

  async function handleProgramChange(email, program) {
    await updateDoc(doc(db, "whitelist", email), { program, pending: false });
    await load();
  }

  async function handleRemove(email) {
    if (!window.confirm(`Remove ${email}? They will no longer be able to log in.`)) return;
    await removeFromWhitelist(email);
    await load();
  }

  return (
    <div className="whitelist-page fade-in">
      <div className="wl-topbar">
        <div>
          <h1 className="page-title">Access Control</h1>
          <p className="page-sub">Manage accounts, programs, and access permissions</p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <div className="search-bar wide">
            <SearchIcon />
            <input
              type="text"
              placeholder="Search by name, email, role…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="btn-primary" onClick={() => setShowAddModal(true)}>
            <PlusIcon /> Add Account
          </button>
        </div>
      </div>

      {pendingCount > 0 && (
        <div className="pending-banner">
          <span>⚠</span>
          <span>
            <strong>{pendingCount} student{pendingCount > 1 ? "s" : ""}</strong> logged in but
            {pendingCount > 1 ? " haven't" : " hasn't"} been assigned a program yet.
          </span>
        </div>
      )}

      <div className="wl-summary">
        <div className="summary-chip"><span className="s-num">{entries.length}</span><span className="s-label">Total</span></div>
        <div className="summary-chip approved"><span className="s-num">{entries.filter((e) => e.approved && !e.pending).length}</span><span className="s-label">Active</span></div>
        <div className="summary-chip admin"><span className="s-num">{entries.filter((e) => e.role === "admin").length}</span><span className="s-label">Admins</span></div>
        {pendingCount > 0 && <div className="summary-chip pending"><span className="s-num">{pendingCount}</span><span className="s-label">Pending</span></div>}
        <div className="summary-chip revoked"><span className="s-num">{entries.filter((e) => !e.approved).length}</span><span className="s-label">Blocked</span></div>
      </div>

      <div className="table-wrap card">
        {loading ? (
          <div className="loading-row" style={{ padding: "2rem" }}>
            <span className="spinner" /> Loading accounts…
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state" style={{ padding: "2.5rem" }}>No accounts found.</div>
        ) : (
          <table className="wl-table">
            <thead>
              <tr>
                <th>Account</th>
                <th>Role</th>
                <th>Program</th>
                <th>Status</th>
                <th>Last Login</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((entry) => (
                <tr key={entry.id} className={entry.pending ? "pending-row" : ""}>
                  <td>
                    <div className="email-cell">
                      <div className="e-avatar">
                        {entry.photoURL ? (
                          <img src={entry.photoURL} alt={entry.displayName} referrerPolicy="no-referrer" onError={(e) => { e.target.style.display = "none"; }} />
                        ) : entry.email?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div className="e-name">{entry.displayName || "—"}</div>
                        <div className="e-email">{entry.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <select className="role-select" value={entry.role} onChange={(e) => handleRoleChange(entry.email, e.target.value)}>
                      <option value="student">Student</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td>
                    {entry.role === "admin" ? (
                      <span className="prog-pill admin-pill">All Access</span>
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <select
                          className={`role-select ${!entry.program ? "unassigned" : ""}`}
                          value={entry.program || ""}
                          onChange={(e) => handleProgramChange(entry.email, e.target.value)}
                        >
                          <option value="" disabled>Assign…</option>
                          {PROGRAMS.map((p) => (
                            <option key={p.code} value={p.code}>{p.code} — {p.name}</option>
                          ))}
                        </select>
                        {entry.pending && <span className="pending-badge">Pending</span>}
                      </div>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${entry.approved ? "badge-active" : "badge-blocked"}`}>
                      <span className="status-dot" />
                      {entry.approved ? "Active" : "Blocked"}
                    </span>
                    {!entry.approved && entry.blockReason && (
                      <div className="block-reason-text">{entry.blockReason}</div>
                    )}
                  </td>
                  <td className="muted-cell">{formatDate(entry.lastLogin)}</td>
                  <td>
                    <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                      {entry.approved ? (
                        <button className="action-btn block" onClick={() => { setBlockModal(entry); setBlockReason(BLOCK_REASONS[0]); setBlockNotes(""); }}>
                          Block
                        </button>
                      ) : (
                        <button className="action-btn unblock" onClick={() => handleUnblock(entry.email)}>
                          Unblock
                        </button>
                      )}
                      <button className="action-btn remove" onClick={() => handleRemove(entry.email)}>
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Block Modal */}
      {blockModal && (
        <div className="modal-overlay" onClick={() => setBlockModal(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Block Student Access</h2>
            <p className="modal-sub">
              <strong>{blockModal.displayName || blockModal.email}</strong> will lose access to CICS Board.
            </p>
            <div className="form-group">
              <label className="form-label">Reason</label>
              <select className="form-input" value={blockReason} onChange={(e) => setBlockReason(e.target.value)}>
                {BLOCK_REASONS.map((r) => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ marginTop: 12 }}>
              <label className="form-label">Additional Notes (optional)</label>
              <input className="form-input" type="text" placeholder="Brief description…" value={blockNotes} onChange={(e) => setBlockNotes(e.target.value)} />
            </div>
            <div className="modal-footer">
              <button className="btn-ghost" onClick={() => setBlockModal(null)}>Cancel</button>
              <button className="btn-danger" onClick={handleBlock} disabled={blocking}>
                {blocking ? <span className="spinner" style={{ width: 16, height: 16 }} /> : "Block Access"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Add Account</h2>
            <p className="modal-sub">Pre-register an account before they log in.</p>
            <div className="form-group">
              <label className="form-label">NEU Email Address</label>
              <input className="form-input" type="email" placeholder="student@neu.edu.ph" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAdd()} autoFocus />
            </div>
            <div className="form-group" style={{ marginTop: 12 }}>
              <label className="form-label">Role</label>
              <select className="form-input" value={newRole} onChange={(e) => setNewRole(e.target.value)}>
                <option value="student">Student</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            {newRole === "student" && (
              <div className="form-group" style={{ marginTop: 12 }}>
                <label className="form-label">Program</label>
                <select className="form-input" value={newProgram} onChange={(e) => setNewProgram(e.target.value)}>
                  {PROGRAMS.map((p) => <option key={p.code} value={p.code}>{p.code} — {p.name}</option>)}
                </select>
              </div>
            )}
            {addError && <div className="add-error">{addError}</div>}
            <div className="modal-footer">
              <button className="btn-ghost" onClick={() => { setShowAddModal(false); setAddError(""); }}>Cancel</button>
              <button className="btn-primary" onClick={handleAdd} disabled={adding}>
                {adding ? <span className="spinner" style={{ width: 16, height: 16 }} /> : "Add Account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function formatDate(ts) {
  if (!ts) return "Never";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
}
function SearchIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>; }
function PlusIcon()   { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="15" height="15"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>; }

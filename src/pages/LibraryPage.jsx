// src/pages/LibraryPage.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../lib/AuthContext";
import { db, recordDownload, recordView } from "../lib/firebase";
import { collection, getDocs, query, orderBy, deleteDoc, updateDoc, doc } from "firebase/firestore";
import DocumentCard from "../components/DocumentCard";
import "./LibraryPage.css";

const PROGRAMS   = ["All", "CS", "IT", "IS", "EMC"];
const CATEGORIES = ["All", "Announcement", "Form", "Guideline", "Memo"];
const YEARS      = ["All", "2025–2026", "2026–2027"];

export default function LibraryPage() {
  const { user, profile } = useAuth();
  const isAdmin = profile?.role === "admin";

  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [program, setProgram] = useState("All");
  const [category, setCategory] = useState("All");
  const [year, setYear] = useState("All");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [showHidden, setShowHidden] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, "documents"), orderBy("createdAt", "desc")));
      setDocs(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("Load error:", err);
    }
    setLoading(false);
  }

  async function handleToggleHidden(docId, currentlyHidden) {
    try {
      await updateDoc(doc(db, "documents", docId), { hidden: !currentlyHidden });
      setDocs((prev) => prev.map((d) => d.id === docId ? { ...d, hidden: !currentlyHidden } : d));
    } catch (err) {
      alert("Failed to update visibility: " + err.message);
    }
  }

  async function handleDelete(docId) {
    try {
      await deleteDoc(doc(db, "documents", docId));
      setDocs((prev) => prev.filter((d) => d.id !== docId));
      setConfirmDelete(null);
    } catch (err) {
      alert("Failed to delete: " + err.message);
    }
  }

  async function handleDownload(document) {
    // Record download event for audit tracking
    if (user?.uid) {
      await recordDownload(document.id, user.uid);
    }
    window.open(document.downloadUrl || document.fileUrl, "_blank");
  }

  async function handlePreview(document) {
    // Record view event for audit tracking
    if (user?.uid) {
      await recordView(document.id, user.uid);
    }
    window.open(document.fileUrl, "_blank");
  }

  const hiddenCount = docs.filter((d) => d.hidden === true).length;

  const filtered = docs.filter((d) => {
    if (isAdmin) {
      if (!showHidden && d.hidden === true) return false;
    } else {
      if (d.hidden === true) return false;
    }
    const q = search.toLowerCase();
    const matchSearch = !q ||
      d.title?.toLowerCase().includes(q) ||
      (d.tags || []).some((t) => t.toLowerCase().includes(q));
    const matchProg =
      program === "All" ||
      d.programs?.includes(program) ||
      d.programs?.includes("All");
    const matchCat  = category === "All" || d.category === category;
    const matchYear = year === "All" || d.year === year;
    return matchSearch && matchProg && matchCat && matchYear;
  });

  return (
    <div className="library-page fade-in">
      <div className="lib-topbar">
        <div>
          <h1 className="page-title">Document Library</h1>
          <p className="page-sub">Browse and download official CICS documents</p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          {isAdmin && (
            <button
              className={`hidden-toggle-btn ${showHidden ? "active" : ""}`}
              onClick={() => setShowHidden((prev) => !prev)}
            >
              {showHidden ? <ShowIcon /> : <HideIcon />}
              {showHidden ? `Showing ${hiddenCount} hidden` : `Show hidden (${hiddenCount})`}
            </button>
          )}
          <div className="search-bar wide">
            <SearchIcon />
            <input
              type="text"
              placeholder="Search by title, tags, keywords…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="lib-layout">
        <aside className="filter-panel card">
          <div className="fp-title">Filters</div>
          <div className="fp-group">
            <div className="fp-label">Program</div>
            {PROGRAMS.map((p) => (
              <label key={p} className={`fp-option ${program === p ? "active" : ""}`}>
                <input type="radio" name="program" checked={program === p} onChange={() => setProgram(p)} />
                {p === "All" ? "All Programs" : p}
              </label>
            ))}
          </div>
          <div className="fp-group">
            <div className="fp-label">Category</div>
            {CATEGORIES.map((c) => (
              <label key={c} className={`fp-option ${category === c ? "active" : ""}`}>
                <input type="radio" name="category" checked={category === c} onChange={() => setCategory(c)} />
                {c === "All" ? "All Categories" : c}
              </label>
            ))}
          </div>
          <div className="fp-group">
            <div className="fp-label">Year</div>
            {YEARS.map((y) => (
              <label key={y} className={`fp-option ${year === y ? "active" : ""}`}>
                <input type="radio" name="year" checked={year === y} onChange={() => setYear(y)} />
                {y === "All" ? "All Years" : y}
              </label>
            ))}
          </div>
          <button className="btn-ghost" style={{ width: "100%", marginTop: "0.5rem", fontSize: 13 }}
            onClick={() => { setProgram("All"); setCategory("All"); setYear("All"); setSearch(""); }}>
            Clear Filters
          </button>
        </aside>

        <div className="lib-main">
          <div className="results-bar">
            <span className="results-count">
              {loading ? "Loading…" : `${filtered.length} document${filtered.length !== 1 ? "s" : ""}${isAdmin && hiddenCount > 0 && !showHidden ? ` · ${hiddenCount} hidden` : ""}`}
            </span>
          </div>
          {loading ? (
            <div className="loading-row"><span className="spinner" /> Loading documents…</div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              {isAdmin && !showHidden && hiddenCount > 0
                ? `No visible documents. ${hiddenCount} are hidden — click "Show hidden" to see them.`
                : "No documents match your filters."}
            </div>
          ) : (
            <div className="doc-grid">
              {filtered.map((document) => (
                <DocumentCard
                  key={document.id}
                  doc={document}
                  isAdmin={isAdmin}
                  onDownload={() => handleDownload(document)}
                  onPreview={() => handlePreview(document)}
                  onToggleHidden={() => handleToggleHidden(document.id, document.hidden)}
                  onDelete={() => setConfirmDelete(document)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Delete Document</h2>
            <p className="modal-sub">
              Are you sure you want to permanently delete <strong>"{confirmDelete.title}"</strong>? This cannot be undone.
            </p>
            <div className="modal-footer">
              <button className="btn-ghost" onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button className="btn-danger" onClick={() => handleDelete(confirmDelete.id)}>Delete Permanently</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SearchIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>; }
function HideIcon()   { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>; }
function ShowIcon()   { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>; }

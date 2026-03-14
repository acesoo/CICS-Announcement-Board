// src/pages/AuditPage.jsx
import React, { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import {
  collection, getDocs, query,
  orderBy, limit, where, Timestamp,
} from "firebase/firestore";
import "./AuditPage.css";

const EVENT_TYPES = ["All", "Login", "Download", "View"];
const PERIODS = [
  { label: "Today",      days: 1  },
  { label: "This Week",  days: 7  },
  { label: "This Month", days: 30 },
  { label: "All Time",   days: 0  },
];

export default function AuditPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [period, setPeriod] = useState("This Week");
  const [search, setSearch] = useState("");

  // Cache for resolving UIDs to display names
  const [userCache, setUserCache] = useState({});
  const [docCache, setDocCache] = useState({});

  useEffect(() => { loadAll(); }, [period]);

  async function loadAll() {
    setLoading(true);
    try {
      const since = getSince(period);

      const [loginSnap, dlSnap, viewSnap, usersSnap, docsSnap] = await Promise.all([
        getDocs(query(collection(db, "loginEvents"),   ...(since ? [where("timestamp", ">=", since)] : []), orderBy("timestamp", "desc"), limit(200))),
        getDocs(query(collection(db, "downloadEvents"), ...(since ? [where("timestamp", ">=", since)] : []), orderBy("timestamp", "desc"), limit(200))),
        getDocs(query(collection(db, "viewEvents"),    ...(since ? [where("timestamp", ">=", since)] : []), orderBy("timestamp", "desc"), limit(200))),
        getDocs(collection(db, "users")),
        getDocs(collection(db, "documents")),
      ]);

      // Build lookup caches
      const uCache = {};
      usersSnap.docs.forEach((d) => { uCache[d.id] = d.data(); });
      setUserCache(uCache);

      const dCache = {};
      docsSnap.docs.forEach((d) => { dCache[d.id] = d.data(); });
      setDocCache(dCache);

      const loginEvents = loginSnap.docs.map((d) => ({
        id: d.id, type: "Login", ...d.data(),
      }));
      const dlEvents = dlSnap.docs.map((d) => ({
        id: d.id, type: "Download", ...d.data(),
      }));
      const viewEvents = viewSnap.docs.map((d) => ({
        id: d.id, type: "View", ...d.data(),
      }));

      // Merge and sort by timestamp desc
      const all = [...loginEvents, ...dlEvents, ...viewEvents].sort((a, b) => {
        const ta = a.timestamp?.toDate?.() || new Date(0);
        const tb = b.timestamp?.toDate?.() || new Date(0);
        return tb - ta;
      });

      setEvents(all);
    } catch (err) {
      console.error("Audit load error:", err);
    }
    setLoading(false);
  }

  function getSince(periodLabel) {
    const p = PERIODS.find((p) => p.label === periodLabel);
    if (!p || p.days === 0) return null;
    const d = new Date();
    d.setDate(d.getDate() - p.days);
    return Timestamp.fromDate(d);
  }

  const filtered = events.filter((e) => {
    const matchType = filter === "All" || e.type === filter;
    const user = userCache[e.uid];
    const doc  = docCache[e.docId];
    const matchSearch = !search ||
      user?.email?.toLowerCase().includes(search.toLowerCase()) ||
      user?.displayName?.toLowerCase().includes(search.toLowerCase()) ||
      doc?.title?.toLowerCase().includes(search.toLowerCase()) ||
      e.uid?.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  // Summary counts
  const loginCount  = events.filter((e) => e.type === "Login").length;
  const dlCount     = events.filter((e) => e.type === "Download").length;
  const viewCount   = events.filter((e) => e.type === "View").length;

  return (
    <div className="audit-page fade-in">
      <div className="audit-topbar">
        <div>
          <h1 className="page-title">Audit History</h1>
          <p className="page-sub">All logins, downloads, and document views</p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <div className="search-bar wide">
            <SearchIcon />
            <input
              type="text"
              placeholder="Search by user or document..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Period tabs */}
      <div className="period-tabs">
        {PERIODS.map((p) => (
          <button
            key={p.label}
            className={`tab-btn ${period === p.label ? "active" : ""}`}
            onClick={() => setPeriod(p.label)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Summary */}
      <div className="audit-summary">
        <div className="audit-stat">
          <div className="as-icon login-icon"><LoginIcon /></div>
          <div>
            <div className="as-num">{loginCount}</div>
            <div className="as-label">Logins</div>
          </div>
        </div>
        <div className="audit-stat">
          <div className="as-icon dl-icon"><DownloadIcon /></div>
          <div>
            <div className="as-num">{dlCount}</div>
            <div className="as-label">Downloads</div>
          </div>
        </div>
        <div className="audit-stat">
          <div className="as-icon view-icon"><ViewIcon /></div>
          <div>
            <div className="as-num">{viewCount}</div>
            <div className="as-label">Views</div>
          </div>
        </div>
        <div className="audit-stat">
          <div className="as-icon total-icon"><UsersIcon /></div>
          <div>
            <div className="as-num">{new Set(events.map((e) => e.uid)).size}</div>
            <div className="as-label">Unique Users</div>
          </div>
        </div>
      </div>

      {/* Type filter */}
      <div className="type-filter">
        {EVENT_TYPES.map((t) => (
          <button
            key={t}
            className={`type-btn ${filter === t ? "active" : ""} ${t.toLowerCase()}`}
            onClick={() => setFilter(t)}
          >
            {t}
            {t !== "All" && (
              <span className="type-count">
                {events.filter((e) => e.type === t).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Events table */}
      <div className="audit-table-wrap card">
        {loading ? (
          <div className="loading-row" style={{ padding: "2rem" }}>
            <span className="spinner" /> Loading audit events…
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state" style={{ padding: "2.5rem" }}>
            No events found for this period.
          </div>
        ) : (
          <table className="audit-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>User</th>
                <th>Document</th>
                <th>Date & Time</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((event) => {
                const user = userCache[event.uid];
                const doc  = docCache[event.docId];
                return (
                  <tr key={event.id}>
                    <td>
                      <span className={`event-badge event-${event.type.toLowerCase()}`}>
                        {event.type === "Login"    && <LoginIcon />}
                        {event.type === "Download" && <DownloadIcon />}
                        {event.type === "View"     && <ViewIcon />}
                        {event.type}
                      </span>
                    </td>
                    <td>
                      <div className="audit-user">
                        <div className="au-name">{user?.displayName || "Unknown User"}</div>
                        <div className="au-email">{user?.email || event.uid}</div>
                      </div>
                    </td>
                    <td>
                      {doc ? (
                        <div className="audit-doc">
                          <div className="ad-title">{doc.title}</div>
                          <div className="ad-cat">{doc.category}</div>
                        </div>
                      ) : (
                        <span className="muted-cell">—</span>
                      )}
                    </td>
                    <td className="muted-cell datetime-cell">
                      {formatDateTime(event.timestamp)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {filtered.length > 0 && (
        <div className="audit-footer-note">
          Showing {filtered.length} of {events.length} events
        </div>
      )}
    </div>
  );
}

function formatDateTime(ts) {
  if (!ts) return "—";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString("en-PH", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}

function SearchIcon()   { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>; }
function LoginIcon()    { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>; }
function DownloadIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>; }
function ViewIcon()     { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>; }
function UsersIcon()    { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>; }

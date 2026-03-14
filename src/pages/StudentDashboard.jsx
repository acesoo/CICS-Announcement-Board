// src/pages/StudentDashboard.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../lib/AuthContext";
import { db } from "../lib/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "./StudentDashboard.css";

const CATEGORIES = ["All", "Announcement", "Form", "Guideline", "Memo"];

const DAYS    = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS  = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

export default function StudentDashboard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [now, setNow] = useState(new Date());

  const prog = profile?.program || "IT";
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = user?.displayName?.split(" ")[0] || "Student";

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const snap = await getDocs(
          query(collection(db, "documents"), orderBy("createdAt", "desc"))
        );
        const all = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((d) => d.hidden !== true);
        setDocs(all);
      } catch (err) {
        console.error("Load error:", err);
      }
      setLoading(false);
    }
    load();
  }, []);

  // Documents relevant to this student's program
  const relevant = docs.filter((d) => {
    const matchProg =
      d.programs?.includes(prog) ||
      d.programs?.includes("All") ||
      d.programs?.includes("all");
    const matchSearch =
      !search ||
      d.title?.toLowerCase().includes(search.toLowerCase()) ||
      (d.tags || []).some((t) => t.toLowerCase().includes(search.toLowerCase()));
    const matchCat = activeCategory === "All" || d.category === activeCategory;
    return matchProg && matchSearch && matchCat;
  });

  // Recently viewed (just last 4 docs for now)
  const recent = docs.slice(0, 4);

  // Calendar helpers
  const year  = now.getFullYear();
  const month = now.getMonth();
  const today = now.getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const calCells = Array.from({ length: firstDay + daysInMonth }, (_, i) =>
    i < firstDay ? null : i - firstDay + 1
  );
  // Pad to full weeks
  while (calCells.length % 7 !== 0) calCells.push(null);

  const timeStr = now.toLocaleTimeString("en-PH", {
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
  const dateStr = now.toLocaleDateString("en-PH", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  return (
    <div className="student-dash fade-in">
      <div className="dash-topbar">
        <div>
          <h1 className="page-title">{greeting}, {firstName}!</h1>
          <p className="page-sub">
            Here's what's relevant for your <strong>{prog}</strong> program today.
          </p>
        </div>
        <div className="search-bar wide">
          <SearchIcon />
          <input
            type="text"
            placeholder="Search announcements…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="dash-layout">
        {/* Left — main content */}
        <div className="dash-main">

          {/* Category chips */}
          <div className="section-block">
            <h2 className="section-title">Suggested for {prog}</h2>
            <div className="chip-row">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  className={`chip ${activeCategory === c ? "active" : ""}`}
                  onClick={() => setActiveCategory(c)}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Recently Viewed */}
          {recent.length > 0 && (
            <div className="section-block">
              <h2 className="section-title">Recently Viewed</h2>
              <div className="recent-row">
                {recent.map((doc) => (
                  <div
                    key={doc.id}
                    className="recent-card"
                    onClick={() => window.open(doc.fileUrl, "_blank")}
                  >
                    <span className={`badge badge-${doc.category?.toLowerCase()}`}>
                      {doc.category}
                    </span>
                    <div className="r-title">{doc.title}</div>
                    <div className="r-date">{formatDate(doc.createdAt)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Divider */}
          <div className="section-divider">
            <span className="divider-label">Announcements for {prog}</span>
          </div>

          {/* Program-relevant documents */}
          {loading ? (
            <div className="loading-row">
              <span className="spinner" /><span>Loading…</span>
            </div>
          ) : relevant.length === 0 ? (
            <div className="empty-state">
              No documents found for your program.{" "}
              <button
                className="link-btn"
                onClick={() => navigate("/library")}
              >
                Browse the full library →
              </button>
            </div>
          ) : (
            <div className="announce-list">
              {relevant.map((doc) => (
                <AnnouncementRow key={doc.id} doc={doc} />
              ))}
            </div>
          )}

          {relevant.length > 0 && (
            <button
              className="view-all-btn"
              onClick={() => navigate("/library")}
            >
              View All Documents in Library →
            </button>
          )}
        </div>

        {/* Right — calendar widget */}
        <aside className="dash-sidebar">
          <div className="calendar-card card">
            {/* Live clock */}
            <div className="clock-block">
              <div className="clock-time">{timeStr}</div>
              <div className="clock-date">{dateStr}</div>
            </div>

            <div className="cal-divider" />

            {/* Month header */}
            <div className="cal-header">
              <span className="cal-month">{MONTHS[month]} {year}</span>
            </div>

            {/* Day labels */}
            <div className="cal-grid">
              {DAYS.map((d) => (
                <div key={d} className="cal-day-label">{d}</div>
              ))}
              {calCells.map((day, i) => (
                <div
                  key={i}
                  className={`cal-cell ${day === today ? "today" : ""} ${!day ? "empty" : ""}`}
                >
                  {day}
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function AnnouncementRow({ doc }) {
  const category = doc.category?.toLowerCase() || "announcement";
  return (
    <div className="announce-row card">
      <div className="announce-left">
        <span className={`badge badge-${category}`}>{doc.category}</span>
        <h3 className="announce-title">{doc.title}</h3>
        <div className="announce-meta">
          <span>📅 {formatDate(doc.createdAt)}</span>
          {doc.year && <span>· {doc.year}</span>}
          {doc.tags?.slice(0, 2).map((t) => (
            <span key={t} className="announce-tag">#{t}</span>
          ))}
        </div>
      </div>
      <div className="announce-actions">
        <button
          className="dl-btn download-btn"
          title="Download"
          onClick={() => window.open(doc.downloadUrl || doc.fileUrl, "_blank")}
        >
          <DownloadIcon />
        </button>
        <button
          className="dl-btn open-btn"
          title="Open"
          onClick={() => window.open(doc.fileUrl, "_blank")}
        >
          <OpenIcon />
        </button>
      </div>
    </div>
  );
}

function formatDate(ts) {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" });
}

function SearchIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
}
function DownloadIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" width="14" height="14"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;
}
function OpenIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" width="14" height="14"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>;
}

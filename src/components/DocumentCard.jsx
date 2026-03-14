// src/components/DocumentCard.jsx
import React from "react";
import "./DocumentCard.css";

export default function DocumentCard({
  doc,
  isAdmin = false,
  onDownload,
  onPreview,
  onToggleHidden,
  onDelete,
}) {
  const category = doc.category?.toLowerCase() || "announcement";
  const programs = Array.isArray(doc.programs)
    ? doc.programs.join(", ")
    : doc.programs || "All";

  return (
    <div className={`doc-card card ${doc.hidden ? "doc-hidden" : ""}`}>
      {/* Hidden banner for admin */}
      {doc.hidden && isAdmin && (
        <div className="hidden-banner">Hidden from students</div>
      )}

      {/* Hover overlay — only if not admin */}
      {!isAdmin && (
        <div className="doc-hover-overlay" onClick={onPreview}>
          <OpenIcon size={28} />
          <span>Open Document</span>
        </div>
      )}

      <span className={`badge badge-${category} doc-badge`}>
        {doc.category || "Document"}
      </span>

      <h3 className="doc-title" onClick={!isAdmin ? onPreview : undefined}>
        {doc.title}
      </h3>

      <div className="doc-meta">
        <span>📅 {formatDate(doc.createdAt)}</span>
        {doc.year && <span>· {doc.year}</span>}
      </div>

      {doc.tags?.length > 0 && (
        <div className="doc-tags">
          {doc.tags.slice(0, 3).map((t) => (
            <span key={t} className="doc-tag">#{t}</span>
          ))}
        </div>
      )}

      <div className="doc-footer">
        <span className="prog-pill">{programs}</span>

        {isAdmin ? (
          /* Admin action buttons */
          <div className="doc-actions">
            <button
              className="dl-btn download-btn"
              title="Open document"
              onClick={(e) => { e.stopPropagation(); onPreview(); }}
            >
              <OpenIcon size={14} />
            </button>
            <button
              className={`dl-btn hide-btn ${doc.hidden ? "hidden-active" : ""}`}
              title={doc.hidden ? "Show to students" : "Hide from students"}
              onClick={(e) => { e.stopPropagation(); onToggleHidden(); }}
            >
              {doc.hidden ? <ShowIcon /> : <HideIcon />}
            </button>
            <button
              className="dl-btn delete-btn"
              title="Delete document"
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
            >
              <TrashIcon />
            </button>
          </div>
        ) : (
          /* Student action buttons */
          <div className="doc-actions">
            <button
              className="dl-btn download-btn"
              title="Download from Google Drive"
              onClick={(e) => { e.stopPropagation(); onDownload(); }}
            >
              <DownloadIcon />
            </button>
            <button
              className="dl-btn open-btn"
              title="Open document"
              onClick={(e) => { e.stopPropagation(); onPreview(); }}
            >
              <OpenIcon size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function formatDate(ts) {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
}

function DownloadIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" width="14" height="14"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;
}
function OpenIcon({ size = 14 }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" width={size} height={size}><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>;
}
function HideIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" width="14" height="14"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
}
function ShowIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" width="14" height="14"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;
}
function TrashIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" width="14" height="14"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>;
}

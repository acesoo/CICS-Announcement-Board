// src/pages/UploadPage.jsx
import React, { useState } from "react";
import { useAuth } from "../lib/AuthContext";
import { db } from "../lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import "./UploadPage.css";

const CATEGORIES = ["Announcement", "Form", "Guideline", "Memo"];
const PROGRAMS   = ["All", "CS", "IT", "IS", "EMC"];
const YEARS      = ["2026–2027", "2025-2026"];

/** Convert a Google Drive share link to usable URLs */
function parseDriveLink(url) {
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]+)/,
    /[?&]id=([a-zA-Z0-9_-]+)/,
    /\/document\/d\/([a-zA-Z0-9_-]+)/,
    /\/presentation\/d\/([a-zA-Z0-9_-]+)/,
    /\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return {
        fileId:      match[1],
        previewUrl:  `https://drive.google.com/file/d/${match[1]}/preview`,
        downloadUrl: `https://drive.google.com/uc?export=download&id=${match[1]}`,
        viewUrl:     `https://drive.google.com/file/d/${match[1]}/view`,
      };
    }
  }
  return null;
}

export default function UploadPage() {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle]                       = useState("");
  const [driveLink, setDriveLink]               = useState("");
  const [linkValid, setLinkValid]               = useState(null);
  const [parsedLink, setParsedLink]             = useState(null);
  const [category, setCategory]                 = useState("Announcement");
  const [year, setYear]                         = useState("2025–2026");
  const [selectedPrograms, setSelectedPrograms] = useState(["All"]);
  const [tags, setTags]                         = useState("");

  function handleLinkChange(val) {
    setDriveLink(val);
    setSuccess(false);
    if (!val.trim()) {
      setLinkValid(null);
      setParsedLink(null);
      return;
    }
    const parsed = parseDriveLink(val.trim());
    if (parsed) {
      setLinkValid(true);
      setParsedLink(parsed);
    } else {
      setLinkValid(false);
      setParsedLink(null);
    }
  }

  function toggleProgram(p) {
    setSelectedPrograms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  }

  async function handleSave() {
    if (!title.trim())  return setError("Please enter a document title.");
    if (!parsedLink)    return setError("Please enter a valid Google Drive link.");
    if (selectedPrograms.length === 0) return setError("Please select at least one program.");

    setSaving(true);
    setError("");
    setSuccess(false);

    try {
      await addDoc(collection(db, "documents"), {
        title:       title.trim(),
        category,
        year,
        programs:    selectedPrograms,
        tags:        tags.split(",").map((t) => t.trim()).filter(Boolean),
        fileUrl:     parsedLink.viewUrl,
        previewUrl:  parsedLink.previewUrl,
        downloadUrl: parsedLink.downloadUrl,
        driveFileId: parsedLink.fileId,
        driveLink:   driveLink.trim(),
        fileType:    "application/pdf",
        isImage:     false,
        downloads:   0,
        uploadedBy:  user.uid,
        createdAt:   serverTimestamp(),
      });

      setSuccess(true);
      setTitle("");
      setDriveLink("");
      setLinkValid(null);
      setParsedLink(null);
      setTags("");
      setSelectedPrograms(["All"]);
      setCategory("Announcement");
      setYear("2025–2026");

    } catch (err) {
      console.error("Save error:", err);
      setError("Failed to save: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="upload-page fade-in">
      <div className="dash-topbar">
        <div>
          <h1 className="page-title">Upload Document</h1>
          <p className="page-sub">Add a new document to the CICS repository via Google Drive</p>
        </div>
      </div>

      {/* How-to banner */}
      <div className="howto-banner">
        <div className="howto-icon">📂</div>
        <div>
          <div className="howto-title">How to get a Google Drive link</div>
          <ol className="howto-steps">
            <li>Upload your PDF to <strong>Google Drive</strong></li>
            <li>Right-click the file → <strong>Share</strong></li>
            <li>Set access to <strong>"Anyone with the link"</strong> → Viewer</li>
            <li>Click <strong>Copy link</strong> and paste it below</li>
          </ol>
        </div>
      </div>

      {success && <div className="success-msg">✓ Document saved successfully!</div>}
      {error   && <div className="error-msg">{error}</div>}

      {/* Form */}
      <div className="meta-form card">
        <div className="meta-grid">

          {/* Drive link */}
          <div className="form-group" style={{ gridColumn: "1 / -1" }}>
            <label className="form-label">Google Drive Link *</label>
            <div className="link-input-wrap">
              <input
                className={`form-input link-input ${
                  linkValid === true  ? "valid"   :
                  linkValid === false ? "invalid" : ""
                }`}
                type="url"
                placeholder="https://drive.google.com/file/d/..."
                value={driveLink}
                onChange={(e) => handleLinkChange(e.target.value)}
              />
              {linkValid === true  && <span className="link-status valid">✓ Valid link</span>}
              {linkValid === false && <span className="link-status invalid">✗ Not a valid Google Drive link</span>}
            </div>
            {parsedLink && (
              <a
                href={parsedLink.viewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="preview-link"
              >
                🔗 Preview file in Google Drive
              </a>
            )}
          </div>

          {/* Title */}
          <div className="form-group" style={{ gridColumn: "1 / -1" }}>
            <label className="form-label">Document Title *</label>
            <input
              className="form-input"
              type="text"
              placeholder="e.g. AY 2025–2026 Enrollment Schedule"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Category */}
          <div className="form-group">
            <label className="form-label">Category</label>
            <select className="form-input" value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>

          {/* Year — single option for now */}
          <div className="form-group">
            <label className="form-label">Academic Year</label>
            <select className="form-input" value={year} onChange={(e) => setYear(e.target.value)}>
              {YEARS.map((y) => <option key={y}>{y}</option>)}
            </select>
          </div>

          {/* Programs */}
          <div className="form-group" style={{ gridColumn: "1 / -1" }}>
            <label className="form-label">Programs *</label>
            <div className="tag-row">
              {PROGRAMS.map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`prog-tag-btn ${selectedPrograms.includes(p) ? "selected" : ""}`}
                  onClick={() => toggleProgram(p)}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="form-group" style={{ gridColumn: "1 / -1" }}>
            <label className="form-label">Tags / Keywords</label>
            <input
              className="form-input"
              type="text"
              placeholder="enrollment, schedule, 2025 (comma-separated)"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
          </div>
        </div>

        <button
          className="btn-primary"
          style={{ marginTop: "1.25rem" }}
          onClick={handleSave}
          disabled={saving || !parsedLink || !title.trim()}
        >
          {saving
            ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Saving…</>
            : "Save Document"}
        </button>
      </div>
    </div>
  );
}

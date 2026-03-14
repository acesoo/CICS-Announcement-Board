// src/pages/AdminDashboard.jsx
import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { db } from "../lib/firebase";
import {
  collection,
  getDocs,
  query,
  orderBy,
  where,
  Timestamp,
} from "firebase/firestore";
import "./AdminDashboard.css";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

const PERIODS = [
  { label: "Daily",   days: 1  },
  { label: "Weekly",  days: 7  },
  { label: "Monthly", days: 30 },
];

export default function AdminDashboard() {
  const [period, setPeriod] = useState("Weekly");
  const [customRange, setCustomRange] = useState([null, null]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    dailyLogins: 0,
    totalDownloads: 0,
    totalDocs: 0,
  });
  const [topDocs, setTopDocs] = useState([]);
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard(7);
  }, []);

  async function loadDashboard(days, startDate, endDate) {
    setLoading(true);
    try {
      const now = endDate || new Date();
      const from = startDate || new Date(now);
      if (!startDate) from.setDate(from.getDate() - days);
      const fromTs = Timestamp.fromDate(from);
      const toTs = Timestamp.fromDate(now);

      // 1. Total whitelisted users
      const usersSnap = await getDocs(collection(db, "whitelist"));
      const totalUsers = usersSnap.size;

      // 2. Logins in selected period
      const loginSnap = await getDocs(
        query(
          collection(db, "loginEvents"),
          where("timestamp", ">=", fromTs),
          where("timestamp", "<=", toTs)
        )
      );
      const loginEvents = loginSnap.docs.map((d) => d.data());

      // 3. Downloads in selected period
      const dlSnap = await getDocs(
        query(
          collection(db, "downloadEvents"),
          where("timestamp", ">=", fromTs),
          where("timestamp", "<=", toTs)
        )
      );
      const dlEvents = dlSnap.docs.map((d) => d.data());

      // 4. Top documents by downloads
      const docsSnap = await getDocs(
        query(collection(db, "documents"), orderBy("downloads", "desc"))
      );
      const allDocs = docsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setTopDocs(allDocs.slice(0, 5));

      setStats({
        totalUsers,
        dailyLogins: loginEvents.length,
        totalDownloads: dlEvents.length,
        totalDocs: allDocs.length,
      });

      // 5. Build chart — group by date
      buildChart(loginEvents, dlEvents, from, now);
    } catch (err) {
      console.error("Dashboard load error:", err);
    } finally {
      setLoading(false);
    }
  }

  function buildChart(loginEvents, dlEvents, from, to) {
    // Generate one label per day in range
    const days = [];
    const cursor = new Date(from);
    cursor.setHours(0, 0, 0, 0);
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);

    while (cursor <= end) {
      days.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }

    const labels = days.map((d) =>
      d.toLocaleDateString("en-PH", { month: "short", day: "numeric" })
    );

    // Count events per day
    const loginCounts = days.map((day) => {
      const nextDay = new Date(day);
      nextDay.setDate(nextDay.getDate() + 1);
      return loginEvents.filter((e) => {
        const t = e.timestamp?.toDate?.() || new Date(e.timestamp);
        return t >= day && t < nextDay;
      }).length;
    });

    const dlCounts = days.map((day) => {
      const nextDay = new Date(day);
      nextDay.setDate(nextDay.getDate() + 1);
      return dlEvents.filter((e) => {
        const t = e.timestamp?.toDate?.() || new Date(e.timestamp);
        return t >= day && t < nextDay;
      }).length;
    });

    setChartData({
      labels,
      datasets: [
        {
          label: "Logins",
          data: loginCounts,
          borderColor: "#0A3D8F",
          backgroundColor: "rgba(10,61,143,0.07)",
          tension: 0.4,
          fill: true,
          pointRadius: 3,
          borderWidth: 2,
        },
        {
          label: "Downloads",
          data: dlCounts,
          borderColor: "#D4A017",
          backgroundColor: "rgba(212,160,23,0.07)",
          tension: 0.4,
          fill: true,
          pointRadius: 3,
          borderWidth: 2,
        },
      ],
    });
  }

  function handlePeriodChange(label, days) {
    setPeriod(label);
    setShowDatePicker(label === "Custom");
    if (label !== "Custom") loadDashboard(days);
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { font: { size: 12, family: "DM Sans" }, boxWidth: 12 } },
    },
    scales: {
      x: { grid: { color: "rgba(0,0,0,0.04)" }, ticks: { font: { size: 11 } } },
      y: {
        grid: { color: "rgba(0,0,0,0.04)" },
        ticks: { font: { size: 11 }, stepSize: 1, precision: 0 },
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="admin-dash fade-in">
      <div className="dash-topbar">
        <div>
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-sub">CICS Document Repository · Analytics Overview</p>
        </div>
        <div className="period-tabs">
          {PERIODS.map((p) => (
            <button
              key={p.label}
              className={`tab-btn ${period === p.label ? "active" : ""}`}
              onClick={() => handlePeriodChange(p.label, p.days)}
            >
              {p.label}
            </button>
          ))}
          <button
            className={`tab-btn ${period === "Custom" ? "active" : ""}`}
            onClick={() => handlePeriodChange("Custom", 0)}
          >
            Custom
          </button>
        </div>
      </div>

      {showDatePicker && (
        <div className="datepicker-row">
          <DatePicker
            selectsRange
            startDate={customRange[0]}
            endDate={customRange[1]}
            onChange={(update) => {
              setCustomRange(update);
              if (update[0] && update[1]) {
                loadDashboard(0, update[0], update[1]);
              }
            }}
            placeholderText="Select date range"
            className="form-input"
            dateFormat="MMM d, yyyy"
          />
        </div>
      )}

      {/* Stat Cards */}
      <div className="stats-row">
        <StatCard
          icon={<UsersIcon />}
          value={loading ? "…" : stats.totalUsers}
          label="Whitelisted Users"
          change="Total registered accounts"
          accent="#E8F0FD"
          iconColor="#0A3D8F"
        />
        <StatCard
          icon={<ActivityIcon />}
          value={loading ? "…" : stats.dailyLogins}
          label="Logins This Period"
          change="Based on selected range"
          accent="#EAF3DE"
          iconColor="#3B6D11"
        />
        <StatCard
          icon={<DownloadIcon />}
          value={loading ? "…" : stats.totalDownloads}
          label="Downloads This Period"
          change="Based on selected range"
          accent="#FDF6E3"
          iconColor="#A87C10"
        />
        <StatCard
          icon={<DocIcon />}
          value={loading ? "…" : stats.totalDocs}
          label="Total Documents"
          change="In the repository"
          accent="#FAEEDA"
          iconColor="#854F0B"
        />
      </div>

      {/* Chart + Trending */}
      <div className="content-grid">
        <div className="chart-card card">
          <div className="card-header">
            <div>
              <div className="card-title">Login &amp; Download Activity</div>
              <div className="card-sub">
                {period === "Custom" && customRange[0] && customRange[1]
                  ? `${customRange[0].toLocaleDateString()} – ${customRange[1].toLocaleDateString()}`
                  : `Last ${period === "Daily" ? "1 day" : period === "Weekly" ? "7 days" : "30 days"}`}
              </div>
            </div>
          </div>
          <div style={{ height: 220 }}>
            {loading ? (
              <div className="loading-row"><span className="spinner" /> Loading chart…</div>
            ) : chartData ? (
              <Line data={chartData} options={chartOptions} />
            ) : null}
          </div>
        </div>

        <div className="trending-card card">
          <div className="card-header">
            <div className="card-title">Top Trending Documents</div>
          </div>
          <div className="trending-list">
            {loading ? (
              <div className="loading-row"><span className="spinner" /></div>
            ) : topDocs.length === 0 ? (
              <div className="empty-state" style={{ padding: "1.5rem 0" }}>
                No documents uploaded yet.
              </div>
            ) : (
              topDocs.map((doc, i) => (
                <div key={doc.id} className="trend-item">
                  <div className={`trend-rank ${i === 0 ? "gold" : ""}`}>{i + 1}</div>
                  <div className="trend-info">
                    <div className="trend-name">{doc.title}</div>
                    <div className="trend-meta">
                      {doc.category} · {Array.isArray(doc.programs) ? doc.programs.join(", ") : doc.programs}
                    </div>
                  </div>
                  <div className="trend-count">{doc.downloads || 0}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, value, label, change, changeType, accent, iconColor }) {
  return (
    <div className="stat-card card" style={{ "--accent": accent }}>
      <div className="stat-icon" style={{ background: accent }}>
        <span style={{ color: iconColor }}>{icon}</span>
      </div>
      <div className="stat-val">{value}</div>
      <div className="stat-label">{label}</div>
      <div className={`stat-change ${changeType === "warn" ? "warn" : "up"}`}>{change}</div>
    </div>
  );
}

function UsersIcon()    { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="17" height="17"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>; }
function ActivityIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="17" height="17"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>; }
function DownloadIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="17" height="17"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>; }
function DocIcon()      { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="17" height="17"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>; }

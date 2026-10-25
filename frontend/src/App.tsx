import React, { useState } from "react";
const Spinner: React.FC<{ size?: number }> = ({ size = 11 }) => (
  <span
    className="ss-spinner"
    style={{ color: "inherit", width: size, height: size }}
    aria-label="Loading"
  />
);
import { SqliScenario } from "./scenarios/SqliScenario";
import { XssScenario } from "./scenarios/XssScenario";
import { BolaScenario } from "./scenarios/BolaScenario";
import { ScenarioMode, callApi } from "./api/client";

type TabId = "sqli" | "xss" | "bola";

interface ScenarioTab {
  id: TabId;
  name: string;
  badge: string;
  desc: string;
}

const TABS: ScenarioTab[] = [
  {
    id: "sqli",
    name: "SQL Injection",
    badge: "SQLi",
    desc: "Authentication Bypass",
  },
  {
    id: "xss",
    name: "Cross-Site Scripting",
    badge: "XSS",
    desc: "Stored Script Execution",
  },
  {
    id: "bola",
    name: "Object Level Authorization",
    badge: "BOLA",
    desc: "Broken Authorization",
  },
];

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>("sqli");
  const [globalMode, setGlobalMode] = useState<ScenarioMode>("vulnerable");
  const [resetting, setResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const handleReset = async () => {
    setResetting(true);
    setResetMessage(null);
    try {
      const res = await callApi("vulnerable", "/reset", {});
      if (res.status === 200) {
        setResetMessage("Database reset successfully!");
      } else {
        setResetMessage(`Reset failed: ${res.error || "Unknown error"}`);
      }
    } catch (err: any) {
      setResetMessage(`Error: ${err?.message || "Failed to reset"}`);
    } finally {
      setResetting(false);
      setTimeout(() => setResetMessage(null), 3000);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        backgroundColor: "#121417",
        color: "#ECECEA",
      }}
    >
      {/* top navigation bar */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 24px",
          backgroundColor: "#1C1F24",
          borderBottom: "1px solid #22262B",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ display: "inline-block", verticalAlign: "middle" }}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            <span
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: "18px",
                fontWeight: 700,
                letterSpacing: "-0.02em",
                color: "#ECECEA",
              }}
            >
              Safe<span style={{ color: "#E8A33D" }}>Stack</span>
            </span>
            <span
              style={{
                fontSize: "11px",
                fontFamily: "'JetBrains Mono', monospace",
                backgroundColor: "#15171B",
                border: "1px solid #22262B",
                padding: "2px 6px",
                borderRadius: "4px",
                color: "#7C7C77",
              }}
            >
              Security Lab
            </span>
          </div>

          {/* scenario tabs */}
          <nav style={{ display: "flex", gap: "6px" }}>
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    backgroundColor: isActive ? "#15171B" : "transparent",
                    color: isActive ? "#ECECEA" : "#7C7C77",
                    border: `1px solid ${isActive ? "#E8A33D" : "transparent"}`,
                    borderRadius: "6px",
                    padding: "6px 12px",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: 600,
                    fontFamily: "'Space Grotesk', sans-serif",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.color = "#ECECEA";
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.color = "#7C7C77";
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "11px",
                      color: isActive ? "#E8A33D" : "#7C7C77",
                    }}
                  >
                    [{tab.badge}]
                  </span>
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* global controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {resetMessage && (
            <span
              style={{
                fontSize: "12px",
                color: "#5BBE88",
                fontFamily: "'Space Grotesk', sans-serif",
              }}
            >
              {resetMessage}
            </span>
          )}

          <button
            onClick={handleReset}
            disabled={resetting}
            title="Reset database to initial seed data"
            style={{
              backgroundColor: "#15171B",
              border: "1px solid #22262B",
              borderRadius: "6px",
              color: "#ECECEA",
              padding: "6px 12px",
              fontSize: "12px",
              fontWeight: 600,
              fontFamily: "'Space Grotesk', sans-serif",
              cursor: resetting ? "not-allowed" : "pointer",
              transition: "border-color 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#E8A33D")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#22262B")}
          >
            {resetting ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                <Spinner size={12} />
                <span>Resetting{"\u2026"}</span>
              </span>
            ) : (
              <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  style={{ display: "inline-block", verticalAlign: "middle" }}
                >
                  <polyline points="1 4 1 10 7 10" />
                  <path d="M3.51 15a9 9 0 1 0 .49-3.63" />
                </svg>
                <span>Reset DB</span>
              </span>
            )}
          </button>
        </div>
      </header>

      {/* main content area */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {activeTab === "sqli" && (
          <SqliScenario mode={globalMode} onModeChange={setGlobalMode} />
        )}
        {activeTab === "xss" && (
          <XssScenario mode={globalMode} onModeChange={setGlobalMode} />
        )}
        {activeTab === "bola" && (
          <BolaScenario mode={globalMode} onModeChange={setGlobalMode} />
        )}
      </main>
    </div>
  );
};

export default App;

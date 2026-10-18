import React, { useState, useEffect } from "react";
import { callApi, ScenarioMode, ResponseEnvelope } from "../api/client";
import { PayloadChip } from "../components/PayloadChip";
import { ResponsePanel } from "../components/ResponsePanel";

export interface SqliScenarioProps {
  mode?: ScenarioMode;
  onModeChange?: (mode: ScenarioMode) => void;
}

interface UserData {
  id?: number;
  username: string;
  role?: string;
}

export const SqliScenario: React.FC<SqliScenarioProps> = ({
  mode: propMode,
  onModeChange,
}) => {
  const [internalMode, setInternalMode] = useState<ScenarioMode>(propMode || "vulnerable");
  const currentMode = propMode ?? internalMode;

  const [username, setUsername] = useState("alice'--");
  const [password, setPassword] = useState("anything");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<ResponseEnvelope<UserData> | null>(null);

  useEffect(() => {
    if (propMode && propMode !== internalMode) {
      setInternalMode(propMode);
    }
  }, [propMode, internalMode]);

  const handleModeChange = (newMode: ScenarioMode) => {
    setInternalMode(newMode);
    if (onModeChange) {
      onModeChange(newMode);
    }
  };

  const handlePayloadClick = (payload: string) => {
    setUsername(payload);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    try {
      const res = await callApi<UserData>(currentMode, "/sqli/login", {
        username,
        password,
      });
      setResponse(res);
    } finally {
      setLoading(false);
    }
  };

  const loggedInUser = response?.data;

  return (
    <div
      style={{
        backgroundColor: "#121417",
        color: "#ECECEA",
        fontFamily: "'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif",
        minHeight: "100%",
        padding: "24px",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        gap: "24px",
      }}
    >
      {/* header and mode selector */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "16px",
          borderBottom: "1px solid #22262B",
          paddingBottom: "18px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <h1
              style={{
                margin: 0,
                fontSize: "20px",
                fontWeight: 700,
                color: "#ECECEA",
                letterSpacing: "-0.01em",
              }}
            >
              SQL Injection (SQLi)
            </h1>
            <span
              style={{
                fontSize: "12px",
                fontFamily: "'JetBrains Mono', monospace",
                padding: "2px 8px",
                borderRadius: "4px",
                backgroundColor: currentMode === "vulnerable" ? "#C9402B22" : "#2F7A4F33",
                color: currentMode === "vulnerable" ? "#C9402B" : "#5BBE88",
                border: `1px solid ${
                  currentMode === "vulnerable" ? "#C9402B44" : "#2F7A4F66"
                }`,
                fontWeight: 600,
                textTransform: "uppercase",
              }}
            >
              {currentMode}
            </span>
          </div>
          <p
            style={{
              margin: "6px 0 0 0",
              fontSize: "13px",
              color: "#7C7C77",
              lineHeight: "1.4",
            }}
          >
            POST /api/{currentMode}/sqli/login — Demonstrates SQL string concatenation vs. parameterized queries.
          </p>
        </div>

        {/* mode toggle buttons */}
        <div
          style={{
            display: "inline-flex",
            backgroundColor: "#1C1F24",
            border: "1px solid #22262B",
            borderRadius: "8px",
            padding: "3px",
            gap: "4px",
          }}
        >
          <button
            type="button"
            onClick={() => handleModeChange("vulnerable")}
            style={{
              padding: "6px 14px",
              borderRadius: "6px",
              border: "none",
              cursor: "pointer",
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: "12px",
              fontWeight: 600,
              backgroundColor: currentMode === "vulnerable" ? "#C9402B" : "transparent",
              color: currentMode === "vulnerable" ? "#ECECEA" : "#7C7C77",
              transition: "all 0.15s ease",
            }}
          >
            Vulnerable
          </button>
          <button
            type="button"
            onClick={() => handleModeChange("secure")}
            style={{
              padding: "6px 14px",
              borderRadius: "6px",
              border: "none",
              cursor: "pointer",
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: "12px",
              fontWeight: 600,
              backgroundColor: currentMode === "secure" ? "#2F7A4F" : "transparent",
              color: currentMode === "secure" ? "#ECECEA" : "#7C7C77",
              transition: "all 0.15s ease",
            }}
          >
            Secure
          </button>
        </div>
      </div>

      {/* main content layout */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
          gap: "20px",
        }}
      >
        {/* input form and quick payloads */}
        <div
          style={{
            backgroundColor: "#15171B",
            border: "1px solid #22262B",
            borderRadius: "8px",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "18px",
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: "15px",
                fontWeight: 600,
                color: "#ECECEA",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              Authentication Bypass Login
            </h2>
            <span style={{ fontSize: "12px", color: "#7C7C77" }}>
              Submit credentials or injection strings to bypass authentication.
            </span>
          </div>

          {/* quick payloads */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <span
              style={{
                fontSize: "11px",
                fontFamily: "'Space Grotesk', sans-serif",
                color: "#7C7C77",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Quick Payloads (Click to insert):
            </span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              <PayloadChip
                payload="alice'--"
                label="Comment Out"
                onClick={handlePayloadClick}
              />
              <PayloadChip
                payload="' OR 1=1 --"
                label="Always True"
                onClick={handlePayloadClick}
              />
            </div>
          </div>

          {/* form */}
          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: "14px" }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label
                htmlFor="sqli-username-input"
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#ECECEA",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                Username
              </label>
              <input
                id="sqli-username-input"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="alice or injection string"
                required
                style={{
                  backgroundColor: "#121417",
                  border: "1px solid #22262B",
                  borderRadius: "6px",
                  color: "#ECECEA",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "13px",
                  padding: "10px 12px",
                  outline: "none",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#E8A33D")}
                onBlur={(e) => (e.target.style.borderColor = "#22262B")}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label
                htmlFor="sqli-password-input"
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#ECECEA",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                Password
              </label>
              <input
                id="sqli-password-input"
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                style={{
                  backgroundColor: "#121417",
                  border: "1px solid #22262B",
                  borderRadius: "6px",
                  color: "#ECECEA",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "13px",
                  padding: "10px 12px",
                  outline: "none",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#E8A33D")}
                onBlur={(e) => (e.target.style.borderColor = "#22262B")}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                backgroundColor: currentMode === "vulnerable" ? "#E8A33D" : "#5BBE88",
                color: "#121417",
                border: "none",
                borderRadius: "6px",
                padding: "10px 16px",
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: "13px",
                fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "Authenticating..." : `Submit via callApi (${currentMode})`}
            </button>
          </form>
        </div>

        {/* auth status section */}
        <div
          style={{
            backgroundColor: "#15171B",
            border: "1px solid #22262B",
            borderRadius: "8px",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
          }}
        >
          <div
            style={{
              borderBottom: "1px solid #22262B",
              paddingBottom: "10px",
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: "15px",
                fontWeight: 600,
                color: "#ECECEA",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              Authentication Result
            </h2>
            <span style={{ fontSize: "12px", color: "#7C7C77" }}>
              User session resolution from query execution.
            </span>
          </div>

          {!response ? (
            <div
              style={{
                flex: 1,
                minHeight: "180px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#121417",
                border: "1px dashed #22262B",
                borderRadius: "6px",
                color: "#7C7C77",
                fontSize: "13px",
                padding: "20px",
                textAlign: "center",
              }}
            >
              <span>No login request submitted yet.</span>
            </div>
          ) : loggedInUser ? (
            <div
              style={{
                backgroundColor: "#121417",
                border: "1px solid #2F7A4F",
                borderRadius: "6px",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <div
                style={{
                  color: "#5BBE88",
                  fontSize: "14px",
                  fontWeight: 600,
                }}
              >
                ✓ Authentication Succeeded
              </div>
              <div style={{ fontSize: "13px", color: "#ECECEA" }}>
                Logged in as: <strong>{loggedInUser.username}</strong> (ID: {loggedInUser.id})
              </div>
              {loggedInUser.role && (
                <div style={{ fontSize: "12px", color: "#7C7C77" }}>
                  Role: {loggedInUser.role}
                </div>
              )}
            </div>
          ) : (
            <div
              style={{
                backgroundColor: "#121417",
                border: "1px solid #C9402B",
                borderRadius: "6px",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <div
                style={{
                  color: "#C9402B",
                  fontSize: "14px",
                  fontWeight: 600,
                }}
              >
                ✗ Authentication Failed
              </div>
              <div style={{ fontSize: "12px", color: "#7C7C77" }}>
                {response.error || "No matching user record found."}
              </div>
            </div>
          )}
        </div>
      </div>

      <ResponsePanel response={response} loading={loading} />
    </div>
  );
};

export default SqliScenario;

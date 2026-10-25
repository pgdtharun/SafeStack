import React, { useState, useEffect } from "react";
const Spinner: React.FC = () => (
  <span className="ss-spinner" style={{ color: "inherit" }} aria-label="Loading" />
);
import { callApi, ScenarioMode, ResponseEnvelope } from "../api/client";
import { PayloadChip } from "../components/PayloadChip";
import { ResponsePanel } from "../components/ResponsePanel";

export interface XssScenarioProps {
  mode?: ScenarioMode;
  onModeChange?: (mode: ScenarioMode) => void;
}

interface CommentData {
  id?: number;
  author: string;
  body: string;
}

export const XssScenario: React.FC<XssScenarioProps> = ({
  mode: propMode,
  onModeChange,
}) => {
  const [internalMode, setInternalMode] = useState<ScenarioMode>(propMode || "vulnerable");
  const currentMode = propMode ?? internalMode;

  const [author, setAuthor] = useState("eve");
  const [body, setBody] = useState("<script>alert('XSS')</script>");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<ResponseEnvelope<CommentData> | null>(null);

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
    setBody(payload);
    if (!author.trim()) {
      setAuthor("attacker");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    try {
      const res = await callApi<CommentData>(currentMode, "/xss/comment", {
        author,
        body,
      });
      setResponse(res);
    } finally {
      setLoading(false);
    }
  };

  // safe sandboxed html for the frame
  const getIframeSrcDoc = (content: string, authorName?: string) => {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Sandbox Frame</title>
  <style>
    body {
      margin: 0;
      padding: 14px;
      font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif;
      color: #ECECEA;
      background-color: #121417;
      word-break: break-word;
      line-height: 1.5;
    }
    .author-badge {
      display: inline-block;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #E8A33D;
      margin-bottom: 8px;
    }
    .comment-content {
      font-size: 14px;
    }
  </style>
</head>
<body>
  ${authorName ? `<div class="author-badge">Author: ${authorName}</div>` : ""}
  <div class="comment-content">${content}</div>
</body>
</html>`;
  };

  const returnedData = response?.data;
  const isVulnerable = (response?.mode || currentMode) === "vulnerable";

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
              Cross-Site Scripting (XSS)
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
            POST /api/{currentMode}/xss/comment {"\u2014"} Demonstrates unescaped stored execution vs. HTML entity escaping.
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
              backgroundColor:
                currentMode === "vulnerable" ? "#C9402B" : "transparent",
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
              backgroundColor:
                currentMode === "secure" ? "#2F7A4F" : "transparent",
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
          gridTemplateColumns: "repeat(auto-fit, minmax(min(360px, 100%), 1fr))",
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
              Post a Comment
            </h2>
            <span
              style={{
                fontSize: "12px",
                color: "#7C7C77",
              }}
            >
              Submit content to test client-side script execution.
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
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "8px",
              }}
            >
              <PayloadChip
                payload="<script>alert('XSS')</script>"
                label="Script"
                onClick={handlePayloadClick}
              />
              <PayloadChip
                payload="<img src=x onerror=alert(1)>"
                label="Img OnError"
                onClick={handlePayloadClick}
              />
            </div>
          </div>

          {/* submission form */}
          <form
            onSubmit={handleSubmit}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}
          >
            {/* author input */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label
                htmlFor="xss-author-input"
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#ECECEA",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                Author
              </label>
              <input
                id="xss-author-input"
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="e.g. eve or alice"
                required
                style={{
                  backgroundColor: "#121417",
                  border: "1px solid #22262B",
                  borderRadius: "6px",
                  color: "#ECECEA",
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: "13px",
                  padding: "10px 12px",
                  outline: "none",
                  transition: "border-color 0.15s ease",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#E8A33D")}
                onBlur={(e) => (e.target.style.borderColor = "#22262B")}
              />
            </div>

            {/* comment text area */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label
                htmlFor="xss-body-input"
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#ECECEA",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                Comment Body
              </label>
              <textarea
                id="xss-body-input"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={5}
                placeholder="Enter comment text or HTML injection payload..."
                required
                style={{
                  backgroundColor: "#121417",
                  border: "1px solid #22262B",
                  borderRadius: "6px",
                  color: "#ECECEA",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "12px",
                  padding: "10px 12px",
                  outline: "none",
                  resize: "vertical",
                  lineHeight: "1.5",
                  transition: "border-color 0.15s ease",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#E8A33D")}
                onBlur={(e) => (e.target.style.borderColor = "#22262B")}
              />
            </div>

            {/* submit button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
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
                transition: "opacity 0.15s ease, transform 0.1s ease",
              }}
              onMouseDown={(e) => {
                if (!loading) e.currentTarget.style.transform = "scale(0.99)";
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              {loading ? <><Spinner />&nbsp;Submitting{"\u2026"}</> : `Submit via callApi (${currentMode})`}
            </button>
          </form>
        </div>

        {/* rendered response section */}
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
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: "1px solid #22262B",
              paddingBottom: "10px",
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
                Rendered Comment Output
              </h2>
              <span style={{ fontSize: "12px", color: "#7C7C77" }}>
                {isVulnerable
                  ? "Sandboxed Iframe (sandbox='allow-scripts')"
                  : "Escaped Plain Text (Safe)"}
              </span>
            </div>

            {returnedData && (
              <span
                style={{
                  fontSize: "11px",
                  fontFamily: "'JetBrains Mono', monospace",
                  padding: "2px 6px",
                  borderRadius: "4px",
                  backgroundColor: "#1C1F24",
                  color: "#ECECEA",
                  border: "1px solid #22262B",
                }}
              >
                ID #{returnedData.id ?? "?"}
              </span>
            )}
          </div>

          {/* output area */}
          {!returnedData ? (
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
                gap: "8px",
              }}
            >
              <span>No comment submitted yet.</span>
              <span style={{ fontSize: "11px" }}>
                Click a payload above and press Submit to observe rendering differences.
              </span>
            </div>
          ) : isVulnerable ? (
            /* vulnerable mode sandboxed iframe */
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: "11px",
                  color: "#C9402B",
                  backgroundColor: "#C9402B18",
                  padding: "6px 10px",
                  borderRadius: "4px",
                  border: "1px solid #C9402B33",
                }}
              >
                <span>{"\u26A0\uFE0F"} Script execution is active inside this isolated sandbox.</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  sandbox=&quot;allow-scripts&quot;
                </span>
              </div>
              <iframe
                key={`${returnedData.id}-${returnedData.body}`}
                title="XSS Execution Sandbox"
                sandbox="allow-scripts"
                srcDoc={getIframeSrcDoc(returnedData.body, returnedData.author)}
                style={{
                  width: "100%",
                  height: "170px",
                  backgroundColor: "#121417",
                  border: "1px solid #22262B",
                  borderRadius: "6px",
                  color: "#ECECEA",
                }}
              />
            </div>
          ) : (
            /* secure mode plain text */
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: "11px",
                  color: "#5BBE88",
                  backgroundColor: "#2F7A4F22",
                  padding: "6px 10px",
                  borderRadius: "4px",
                  border: "1px solid #2F7A4F44",
                }}
              >
                <span>{"\uD83D\uDEE1\uFE0F"} Body was HTML-escaped by the backend and renders as plain text.</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  textNode (safe)
                </span>
              </div>
              <div
                style={{
                  backgroundColor: "#121417",
                  border: "1px solid #22262B",
                  borderRadius: "6px",
                  padding: "14px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                  minHeight: "150px",
                }}
              >
                <div
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    color: "#E8A33D",
                  }}
                >
                  Author: {returnedData.author}
                </div>
                <div
                  style={{
                    fontSize: "13px",
                    fontFamily: "'JetBrains Mono', monospace",
                    color: "#ECECEA",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {returnedData.body}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* response panel */}
      <ResponsePanel response={response} loading={loading} />
    </div>
  );
};

export default XssScenario;

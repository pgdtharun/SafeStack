import React, { useState } from "react";
import { ResponseEnvelope } from "../api/client";

export interface ResponsePanelProps {
  response: ResponseEnvelope | null;
  loading?: boolean;
}

export const ResponsePanel: React.FC<ResponsePanelProps> = ({
  response,
  loading = false,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!response) return;
    navigator.clipboard.writeText(JSON.stringify(response, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const isSuccess = response && response.status >= 200 && response.status < 300;
  const statusColor = !response
    ? "#7C7C77"
    : isSuccess
    ? "#5BBE88"
    : "#C9402B";

  return (
    <div
      style={{
        backgroundColor: "#15171B",
        border: "1px solid #22262B",
        borderRadius: "8px",
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
      }}
    >
      {/* header bar showing status and mode */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "8px",
          borderBottom: "1px solid #22262B",
          paddingBottom: "10px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: "13px",
              fontWeight: 600,
              color: "#ECECEA",
              letterSpacing: "0.03em",
              textTransform: "uppercase",
            }}
          >
            Response Panel
          </span>

          {loading && (
            <span
              style={{
                fontSize: "11px",
                color: "#E8A33D",
                fontFamily: "'Space Grotesk', sans-serif",
              }}
            >
              Sending request...
            </span>
          )}

          {response && !loading && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                fontSize: "12px",
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 600,
                color: statusColor,
                backgroundColor: "#1C1F24",
                padding: "2px 8px",
                borderRadius: "4px",
                border: `1px solid ${statusColor}33`,
              }}
            >
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  backgroundColor: statusColor,
                }}
              />
              HTTP {response.status || "ERR"}
            </span>
          )}

          {response?.mode && (
            <span
              style={{
                fontSize: "11px",
                textTransform: "uppercase",
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 600,
                padding: "2px 8px",
                borderRadius: "4px",
                backgroundColor:
                  response.mode === "vulnerable" ? "#C9402B22" : "#2F7A4F33",
                color: response.mode === "vulnerable" ? "#C9402B" : "#5BBE88",
                border: `1px solid ${
                  response.mode === "vulnerable" ? "#C9402B44" : "#2F7A4F66"
                }`,
              }}
            >
              {response.mode}
            </span>
          )}
        </div>

        {response && (
          <button
            type="button"
            onClick={handleCopy}
            style={{
              background: "transparent",
              border: "1px solid #22262B",
              borderRadius: "4px",
              color: copied ? "#5BBE88" : "#7C7C77",
              cursor: "pointer",
              fontSize: "11px",
              fontFamily: "'Space Grotesk', sans-serif",
              padding: "3px 8px",
              transition: "all 0.15s ease",
            }}
          >
            {copied ? "Copied!" : "Copy JSON"}
          </button>
        )}
      </div>

      {/* executed query display */}
      {response?.executed_query && (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <span
            style={{
              fontSize: "11px",
              fontFamily: "'Space Grotesk', sans-serif",
              color: "#7C7C77",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Executed Query
          </span>
          <div
            style={{
              backgroundColor: "#121417",
              border: "1px solid #22262B",
              borderRadius: "6px",
              padding: "10px 12px",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "12px",
              color: "#E8A33D",
              overflowX: "auto",
              whiteSpace: "pre-wrap",
              wordBreak: "break-all",
            }}
          >
            <code>{response.executed_query}</code>
          </div>
        </div>
      )}

      {/* raw response text */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <span
          style={{
            fontSize: "11px",
            fontFamily: "'Space Grotesk', sans-serif",
            color: "#7C7C77",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          Raw Response
        </span>
        <pre
          style={{
            margin: 0,
            backgroundColor: "#121417",
            border: "1px solid #22262B",
            borderRadius: "6px",
            padding: "12px",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "12px",
            lineHeight: "1.5",
            color: response ? "#ECECEA" : "#7C7C77",
            overflowX: "auto",
            maxHeight: "260px",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {response
            ? JSON.stringify(response, null, 2)
            : "Waiting for request submission"}
        </pre>
      </div>
    </div>
  );
};

export default ResponsePanel;

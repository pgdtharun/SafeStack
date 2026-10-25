import React, { useState } from "react";
import { ResponseEnvelope } from "../api/client";

export interface ResponsePanelProps {
  response: ResponseEnvelope | null;
  loading?: boolean;
}

// -- tiny inline spinner (reuses the CSS class from index.css) --------------
const Spinner: React.FC<{ color?: string }> = ({ color = "#E8A33D" }) => (
  <span className="ss-spinner" style={{ color }} aria-label="Loading" />
);

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

  // -- status classification ----------------------------------------------
  const isNetworkError = response?.status === 0;
  const isSuccess =
    response && !isNetworkError && response.status >= 200 && response.status < 300;
  const isClientError =
    response && !isNetworkError && response.status >= 400 && response.status < 500;
  const isServerError =
    response && !isNetworkError && response.status >= 500;

  const statusColor = !response
    ? "#7C7C77"
    : isNetworkError
    ? "#C9402B"
    : isSuccess
    ? "#5BBE88"
    : "#C9402B";

  const borderColor = loading
    ? "#E8A33D44"
    : isNetworkError || isClientError || isServerError
    ? "#C9402B44"
    : isSuccess
    ? "#2F7A4F44"
    : "#22262B";

  return (
    <div
      style={{
        backgroundColor: "#15171B",
        border: `1px solid ${borderColor}`,
        borderRadius: "8px",
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
        transition: "border-color 0.2s ease",
      }}
    >
      {/* -- header bar ---------------------------------------------------- */}
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
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
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

          {/* loading indicator */}
          {loading && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "11px",
                color: "#E8A33D",
                fontFamily: "'Space Grotesk', sans-serif",
              }}
            >
              <Spinner />
              Sending{"\u2026"}
            </span>
          )}

          {/* HTTP status badge */}
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
                  flexShrink: 0,
                }}
              />
              {isNetworkError ? "Network Error" : `HTTP ${response.status}`}
            </span>
          )}

          {/* mode badge */}
          {response?.mode && !isNetworkError && (
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
              flexShrink: 0,
            }}
          >
            {copied ? "Copied!" : "Copy JSON"}
          </button>
        )}
      </div>

      {/* -- network / connection error banner ----------------------------- */}
      {isNetworkError && (
        <div
          role="alert"
          style={{
            backgroundColor: "#C9402B18",
            border: "1px solid #C9402B44",
            borderRadius: "6px",
            padding: "12px 14px",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}
        >
          <span
            style={{
              color: "#C9402B",
              fontWeight: 700,
              fontSize: "13px",
              fontFamily: "'Space Grotesk', sans-serif",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            {"\u2715"} Network Error {"\u2014"} Could Not Reach Backend
          </span>
          <span
            style={{
              color: "#ECECEA",
              fontSize: "12px",
              fontFamily: "'JetBrains Mono', monospace",
              wordBreak: "break-word",
            }}
          >
            {response?.error ?? "Failed to connect. Is the backend running on port 8001?"}
          </span>
        </div>
      )}

      {/* -- non-2xx HTTP error banner (401, 403, 404, 400...) ------------- */}
      {(isClientError || isServerError) && (
        <div
          role="alert"
          style={{
            backgroundColor: "#C9402B18",
            border: "1px solid #C9402B44",
            borderRadius: "6px",
            padding: "12px 14px",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}
        >
          <span
            style={{
              color: "#C9402B",
              fontWeight: 700,
              fontSize: "13px",
              fontFamily: "'Space Grotesk', sans-serif",
            }}
          >
            {response!.status === 401 && "\u2715 401 Unauthorized \u2014 Authentication Failed"}
            {response!.status === 403 && "\u2715 403 Forbidden \u2014 Access Denied"}
            {response!.status === 404 && "\u2715 404 Not Found"}
            {response!.status === 400 && "\u2715 400 Bad Request"}
            {response!.status === 422 && "\u2715 422 Unprocessable \u2014 Check your input"}
            {![400, 401, 403, 404, 422].includes(response!.status) &&
              `\u2715 HTTP ${response!.status} Error`}
          </span>
          {response?.error && (
            <span
              style={{
                color: "#ECECEA",
                fontSize: "12px",
                fontFamily: "'JetBrains Mono', monospace",
                wordBreak: "break-word",
              }}
            >
              {response.error}
            </span>
          )}
        </div>
      )}

      {/* -- executed query ------------------------------------------------- */}
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

      {/* -- raw response JSON ---------------------------------------------- */}
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
          {loading ? "Waiting for response\u2026" : "Raw Response"}
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
            color: loading
              ? "#7C7C77"
              : isNetworkError || isClientError || isServerError
              ? "#C9402B"
              : response
              ? "#ECECEA"
              : "#7C7C77",
            overflowX: "auto",
            maxHeight: "260px",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            opacity: loading ? 0.5 : 1,
            transition: "opacity 0.2s ease",
          }}
        >
          {loading
            ? "\u2014 awaiting server \u2014"
            : response
            ? JSON.stringify(response, null, 2)
            : "Waiting for request submission"}
        </pre>
      </div>
    </div>
  );
};

export default ResponsePanel;

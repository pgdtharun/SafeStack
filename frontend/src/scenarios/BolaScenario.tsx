import React, { useState, useEffect } from "react";
import { callApi, ScenarioMode, ResponseEnvelope } from "../api/client";
import { PayloadChip } from "../components/PayloadChip";
import { ResponsePanel } from "../components/ResponsePanel";

export interface BolaScenarioProps {
  mode?: ScenarioMode;
  onModeChange?: (mode: ScenarioMode) => void;
}

interface InvoiceData {
  id: number;
  owner_id: number;
  amount: number;
  description: string;
}

const USERS = [
  { username: "alice", id: 1, label: "Alice (User #1)" },
  { username: "bob", id: 2, label: "Bob (User #2)" },
];

export const BolaScenario: React.FC<BolaScenarioProps> = ({
  mode: propMode,
  onModeChange,
}) => {
  const [internalMode, setInternalMode] = useState<ScenarioMode>(propMode || "vulnerable");
  const currentMode = propMode ?? internalMode;

  const [asUser, setAsUser] = useState("alice");
  const [invoiceId, setInvoiceId] = useState("102");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<ResponseEnvelope<InvoiceData> | null>(null);

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

  const handleFetch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (loading || !invoiceId.trim()) return;

    setLoading(true);
    try {
      // fetch invoice using get request
      const res = await callApi<InvoiceData>(
        currentMode,
        `/bola/invoice?id=${encodeURIComponent(invoiceId.trim())}&as_user=${encodeURIComponent(
          asUser
        )}`,
        null
      );
      setResponse(res);
    } finally {
      setLoading(false);
    }
  };

  const currentUserObj = USERS.find((u) => u.username === asUser);
  const currentUserId = currentUserObj ? currentUserObj.id : null;

  const invoice = response?.data;
  const isOwner = invoice && currentUserId !== null && invoice.owner_id === currentUserId;
  const isBOLA = invoice && currentUserId !== null && invoice.owner_id !== currentUserId;
  const isForbidden = response && response.status === 403;

  const getOwnerName = (ownerId: number) => {
    const user = USERS.find((u) => u.id === ownerId);
    return user ? user.username : `User #${ownerId}`;
  };

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
              Broken Object Level Authorization (BOLA)
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
            GET /api/{currentMode}/bola/invoice?id=&amp;as_user= — Demonstrates missing object authorization vs. SQL JOIN ownership enforcement.
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
        {/* input controls section */}
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
              Fetch Invoice
            </h2>
            <span style={{ fontSize: "12px", color: "#7C7C77" }}>
              Simulate requesting invoice data as an authenticated user.
            </span>
          </div>

          {/* quick presets */}
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
              Presets:
            </span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              <PayloadChip
                payload="101"
                label="Alice's Invoice"
                title="Invoice 101 belongs to Alice ($500)"
                onClick={(val) => setInvoiceId(val)}
              />
              <PayloadChip
                payload="102"
                label="Bob's Invoice"
                title="Invoice 102 belongs to Bob ($750) - BOLA Exploit Target"
                onClick={(val) => setInvoiceId(val)}
              />
            </div>
          </div>

          {/* form */}
          <form
            onSubmit={handleFetch}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}
          >
            {/* user selector dropdown */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label
                htmlFor="bola-user-select"
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#ECECEA",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                Logged in as (as_user)
              </label>
              <select
                id="bola-user-select"
                value={asUser}
                onChange={(e) => setAsUser(e.target.value)}
                style={{
                  backgroundColor: "#121417",
                  border: "1px solid #22262B",
                  borderRadius: "6px",
                  color: "#ECECEA",
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: "13px",
                  padding: "10px 12px",
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                {USERS.map((user) => (
                  <option key={user.username} value={user.username}>
                    {user.label}
                  </option>
                ))}
              </select>
            </div>

            {/* invoice id input */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label
                htmlFor="bola-invoice-id"
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#ECECEA",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                Invoice ID
              </label>
              <input
                id="bola-invoice-id"
                type="number"
                value={invoiceId}
                onChange={(e) => setInvoiceId(e.target.value)}
                placeholder="e.g. 101 or 102"
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
                  transition: "border-color 0.15s ease",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#E8A33D")}
                onBlur={(e) => (e.target.style.borderColor = "#22262B")}
              />
            </div>

            {/* fetch button */}
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
              {loading ? "Fetching..." : `Fetch Invoice (${currentMode})`}
            </button>
          </form>
        </div>

        {/* invoice viewer section */}
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
                Invoice Inspection
              </h2>
              <span style={{ fontSize: "12px", color: "#7C7C77" }}>
                Target: #{invoiceId} &bull; Requester: {asUser}
              </span>
            </div>

            {/* visual ownership tag */}
            {isBOLA && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "11px",
                  fontWeight: 700,
                  padding: "3px 8px",
                  borderRadius: "4px",
                  backgroundColor: "#C9402B",
                  color: "#FFFFFF",
                  fontFamily: "'Space Grotesk', sans-serif",
                  letterSpacing: "0.04em",
                }}
              >
                ⚠ NOT YOUR INVOICE
              </span>
            )}
            {isOwner && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "11px",
                  fontWeight: 700,
                  padding: "3px 8px",
                  borderRadius: "4px",
                  backgroundColor: "#2F7A4F",
                  color: "#5BBE88",
                  fontFamily: "'Space Grotesk', sans-serif",
                  border: "1px solid #5BBE8844",
                }}
              >
                ✓ YOUR INVOICE
              </span>
            )}
          </div>

          {/* results display */}
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
                gap: "8px",
              }}
            >
              <span>No invoice requested yet.</span>
              <span style={{ fontSize: "11px" }}>
                Try fetching Bob&#39;s invoice (#102) as Alice in Vulnerable vs. Secure mode.
              </span>
            </div>
          ) : isForbidden ? (
            /* secure mode blocked state */
            <div
              style={{
                backgroundColor: "#121417",
                border: "1px solid #C9402B44",
                borderRadius: "6px",
                padding: "18px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  color: "#C9402B",
                  fontSize: "14px",
                  fontWeight: 700,
                }}
              >
                <span>🛡️ Access Blocked (HTTP 403 Forbidden)</span>
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: "13px",
                  color: "#ECECEA",
                  lineHeight: "1.5",
                }}
              >
                The secure endpoint verified object ownership inside the SQL query:
              </p>
              <div
                style={{
                  backgroundColor: "#15171B",
                  border: "1px solid #22262B",
                  borderRadius: "4px",
                  padding: "8px 10px",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "11px",
                  color: "#E8A33D",
                  whiteSpace: "pre-wrap",
                }}
              >
                JOIN users u ON i.owner_id = u.id WHERE i.id = ? AND u.username = ?
              </div>
              <span style={{ fontSize: "12px", color: "#7C7C77" }}>
                User <strong>{asUser}</strong> is not the owner of invoice #{invoiceId}. Access was correctly rejected.
              </span>
            </div>
          ) : invoice ? (
            /* invoice found state */
            <div
              style={{
                backgroundColor: "#121417",
                border: `1px solid ${isBOLA ? "#C9402B" : "#22262B"}`,
                borderRadius: "6px",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              {/* alert banner */}
              {isBOLA && (
                <div
                  style={{
                    backgroundColor: "#C9402B18",
                    border: "1px solid #C9402B44",
                    borderRadius: "4px",
                    padding: "10px 12px",
                    color: "#ECECEA",
                    fontSize: "12px",
                    lineHeight: "1.4",
                  }}
                >
                  <div
                    style={{
                      color: "#C9402B",
                      fontWeight: 700,
                      marginBottom: "4px",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <span>⚠ BOLA Exploit Succeeded!</span>
                  </div>
                  <span>
                    You are logged in as <strong>{asUser}</strong> (User #{currentUserId}), but
                    the server returned an invoice belonging to{" "}
                    <strong>{getOwnerName(invoice.owner_id)}</strong> (User #{invoice.owner_id}).
                    The vulnerable endpoint failed to check authorization!
                  </span>
                </div>
              )}

              {/* invoice data card */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "10px",
                  fontFamily: "'Space Grotesk', sans-serif",
                }}
              >
                <div
                  style={{
                    backgroundColor: "#15171B",
                    padding: "10px",
                    borderRadius: "4px",
                    border: "1px solid #22262B",
                  }}
                >
                  <span
                    style={{
                      fontSize: "11px",
                      color: "#7C7C77",
                      textTransform: "uppercase",
                      display: "block",
                      marginBottom: "2px",
                    }}
                  >
                    Invoice Number
                  </span>
                  <span
                    style={{
                      fontSize: "14px",
                      fontFamily: "'JetBrains Mono', monospace",
                      fontWeight: 700,
                      color: "#ECECEA",
                    }}
                  >
                    #{invoice.id}
                  </span>
                </div>

                <div
                  style={{
                    backgroundColor: "#15171B",
                    padding: "10px",
                    borderRadius: "4px",
                    border: "1px solid #22262B",
                  }}
                >
                  <span
                    style={{
                      fontSize: "11px",
                      color: "#7C7C77",
                      textTransform: "uppercase",
                      display: "block",
                      marginBottom: "2px",
                    }}
                  >
                    Amount
                  </span>
                  <span
                    style={{
                      fontSize: "14px",
                      fontFamily: "'JetBrains Mono', monospace",
                      fontWeight: 700,
                      color: "#5BBE88",
                    }}
                  >
                    ${invoice.amount.toFixed(2)}
                  </span>
                </div>

                <div
                  style={{
                    backgroundColor: "#15171B",
                    padding: "10px",
                    borderRadius: "4px",
                    border: "1px solid #22262B",
                  }}
                >
                  <span
                    style={{
                      fontSize: "11px",
                      color: "#7C7C77",
                      textTransform: "uppercase",
                      display: "block",
                      marginBottom: "2px",
                    }}
                  >
                    Owner
                  </span>
                  <span
                    style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color: isBOLA ? "#C9402B" : "#ECECEA",
                    }}
                  >
                    {getOwnerName(invoice.owner_id)} (ID #{invoice.owner_id})
                  </span>
                </div>

                <div
                  style={{
                    backgroundColor: "#15171B",
                    padding: "10px",
                    borderRadius: "4px",
                    border: "1px solid #22262B",
                  }}
                >
                  <span
                    style={{
                      fontSize: "11px",
                      color: "#7C7C77",
                      textTransform: "uppercase",
                      display: "block",
                      marginBottom: "2px",
                    }}
                  >
                    Description
                  </span>
                  <span style={{ fontSize: "13px", color: "#ECECEA" }}>
                    {invoice.description || "—"}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* not found or error state */
            <div
              style={{
                backgroundColor: "#121417",
                border: "1px solid #22262B",
                borderRadius: "6px",
                padding: "16px",
                color: "#7C7C77",
                fontSize: "13px",
              }}
            >
              Invoice #{invoiceId} not found (HTTP {response.status}).
            </div>
          )}
        </div>
      </div>

      {/* response panel */}
      <ResponsePanel response={response} loading={loading} />
    </div>
  );
};

export default BolaScenario;

import React from "react";

export interface PayloadChipProps {
  payload: string;
  onClick: (payload: string) => void;
  label?: string;
  title?: string;
}

export const PayloadChip: React.FC<PayloadChipProps> = ({
  payload,
  onClick,
  label,
  title,
}) => {
  return (
    <button
      type="button"
      onClick={() => onClick(payload)}
      title={title || `Click to insert payload: ${payload}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "6px 12px",
        backgroundColor: "#1C1F24",
        border: "1px solid #22262B",
        borderRadius: "6px",
        color: "#ECECEA",
        cursor: "pointer",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "12px",
        lineHeight: "1.4",
        transition: "all 0.15s ease",
        maxWidth: "100%",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "#E8A33D";
        e.currentTarget.style.backgroundColor = "#22262B";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "#22262B";
        e.currentTarget.style.backgroundColor = "#1C1F24";
      }}
    >
      <span
        style={{
          display: "inline-block",
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          backgroundColor: "#E8A33D",
          flexShrink: 0,
        }}
      />
      {label && (
        <span
          style={{
            color: "#7C7C77",
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: "11px",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          {label}:
        </span>
      )}
      <span
        style={{
          color: "#ECECEA",
          fontFamily: "'JetBrains Mono', monospace",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {payload}
      </span>
    </button>
  );
};

export default PayloadChip;

"use client";

import { STUDIO_STAGES, type StudioStage } from "../types";

interface Props {
  activeStage: StudioStage;
  onSelectStage: (stage: StudioStage) => void;
  completedStages?: StudioStage[];
}

export function EventLifecycleNav({
  activeStage,
  onSelectStage,
  completedStages = [],
}: Props) {
  return (
    <nav
      aria-label="Event lifecycle progress"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: "10px",
        marginBottom: "24px",
      }}
    >
      {STUDIO_STAGES.map((stage) => {
        const isActive = activeStage === stage.id;
        const isCompleted = completedStages.includes(stage.id);

        return (
          <button
            key={stage.id}
            data-testid={`stage-tab-${stage.id}`}
            onClick={() => onSelectStage(stage.id)}
            type="button"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              textAlign: "left",
              backgroundColor: isActive
                ? "#19352d"
                : isCompleted
                ? "#12201c"
                : "#161b22",
              border: isActive
                ? "2px solid #c8a870"
                : isCompleted
                ? "1px solid rgba(200, 168, 112, 0.4)"
                : "1px solid #30363d",
              borderRadius: "8px",
              padding: "12px 14px",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                width: "100%",
                alignItems: "center",
                marginBottom: "4px",
              }}
            >
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  color: isActive ? "#c8a870" : "#8b949e",
                }}
              >
                STAGE {stage.number}
              </span>
              {isCompleted ? (
                <span
                  style={{
                    backgroundColor: "#238636",
                    color: "#ffffff",
                    borderRadius: "50%",
                    width: "18px",
                    height: "18px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.7rem",
                    fontWeight: 700,
                  }}
                  title="Stage complete"
                >
                  ✓
                </span>
              ) : isActive ? (
                <span
                  style={{
                    backgroundColor: "#c8a870",
                    color: "#0c2820",
                    borderRadius: "4px",
                    padding: "1px 6px",
                    fontSize: "0.65rem",
                    fontWeight: 800,
                  }}
                >
                  CURRENT
                </span>
              ) : null}
            </div>

            <strong
              style={{
                fontSize: "0.95rem",
                color: isActive ? "#f5f0e8" : "#f0f6fc",
                marginBottom: "2px",
              }}
            >
              {stage.label}
            </strong>
            <span
              style={{
                fontSize: "0.75rem",
                color: isActive ? "#e8ded1" : "#8b949e",
              }}
            >
              {stage.shortDesc}
            </span>
          </button>
        );
      })}
    </nav>
  );
}


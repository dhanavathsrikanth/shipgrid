import { ImageResponse } from "next/og";



export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = (searchParams.get("title") || "Shipgrid").slice(0, 70);
  const desc = (searchParams.get("desc") || "AI-matched product discovery for builders").slice(0, 130);
  const votes = searchParams.get("votes") || "0";
  const author = searchParams.get("author") || "";

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          backgroundColor: "#09090b",
          padding: "64px 72px",
          justifyContent: "space-between",
          fontFamily:
            "'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        }}
      >
        {/* Top bar — Shipgrid brand */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              backgroundColor: "#7c3aed",
            }}
          >
            <span style={{ color: "#fff", fontSize: "18px", fontWeight: 800 }}>
              S
            </span>
          </div>
          <span
            style={{
              color: "#a1a1aa",
              fontSize: "20px",
              fontWeight: 600,
              letterSpacing: "-0.02em",
            }}
          >
            Shipgrid
          </span>
        </div>

        {/* Main content */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Title */}
          <div
            style={{
              color: "#fafafa",
              fontSize: title.length > 40 ? "44px" : "56px",
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
            }}
          >
            {title}
          </div>

          {/* Description */}
          <div
            style={{
              color: "#71717a",
              fontSize: "22px",
              lineHeight: 1.5,
              fontWeight: 400,
            }}
          >
            {desc}
          </div>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            {/* Vote count */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                backgroundColor: "#18181b",
                border: "1px solid #27272a",
                borderRadius: "8px",
                padding: "8px 14px",
              }}
            >
              <span style={{ color: "#7c3aed", fontSize: "16px" }}>▲</span>
              <span
                style={{
                  color: "#a1a1aa",
                  fontSize: "16px",
                  fontWeight: 600,
                }}
              >
                {votes}
              </span>
            </div>

            {/* Author */}
            {author && (
              <span style={{ color: "#52525b", fontSize: "15px" }}>
                by {author}
              </span>
            )}
          </div>

          {/* CTA */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "#7c3aed",
              borderRadius: "8px",
              padding: "10px 20px",
            }}
          >
            <span
              style={{
                color: "#fff",
                fontSize: "16px",
                fontWeight: 700,
                letterSpacing: "-0.01em",
              }}
            >
              View on Shipgrid →
            </span>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}

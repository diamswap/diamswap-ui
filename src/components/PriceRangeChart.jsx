import React from "react";
import {
  ComposedChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  ReferenceLine,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

/**
 * Props
 * ───────────────────────────────────────────────────────────────
 * data         [{ ts:Number, price:Number }]
 * distribution [{ price:Number, liquidity:Number }]
 * price        Number – live spot
 * min / max    Number – optional handles
 * onZoom       fn(range)  ⟶ called after user clicks a range pill
 * height       Number – default 160
 */
const PriceRangeChart = ({
  data = [],
  distribution = [],
  price,
  min,
  max,
  onZoom,
  height = 160,
}) => {
  const ranges = ["1D", "1W", "1M", "1Y", "All"];

  /* ── merge liquidity into series ─────────────────────────── */
  const merged = React.useMemo(() => {
    if (!distribution.length) return data;
    const copy = [...data];
    distribution.forEach((d) => {
      let idx = 0,
        best = Infinity;
      copy.forEach((p, i) => {
        const diff = Math.abs(p.price - d.price);
        if (diff < best) {
          best = diff;
          idx = i;
        }
      });
      copy[idx] = { ...copy[idx], liquidity: d.liquidity };
    });
    return copy;
  }, [data, distribution]);

  /* ── % change badge ──────────────────────────────────────── */
  const pct =
    merged.length >= 2
      ? ((price - merged[0].price) / merged[0].price) * 100
      : 0;

  /* ── local selected-range state for pill highlight ───────── */
  const [selected, setSelected] = React.useState("1M");

  const handleZoom = (r) => {
    setSelected(r);
    onZoom?.(r);
  };

  return (
    <div style={{ position: "relative", width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={merged} margin={{ top: 8, right: 40, left: 0 }}>
          {/* gradient */}
          <defs>
            <linearGradient id="pink" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ff27c0" stopOpacity={0.6} />
              <stop offset="100%" stopColor="#ff27c0" stopOpacity={0.05} />
            </linearGradient>
          </defs>

          {/* hidden axes */}
          <XAxis dataKey="ts" type="number" domain={["dataMin", "dataMax"]} hide />
          <YAxis yAxisId="l" domain={["auto", "auto"]} hide />
          <YAxis yAxisId="r" orientation="right" domain={[0, "dataMax"]} hide />

          {/* tooltip */}
          <Tooltip
            formatter={(v) =>
              typeof v === "number" ? v.toFixed(6) : v.toString()
            }
            labelFormatter={(v) =>
              new Date(v).toLocaleString(undefined, { dateStyle: "medium" })
            }
            contentStyle={{ background: "#1a1a1a", border: "none" }}
          />

          {/* liquidity bars */}
          <Bar
            yAxisId="r"
            dataKey="liquidity"
            barSize={10}
            fill="rgba(200,200,200,0.35)"
            isAnimationActive={false}
          />

          {/* price area */}
          <Area
            yAxisId="l"
            type="monotone"
            dataKey="price"
            stroke="#ff27c0"
            fill="url(#pink)"
            strokeWidth={2}
            dot={false}
          />

          {/* live spot line */}
          <ReferenceLine
            yAxisId="l"
            y={price}
            stroke="#ff27c0"
            strokeDasharray="4 4"
            strokeOpacity={0.5}
          />

          {/* user bounds */}
          {min && (
            <ReferenceLine yAxisId="l" y={min} stroke="#888" strokeWidth={3} />
          )}
          {max && (
            <ReferenceLine yAxisId="l" y={max} stroke="#888" strokeWidth={3} />
          )}
        </ComposedChart>
      </ResponsiveContainer>

      {/* %-change badge */}
      <span
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          padding: "2px 6px",
          borderRadius: 4,
          fontSize: 12,
          background: pct >= 0 ? "rgba(0,128,0,.7)" : "rgba(128,0,0,.7)",
          color: "#fff",
        }}
      >
        {pct.toFixed(2)}%
      </span>

      {/* zoom pills */}
      <div style={{ display: "flex", gap: 6, marginTop: 6, userSelect: "none" }}>
        {ranges.map((r) => {
          const active = r === selected;
          return (
            <button
              key={r}
              onClick={() => handleZoom(r)}
              style={{
                flex: 1,
                padding: "4px 0",
                background: active
                  ? "rgba(255,255,255,.12)"
                  : "transparent",
                border: active
                  ? "2px solid rgba(255,255,255,.3)"
                  : "1px solid rgba(255,255,255,.15)",
                borderRadius: 6,
                color: "#fff",
                fontSize: 10,
                cursor: "pointer",
              }}
            >
              {r}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default PriceRangeChart;

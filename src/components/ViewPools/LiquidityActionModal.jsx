import React, { useState, useEffect, useMemo } from "react";
import {
  Modal,
  Box,
  Typography,
  TextField,
  IconButton,
  Divider,
  CircularProgress,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import { IoCloseCircleOutline } from "react-icons/io5";
import CustomButton from "../../comman/CustomButton";
import PriceRangeChart from "../PriceRangeChart";
import { priceToFraction } from "../utils/fraction";

const fmt = (x, d = 2) =>
  Number(x).toLocaleString(undefined, {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  });
const decRx = /^\d+(\.\d+)?$/;
const okDec = (s) => decRx.test(s);

const FULL_MIN = { n: 1, d: 10_000_000 };
const FULL_MAX = { n: 1_000_000_000, d: 1 };
const RANGES_MS = {
  "1D": 24 * 60 * 60 * 1000,
  "1W": 7 * 24 * 60 * 60 * 1000,
  "1M": 30 * 24 * 60 * 60 * 1000,
  "1Y": 365 * 24 * 60 * 60 * 1000,
  All: Infinity,
};

export default function LiquidityActionModal({
  open,
  mode,       // "deposit" | "withdraw"
  poolId,     // hex string
  available,  // LP-share balance string
  reserves = { r0: { amount: "0", code: "" }, r1: { amount: "0", code: "" } },
  onClose,
  onAction,   // (poolId, amtA, amtB, minPrice, maxPrice) => Promise
}) {
  // UI state
  const [amtA, setAmtA] = useState("");
  const [amtB, setAmtB] = useState("");
  const [rangeType, setRange] = useState("custom");
  const [priceLow, setLow] = useState("");
  const [priceHigh, setHigh] = useState("");
  const [withdrawPct, setPct] = useState(100);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // live pool
  const [live, setLive] = useState(reserves);
  const [spot, setSpot] = useState(0);
  const [orient, setOrient] = useState("AB");

  // chart data
  const [series, setSeries] = useState([]);
  const [dist, setDist] = useState([]);
  const [zoom, setZoom] = useState("1M");

  // 1) update live & spot **only** when the numeric fields actually change:
  useEffect(() => {
    const a = parseFloat(reserves.r0.amount) || 0;
    const b = parseFloat(reserves.r1.amount) || 0;
    if (a && b) setSpot(b / a);
    setLive(reserves);
  }, [
    reserves.r0.amount,
    reserves.r1.amount,
    reserves.r0.code,
    reserves.r1.code,
  ]);

  // 2) poll on‐chain for live reserves (deposit only)
  useEffect(() => {
    if (!open || mode !== "deposit") return;
    const id = setInterval(async () => {
      try {
        const pool = await fetch(
          `https://diamtestnet.diamcircle.io/liquidity_pools/${poolId}`
        ).then((r) => r.json());
        const [ra, rb] = pool.reserves;
        setLive({
          r0: {
            amount: ra.amount,
            code: ra.asset === "native" ? "DIAM" : ra.asset.split(":")[0],
          },
          r1: {
            amount: rb.amount,
            code: rb.asset === "native" ? "DIAM" : rb.asset.split(":")[0],
          },
        });
        setSpot(parseFloat(rb.amount) / parseFloat(ra.amount));
      } catch {
        // ignore
      }
    }, 5000);
    return () => clearInterval(id);
  }, [open, mode, poolId]);

  // 3) fetch past deposits for chart
  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const ops = (
          await (
            await fetch(
              `https://diamtestnet.diamcircle.io/liquidity_pools/${poolId}/operations`
            )
          ).json()
        )._embedded.records;
        const pts = ops
          .filter((o) => o.type === "liquidity_pool_deposit")
          .map((o) => {
            const ts = +new Date(o.created_at);
            const mn = (o.min_price_r?.n ?? parseFloat(o.min_price)) /
              (o.min_price_r?.d ?? 1);
            const mx = (o.max_price_r?.n ?? parseFloat(o.max_price)) /
              (o.max_price_r?.d ?? 1);
            return { ts, price: (mn + mx) / 2 };
          });
        setSeries(pts);

        // histogram
        const buckets = 40;
        const hist = Array(buckets).fill(0);
        if (pts.length) {
          const minP = Math.min(...pts.map((p) => p.price));
          const maxP = Math.max(...pts.map((p) => p.price));
          const span = maxP - minP || 1;
          ops.forEach((o) => {
            if (o.type !== "liquidity_pool_deposit") return;
            const p =
              ((o.min_price_r?.n ?? parseFloat(o.min_price)) /
                (o.min_price_r?.d ?? 1) +
                (o.max_price_r?.n ?? parseFloat(o.max_price)) /
                  (o.max_price_r?.d ?? 1)) /
              2;
            const vol = parseFloat(o.reserves_deposited?.[1]?.amount || 0);
            const idx = Math.min(
              buckets - 1,
              Math.floor(((p - minP) / span) * buckets)
            );
            hist[idx] += vol;
          });
          setDist(
            hist.map((v, i) => ({
              price: minP + ((i + 0.5) * (span || 1)) / buckets,
              liquidity: v,
            }))
          );
        }
      } catch {
        // ignore
      }
    })();
  }, [open, poolId]);

  // filter series by zoom
  const filteredSeries = useMemo(() => {
    const cutoff = RANGES_MS[zoom];
    const now = Date.now();
    return series.filter((p) => now - p.ts <= cutoff);
  }, [series, zoom]);

  // when user types amtA in deposit, update amtB proportionally
  useEffect(() => {
    if (mode !== "deposit") return;
    const a = parseFloat(live.r0.amount) || 0;
    const b = parseFloat(live.r1.amount) || 0;
    const v = parseFloat(amtA) || 0;
    if (a && b) setAmtB(((v * b) / a).toFixed(6));
  }, [amtA, live, mode]);

  // withdraw slider → amtA
  useEffect(() => {
    if (mode !== "withdraw") return;
    const tot = parseFloat(available) || 0;
    setAmtA(((tot * withdrawPct) / 100).toFixed(6));
  }, [withdrawPct, available, mode]);

  // confirm button → call parent onAction
  const confirm = async () => {
    setErr("");
    if (mode === "deposit" && rangeType === "custom") {
      if (!okDec(priceLow)) return setErr("Low price invalid");
      if (!okDec(priceHigh)) return setErr("High price invalid");
    }

    const minP =
      mode === "deposit"
        ? rangeType === "custom"
          ? priceToFraction(priceLow)
          : FULL_MIN
        : FULL_MIN;
    const maxP =
      mode === "deposit"
        ? rangeType === "custom"
          ? priceToFraction(priceHigh)
          : FULL_MAX
        : FULL_MAX;

    setLoading(true);
    try {
      await onAction(poolId, amtA, amtB, minP, maxP);
      // reset
      setAmtA("");
      setAmtB("");
      setLow("");
      setHigh("");
      setRange("custom");
      setPct(100);
      onClose();
    } catch (e) {
      const ops = e.extras?.result_codes?.operations || [];
      setErr(
        ops.includes("op_underfunded") ? "Insufficient balance" : e.message
      );
    } finally {
      setLoading(false);
    }
  };

  // estimated outputs for withdraw
  const est0 = (() => {
    const tot = parseFloat(available) || 0;
    if (!tot || !amtA) return "0.000000";
    return ((parseFloat(amtA) / tot) * parseFloat(live.r0.amount)).toFixed(6);
  })();
  const est1 = (() => {
    const tot = parseFloat(available) || 0;
    if (!tot || !amtA) return "0.000000";
    return ((parseFloat(amtA) / tot) * parseFloat(live.r1.amount)).toFixed(6);
  })();

  return (
    <Modal
      open={open}
      onClose={() => {
        setErr("");
        onClose();
      }}
      sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}
    >
      <Box
        sx={{
          bgcolor: "#0A1B1F",
          color: "#fff",
          p: 4,
          width: 750,
          maxWidth: "90vw",
          height: "100vh",
          borderRadius: 2,
          overflowY: "auto",
        }}
      >
        {/* header */}
        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography sx={{ fontSize: 24, fontWeight: 600 }}>
            {mode === "deposit" ? "Add Liquidity" : "Remove Liquidity"}
          </Typography>
          <IconButton
            onClick={() => {
              setErr("");
              onClose();
            }}
            sx={{ color: "#fff" }}
          >
            <IoCloseCircleOutline />
          </IconButton>
        </Box>
        <Divider sx={{ my: 2 }} />

        <Typography sx={{ fontSize: 12, wordBreak: "break-all" }}>
          <strong>Pool ID:</strong> {poolId}
        </Typography>

        {/* price / orientation */}
        {mode === "deposit" && spot > 0 && (
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography sx={{ fontWeight: 600 }}>
              {orient === "AB"
                ? `1 ${reserves.r0.code} = ${fmt(spot)} ${reserves.r1.code}`
                : `1 ${reserves.r1.code} = ${fmt(1 / spot)} ${
                    reserves.r0.code
                  }`}
            </Typography>
            <ToggleButtonGroup
              size="small"
              value={orient}
              exclusive
              onChange={(_, v) => v && setOrient(v)}
            >
              <ToggleButton value="AB">{reserves.r0.code}</ToggleButton>
              <ToggleButton value="BA">{reserves.r1.code}</ToggleButton>
            </ToggleButtonGroup>
          </Box>
        )}

        {/* chart */}
        <PriceRangeChart
          data={filteredSeries}
          distribution={dist}
          price={spot}
          min={rangeType === "custom" ? parseFloat(priceLow) : null}
          max={rangeType === "custom" ? parseFloat(priceHigh) : null}
          onZoom={setZoom}
        />

        {err && (
          <Typography color="error" sx={{ mt: 2 }}>
            {err}
          </Typography>
        )}

        {/* deposit UI */}
        {mode === "deposit" && (
          <>
            <ToggleButtonGroup
              fullWidth
              value={rangeType}
              exclusive
              onChange={(_, v) => v && setRange(v)}
              sx={{ my: 2 }}
            >
              <ToggleButton value="full">Full Range</ToggleButton>
              <ToggleButton value="custom">Custom Range</ToggleButton>
            </ToggleButtonGroup>
            {rangeType === "custom" && (
              <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
                <TextField
                  fullWidth
                  label="Low Price"
                  placeholder="0.95"
                  value={priceLow}
                  onChange={(e) => setLow(e.target.value)}
                  InputProps={{ sx: { color: "#fff" } }}
                />
                <TextField
                  fullWidth
                  label="High Price"
                  placeholder="1.05"
                  value={priceHigh}
                  onChange={(e) => setHigh(e.target.value)}
                  InputProps={{ sx: { color: "#fff" } }}
                />
              </Box>
            )}
            <TextField
              fullWidth
              label={`Amount ${reserves.r0.code}`}
              placeholder="0.0"
              value={amtA}
              onChange={(e) => setAmtA(e.target.value.replace(/[^0-9.]/g, ""))}
              helperText={`Reserve: ${fmt(live.r0.amount, 6)}`}
              sx={{ mb: 2 }}
              InputProps={{ sx: { color: "#fff" } }}
            />
            <TextField
              fullWidth
              label={`Amount ${reserves.r1.code}`}
              placeholder="0.0"
              value={amtB}
              onChange={(e) => setAmtB(e.target.value.replace(/[^0-9.]/g, ""))}
              helperText={`Reserve: ${fmt(live.r1.amount, 6)}`}
              sx={{ mb: 3 }}
              InputProps={{ sx: { color: "#fff" } }}
            />
          </>
        )}

        {/* withdraw UI */}
        {mode === "withdraw" && (
          <>
            <ToggleButtonGroup
              fullWidth
              value={withdrawPct}
              exclusive
              onChange={(_, v) => v !== null && setPct(v)}
              sx={{ mb: 2 }}
            >
              {[25, 50, 75, 100].map((p) => (
                <ToggleButton key={p} value={p}>
                  {p === 100 ? "Max" : `${p}%`}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
            <Typography align="center" sx={{ mb: 2 }}>
              Withdrawing {withdrawPct}%
            </Typography>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
              <Typography>
                {est0} {reserves.r0.code}
              </Typography>
              <Typography>
                {est1} {reserves.r1.code}
              </Typography>
            </Box>
          </>
        )}

        {/* confirm */}
        <CustomButton
          fullWidth
          onClick={confirm}
          disabled={
            loading ||
            (mode === "deposit" &&
              rangeType === "custom" &&
              !(amtA && amtB && okDec(priceLow) && okDec(priceHigh)))
          }
        >
          {loading ? (
            <CircularProgress size={20} color="inherit" />
          ) : mode === "deposit" ? (
            "Confirm Deposit"
          ) : (
            "Remove Liquidity"
          )}
        </CustomButton>
      </Box>
    </Modal>
  );
}

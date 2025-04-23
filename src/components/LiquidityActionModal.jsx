// src/components/LiquidityActionModal.jsx
import React, { useState, useEffect } from "react";
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
import CustomButton from "../comman/CustomButton";
import { priceToFraction } from "./utils/fraction";
import { Aurora } from "diamnet-sdk";
import { Buffer } from "buffer";

if (!window.Buffer) window.Buffer = Buffer;
const server = new Aurora.Server("https://diamtestnet.diamcircle.io/");

// ───────────────── helpers ──────────────────
const fmt = (x, d = 2) =>
  Number(x).toLocaleString(undefined, {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  });
const decRx = /^\d+(\.\d+)?$/;
const okDec = (s) => decRx.test(s);


const FULL_MIN = { n: 1, d: 10_000_000 };        // 0.0000001
const FULL_MAX = { n: 1_000_000_000, d: 1 };  
// ================================================================
export default function LiquidityActionModal({
  open,
  mode, // "deposit" | "withdraw"
  poolId,
  available = "0", // LP shares
  reserves = {
    // { r0:{ amount, code }, r1:{…} }
    r0: { amount: "0", code: "" },
    r1: { amount: "0", code: "" },
  },
  onClose,
  onAction, // (id, amtA, amtB, minP, maxP) => Promise
}) {
  // ---------- UI state ----------
  const [amtA, setAmtA] = useState("");
  const [amtB, setAmtB] = useState("");

  const [rangeType, setRange] = useState("custom"); // deposit
  const [priceLow, setLow] = useState("");
  const [priceHigh, setHigh] = useState("");
  const [withdrawPct, setPct] = useState(100); // withdraw

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // ---------- live pool ----------
  const [live, setLive] = useState(reserves);
  const [spot, setSpot] = useState(0); // B per A
  const [orient, setOrient] = useState("AB");

  // watch *primitive* props only → no infinite loop
  const { amount: aAmt, code: aCode } = reserves.r0;
  const { amount: bAmt, code: bCode } = reserves.r1;

  useEffect(() => {
    const a = parseFloat(aAmt) || 0;
    const b = parseFloat(bAmt) || 0;
    if (a && b) setSpot(b / a);
    setLive(reserves); // safe: fires only on real change
  }, [aAmt, bAmt, aCode, bCode, reserves]);

  // polling (deposit only)
  useEffect(() => {
    if (!open || mode !== "deposit") return;
    const id = setInterval(async () => {
      try {
        const pool = await server
          .liquidityPools()
          .liquidityPoolId(poolId)
          .call();
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
      } catch (e) {
        console.warn("poll", e);
      }
    }, 5_000);
    return () => clearInterval(id);
  }, [open, mode, poolId]);

  // A‑>B helper
  useEffect(() => {
    if (mode !== "deposit" || !live.r0.amount || !amtA) return;
    const r0 = parseFloat(live.r0.amount);
    const r1 = parseFloat(live.r1.amount);
    const v = parseFloat(amtA);
    if (r0 && r1 && !Number.isNaN(v)) setAmtB(((v * r1) / r0).toFixed(6));
  }, [amtA, live, mode]);

  // withdraw pct
  useEffect(() => {
    if (mode !== "withdraw") return;
    const tot = parseFloat(available) || 0;
    setAmtA(((tot * withdrawPct) / 100).toFixed(6));
  }, [withdrawPct, available, mode]);

  // ---------- confirm ----------
  const confirm = async () => {
    setErr("");

    if (mode === "deposit" && rangeType === "custom") {
      if (!okDec(priceLow)) return setErr("Min price invalid");
      if (!okDec(priceHigh)) return setErr("Max price invalid");
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
      const ops = e?.extras?.result_codes?.operations || [];
      setErr(
        ops.includes("op_underfunded") ? "Insufficient balance" : e.message
      );
    } finally {
      setLoading(false);
    }
  };

  // ---------- helpers ----------
  const Price = () =>
    !spot ? null : orient === "AB" ? (
      <Typography sx={{ mb: 2, fontWeight: 600 }}>
        1&nbsp;{aCode}&nbsp;=&nbsp;{fmt(spot)}&nbsp;{bCode}
      </Typography>
    ) : (
      <Typography sx={{ mb: 2, fontWeight: 600 }}>
        1&nbsp;{bCode}&nbsp;=&nbsp;{fmt(1 / spot)}&nbsp;{aCode}
      </Typography>
    );

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

  // ---------- UI ----------
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
          p: 4,
          width: 650,
          maxWidth: "90vw",
          color: "#fff",
          borderRadius: 2,
        }}
      >
        {/* header */}
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
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
        <Divider sx={{ mb: 2 }} />

        <Typography sx={{ mb: 1, wordBreak: "break-all" }}>
          <strong>Pool ID:</strong>&nbsp;{poolId}
        </Typography>

        {mode === "deposit" && spot > 0 && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 2,
            }}
          >
            <Price />
            <ToggleButtonGroup
              size="small"
              value={orient}
              exclusive
              onChange={(_, v) => v && setOrient(v)}
              sx={{
                background: "rgba(255,255,255,.08)",
                borderRadius: "999px",
                p: "4px",
                "& .MuiToggleButton-root": {
                  border: "none",
                  borderRadius: "999px",
                  px: 3,
                  fontSize: 12,
                  color: "whitesmoke",
                },
                "& .Mui-selected": {
                  bgcolor: "#4caf50!important",
                  color: "#0A1B1F",
                },
              }}
            >
              <ToggleButton value="AB">{aCode}</ToggleButton>
              <ToggleButton value="BA">{bCode}</ToggleButton>
            </ToggleButtonGroup>
          </Box>
        )}

        {err && (
          <Typography color="error" sx={{ mb: 2 }}>
            {err}
          </Typography>
        )}

        {/* ---------- DEPOSIT UI ---------- */}
        {mode === "deposit" && (
          <>
            <ToggleButtonGroup
              fullWidth
              value={rangeType}
              exclusive
              onChange={(_, v) => v && setRange(v)}
              sx={{
                mb: 3,
                bgcolor: "#000",
                "& .MuiToggleButton-root": { color: "#fff", flex: 1 },
                "& .Mui-selected": {
                  bgcolor: "#4caf50!important",
                  color: "#0A1B1F",
                },
              }}
            >
              <ToggleButton value="full">Full range</ToggleButton>
              <ToggleButton value="custom">Custom range</ToggleButton>
            </ToggleButtonGroup>

            {rangeType === "custom" ? (
              <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
                {[
                  { lbl: "Low", v: priceLow, s: setLow },
                  { lbl: "High", v: priceHigh, s: setHigh },
                ].map(({ lbl, v, s }) => (
                  <TextField
                    key={lbl}
                    label={`${lbl} price`}
                    value={v}
                    onChange={(e) => s(e.target.value)}
                    placeholder={lbl === "Low" ? "0.95" : "1.05"}
                    fullWidth
                    InputProps={{
                      sx: { color: "#fff", border: "1px solid gray" },
                    }}
                  />
                ))}
              </Box>
            ) : (
              <Box
                sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}
              >
                <Typography>Min 0</Typography>
                <Typography>Max ∞</Typography>
              </Box>
            )}

            <TextField
              label={`Amount ${aCode}`}
              value={amtA}
              onChange={(e) => setAmtA(e.target.value.replace(/[^0-9.]/g, ""))}
              helperText={`Reserve: ${fmt(live.r0.amount, 6)}`}
              fullWidth
              sx={{ mb: 2 }}
              InputProps={{ sx: { color: "#fff", border: "1px solid gray" } }}
            />
            <TextField
              label={`Amount ${bCode}`}
              value={amtB}
              onChange={(e) => setAmtB(e.target.value.replace(/[^0-9.]/g, ""))}
              helperText={`Reserve: ${fmt(live.r1.amount, 6)}`}
              fullWidth
              sx={{ mb: 3 }}
              InputProps={{ sx: { color: "#fff", border: "1px solid gray" } }}
            />
          </>
        )}

        {/* ---------- WITHDRAW UI ---------- */}
        {mode === "withdraw" && (
          <>
            <ToggleButtonGroup
              fullWidth
              value={withdrawPct}
              exclusive
              onChange={(_, v) => v !== null && setPct(v)}
              sx={{
                mb: 2,
                "& .MuiToggleButton-root": { color: "#fff", flex: 1 },
                "& .Mui-selected": {
                  bgcolor: "#4caf50!important",
                  color: "#0A1B1F",
                },
              }}
            >
              {[25, 50, 75, 100].map((p) => (
                <ToggleButton key={p} value={p}>
                  {p === 100 ? "Max" : `${p}%`}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>

            <Typography variant="h3" align="center" sx={{ mb: 2 }}>
              {withdrawPct}%
            </Typography>

            <Box
              sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}
            >
              <Typography>
                {est0} {aCode}
              </Typography>
              <Typography>
                {est1} {bCode}
              </Typography>
            </Box>
          </>
        )}

        {/* confirm */}
        <CustomButton
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

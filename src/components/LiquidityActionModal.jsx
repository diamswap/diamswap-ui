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
  Button,
} from "@mui/material";
import { IoCloseCircleOutline } from "react-icons/io5";
import CustomButton from "../comman/CustomButton";
import { priceToFraction } from "./utils/fraction";
import { Aurora } from "diamnet-sdk"; // we only need server here
import { Buffer } from "buffer";

if (!window.Buffer) window.Buffer = Buffer;
const server = new Aurora.Server("https://diamtestnet.diamcircle.io/");

function formatNumber(x, decimals = 2) {
  return Number(x).toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export default function LiquidityActionModal({
  open,
  mode,      // "deposit" or "withdraw"
  poolId,
  available, // total LP shares
  reserves = {
    r0: { amount: "0", code: "" },
    r1: { amount: "0", code: "" },
  },
  onClose,
  onAction,  // async (poolId, amtA, amtB, minFrac, maxFrac) => void
}) {
  // user inputs
  const [amtA, setAmtA] = useState("");
  const [amtB, setAmtB] = useState("");
  const [priceLow, setPriceLow] = useState("");
  const [priceHigh, setPriceHigh] = useState("");
  const [rangeType, setRangeType] = useState("custom"); // only for deposit
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // withdraw‐specific
  const [withdrawPct, setWithdrawPct] = useState(100);

  // live pool data + price orientation
  const [live, setLive] = useState(reserves);
  const [marketPriceAB, setMarketPriceAB] = useState(0); // price B per A
  const [orientation, setOrientation] = useState("AB"); // AB or BA

  // init live & marketPrice
  useEffect(() => {
    const a0 = parseFloat(reserves.r0.amount) || 0;
    const a1 = parseFloat(reserves.r1.amount) || 0;
    if (a0 > 0 && a1 > 0) setMarketPriceAB(a1 / a0);
    setLive(reserves);
  }, [reserves]);

  // poll every 5s when depositing
  useEffect(() => {
    if (!open || mode !== "deposit") return;
    const id = setInterval(async () => {
      try {
        const pool = await server
          .liquidityPools()
          .liquidityPoolId(poolId)
          .call();
        const [a, b] = pool.reserves;
        const updated = {
          r0: { amount: a.amount, code: a.asset === "native" ? "DIAM" : a.asset.split(":")[0] },
          r1: { amount: b.amount, code: b.asset === "native" ? "DIAM" : b.asset.split(":")[0] },
        };
        setLive(updated);
        setMarketPriceAB(parseFloat(b.amount) / parseFloat(a.amount));
      } catch (e) {
        console.warn("Pool poll failed", e);
      }
    }, 5000);
    return () => clearInterval(id);
  }, [open, mode, poolId]);

  // deposit: auto‑suggest B when A changes
  useEffect(() => {
    if (mode !== "deposit" || !live.r0.amount || !amtA) return;
    const a0 = parseFloat(live.r0.amount);
    const a1 = parseFloat(live.r1.amount);
    const v = parseFloat(amtA);
    if (a0 && a1 && !isNaN(v)) setAmtB((v * (a1 / a0)).toFixed(6));
  }, [amtA, live, mode]);

  // withdraw: apply percentage to amtA
  useEffect(() => {
    if (mode !== "withdraw") return;
    const total = parseFloat(available) || 0;
   const share = (total * withdrawPct) / 100;
   setAmtA(share.toFixed(7)); 
  }, [withdrawPct, available, mode]);

  const isDecimal = (s) => /^\d+(\.\d+)?$/.test(s);

  const handleConfirm = async () => {
    setErrorMsg("");
    // only validate price in deposit+custom
    if (mode === "deposit" && rangeType === "custom") {
      if (!isDecimal(priceLow)) { setErrorMsg("Min price invalid"); return; }
      if (!isDecimal(priceHigh)) { setErrorMsg("Max price invalid"); return; }
    }
    setLoading(true);
    try {
      let minFrac, maxFrac;

      if (mode === "deposit") {
        minFrac = rangeType === "custom"
          ? priceToFraction(priceLow)
          : { numerator: 0, denominator: 1 };
        maxFrac = rangeType === "custom"
          ? priceToFraction(priceHigh)
          : { numerator: 1, denominator: 0 };
      } else {
        // remove liquidity uses full-range dummy
        minFrac = { numerator: 0, denominator: 1 };
        maxFrac = { numerator: 1, denominator: 0 };
      }

      await onAction(poolId, amtA, amtB, minFrac, maxFrac);

      // reset
      setAmtA(""); setAmtB("");
      setPriceLow(""); setPriceHigh("");
      setRangeType("custom");
      setWithdrawPct(100);
      onClose();
    } catch (e) {
      console.error(e);
      const codes = e?.extras?.result_codes?.operations || [];
      setErrorMsg(
        codes.includes("op_underfunded")
          ? "Insufficient balance"
          : e.message || "Transaction failed"
      );
    } finally {
      setLoading(false);
    }
  };

  // display market price + toggle
  const PriceDisplay = () => {
    if (!marketPriceAB) return null;
    const a = live.r0.code, b = live.r1.code;
    if (orientation === "AB") {
      return (
        <Typography sx={{ mb: 2 }}>
          Market price: 1 {a} = {formatNumber(marketPriceAB)} {b}
        </Typography>
      );
    }
    return (
      <Typography sx={{ mb: 2 }}>
        Market price: 1 {b} = {formatNumber(1 / marketPriceAB)} {a}
      </Typography>
    );
  };

  // estimates for withdraw
  const estimate0 = (() => {
    const tot = parseFloat(available) || 0;
    if (!tot || !amtA) return "0.000000";
    return ((parseFloat(amtA) / tot) * parseFloat(live.r0.amount)).toFixed(6);
  })();
  const estimate1 = (() => {
    const tot = parseFloat(available) || 0;
    if (!tot || !amtA) return "0.000000";
    return ((parseFloat(amtA) / tot) * parseFloat(live.r1.amount)).toFixed(6);
  })();

  return (
    <Modal
      open={open}
      onClose={() => { setErrorMsg(""); onClose(); }}
      sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}
    >
      <Box
        sx={{
          bgcolor: "#0A1B1F",
          p: 4,
          borderRadius: 2,
          width: 650,
          maxWidth: "90vw",
          color: "#FFF",
        }}
      >
        {/* Header */}
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
          <Typography variant="h6">
            {mode === "deposit" ? "Add Liquidity" : "Remove Liquidity"}
          </Typography>
          <IconButton onClick={() => { setErrorMsg(""); onClose(); }} sx={{ color: "#fff" }}>
            <IoCloseCircleOutline />
          </IconButton>
        </Box>
        <Divider sx={{ mb: 2 }} />

        {/* Pool ID */}
        <Typography sx={{ mb: 2, wordBreak: "break-all" }}>
          <strong>Pool ID:</strong> {poolId}
        </Typography>

        {/* Deposit: market price + toggle */}
        {mode === "deposit" && marketPriceAB > 0 && (
          <Box sx={{ display: "flex", alignItems: "center", mb: 2, gap: 2 }}>
            <PriceDisplay />
            <ToggleButtonGroup
              size="small"
              value={orientation}
              exclusive
              onChange={(_, v) => v && setOrientation(v)}
            >
              <ToggleButton value="AB">{live.r0.code}→{live.r1.code}</ToggleButton>
              <ToggleButton value="BA">{live.r1.code}→{live.r0.code}</ToggleButton>
            </ToggleButtonGroup>
          </Box>
        )}

        {/* Error */}
        {errorMsg && (
          <Typography color="error" sx={{ mb: 2 }}>
            {errorMsg}
          </Typography>
        )}

        {/* ADD LIQUIDITY */}
        {mode === "deposit" && (
          <>
            <ToggleButtonGroup
              value={rangeType}
              exclusive
              onChange={(_, v) => v && setRangeType(v)}
              fullWidth
              sx={{ mb: 3 }}
            >
              <ToggleButton value="full">Full range</ToggleButton>
              <ToggleButton value="custom">Custom range</ToggleButton>
            </ToggleButtonGroup>

            {rangeType === "custom" ? (
              <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
                {["Low", "High"].map((type) => {
                  const val = type === "Low" ? priceLow : priceHigh;
                  const setVal = type === "Low" ? setPriceLow : setPriceHigh;
                  return (
                    <Box key={type} sx={{ flex: 1 }}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        {type} price ({live.r1.code} = 1 {live.r0.code})
                      </Typography>
                      <TextField
                        value={val}
                        onChange={(e) => setVal(e.target.value)}
                        placeholder={`e.g. ${type === "Low" ? 0.95 : 1.05}`}
                        fullWidth
                        InputProps={{ sx: { color: "#fff" } }}
                      />
                      <Box sx={{ mt: 1, display: "flex", gap: 1 }}>
                        <Button
                          size="small"
                          onClick={() =>
                            setVal(
                              (parseFloat(val || marketPriceAB) * (type === "Low" ? 0.99 : 1.01)).toFixed(
                                6
                              )
                            )
                          }
                        >
                          {type === "Low" ? "−" : "+"}
                        </Button>
                        <Button
                          size="small"
                          onClick={() =>
                            setVal(
                              (parseFloat(val || marketPriceAB) * (type === "Low" ? 1.01 : 0.99)).toFixed(
                                6
                              )
                            )
                          }
                        >
                          {type === "Low" ? "+" : "−"}
                        </Button>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            ) : (
              <Box sx={{ display: "flex", gap: 4, justifyContent: "space-between", mb: 3 }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Min price
                  </Typography>
                  <Typography>0</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Max price
                  </Typography>
                  <Typography>∞</Typography>
                </Box>
              </Box>
            )}

            <TextField
              label={`Amount ${live.r0.code}`}
              value={amtA}
              onChange={(e) => setAmtA(e.target.value.replace(/[^0-9.]/g, ""))}
              helperText={`Reserve: ${formatNumber(live.r0.amount, 6)}`}
              fullWidth
              sx={{ mb: 2 }}
              InputProps={{ sx: { color: "#fff" } }}
            />
            <TextField
              label={`Amount ${live.r1.code}`}
              value={amtB}
              onChange={(e) => setAmtB(e.target.value.replace(/[^0-9.]/g, ""))}
              helperText={`Reserve: ${formatNumber(live.r1.amount, 6)}`}
              fullWidth
              sx={{ mb: 3 }}
              InputProps={{ sx: { color: "#fff" } }}
            />
          </>
        )}

        {/* REMOVE LIQUIDITY */}
        {mode === "withdraw" && (
          <>
            <ToggleButtonGroup
              value={withdrawPct}
              exclusive
              onChange={(_, v) => v !== null && setWithdrawPct(v)}
              fullWidth
              sx={{ mb: 2 }}
            >
              {[25, 50, 75, 100].map((pct) => (
                <ToggleButton key={pct} value={pct} sx={{ color: "#fff" }}>
                  {pct === 100 ? "Max" : pct + "%"}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>

            <Typography variant="h3" align="center" sx={{ mb: 2 }}>
              {withdrawPct}%
            </Typography>

            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
              <Typography>
                {estimate0} {live.r0.code}
              </Typography>
              <Typography>
                {estimate1} {live.r1.code}
              </Typography>
            </Box>
          </>
        )}

        <CustomButton
          onClick={handleConfirm}
          fullWidth
          disabled={
            loading ||
            (mode === "deposit" &&
              rangeType === "custom" &&
              !(amtA && amtB && isDecimal(priceLow) && isDecimal(priceHigh)))
          }
          sx={{ py: 1.5 }}
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

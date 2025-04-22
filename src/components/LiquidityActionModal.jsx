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
  Button,
} from "@mui/material";
import { IoCloseCircleOutline } from "react-icons/io5";
import CustomButton from "../comman/CustomButton";
import { priceToFraction } from "./utils/fraction";
import { Aurora, TransactionBuilder, Operation, BASE_FEE } from "diamnet-sdk";
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
  available,
  reserves = {
    r0: { amount: "0", code: "" },
    r1: { amount: "0", code: "" },
  },
  onClose,
  onAction,  // async (poolId, amtA, amtB, minFrac, maxFrac) => void
}) {
  // user inputs
  const [amtA, setAmtA]         = useState("");
  const [amtB, setAmtB]         = useState("");
  const [priceLow, setPriceLow]   = useState("");
  const [priceHigh, setPriceHigh] = useState("");
  const [rangeType, setRangeType] = useState("custom"); // "full" | "custom"
  const [loading, setLoading]     = useState(false);
  const [errorMsg, setErrorMsg]   = useState("");

  // live pool data & price orientation
  const [live, setLive]           = useState(reserves);
  const [marketPriceAB, setMarketPriceAB] = useState(0); // price as B per A
  const [orientation, setOrientation]     = useState("AB"); // "AB" or "BA"

  useEffect(() => {
    const a0 = parseFloat(reserves.r0.amount) || 0;
    const a1 = parseFloat(reserves.r1.amount) || 0;
    if (a0 > 0 && a1 > 0) {
      setMarketPriceAB(a1 / a0);
    }
    setLive(reserves);
  }, [reserves]);

  // poll reserves every 5s when open & in deposit mode
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
          r0: {
            amount: a.amount,
            code: a.asset === "native" ? "DIAM" : a.asset.split(":")[0],
          },
          r1: {
            amount: b.amount,
            code: b.asset === "native" ? "DIAM" : b.asset.split(":")[0],
          },
        };
        setLive(updated);
        setMarketPriceAB(parseFloat(b.amount) / parseFloat(a.amount));
      } catch (e) {
        console.warn("Pool poll failed", e);
      }
    }, 5000);
    return () => clearInterval(id);
  }, [open, mode, poolId]);

  // auto‑suggest B when user enters A
  useEffect(() => {
    if (mode !== "deposit" || !live.r0.amount || !amtA) return;
    const a0 = parseFloat(live.r0.amount);
    const a1 = parseFloat(live.r1.amount);
    const v  = parseFloat(amtA);
    if (a0 && a1 && !isNaN(v)) {
      setAmtB((v * (a1 / a0)).toFixed(6));
    }
  }, [amtA, live, mode]);

  const isDecimal = s => /^\d+(\.\d+)?$/.test(s);

  const handleConfirm = async () => {
    setErrorMsg("");
    // validate custom range
    if (mode === "deposit" && rangeType === "custom") {
      if (!isDecimal(priceLow)) {
        setErrorMsg("Min price must be a valid number");
        return;
      }
      if (!isDecimal(priceHigh)) {
        setErrorMsg("Max price must be a valid number");
        return;
      }
    }
    setLoading(true);
    try {
      const minFrac = rangeType === "custom"
        ? priceToFraction(priceLow)
        : { numerator: 0, denominator: 1 };
      const maxFrac = rangeType === "custom"
        ? priceToFraction(priceHigh)
        : { numerator: 1, denominator: 0 };

      await onAction(poolId, amtA, amtB, minFrac, maxFrac);

      // reset
      setAmtA(""); setAmtB("");
      setPriceLow(""); setPriceHigh("");
      setRangeType("custom");
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

  // render price with orientation toggle
  const PriceDisplay = () => {
    const a = live.r0.code,
          b = live.r1.code;
    if (!marketPriceAB) return null;
    if (orientation === "AB") {
      return (
        <Typography variant="body2" sx={{ mb: 2 }}>
          Market price: 1 {a} = {formatNumber(marketPriceAB)} {b}
        </Typography>
      );
    } else {
      const inv = 1 / marketPriceAB;
      return (
        <Typography variant="body2" sx={{ mb: 2 }}>
          Market price: 1 {b} = {formatNumber(inv)} {a}
        </Typography>
      );
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => { setErrorMsg(""); onClose(); }}
      sx={{ display:"flex", alignItems:"center", justifyContent:"center" }}
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
        {/* header */}
        <Box sx={{ display:"flex", justifyContent:"space-between", mb:2 }}>
          <Typography variant="h6">
            {mode === "deposit" ? "Add Liquidity" : "Withdraw Liquidity"}
          </Typography>
          <IconButton
            onClick={() => { setErrorMsg(""); onClose(); }}
            sx={{ color:"#fff" }}
          >
            <IoCloseCircleOutline />
          </IconButton>
        </Box>
        <Divider sx={{ mb:2 }}/>

        {/* pool id */}
        <Typography variant="body2" sx={{ mb:2, wordBreak:"break-all" }}>
          <strong>Pool ID:</strong> {poolId}
        </Typography>

        {/* price orientation toggle */}
        {mode === "deposit" && marketPriceAB > 0 && (
          <Box sx={{ display:"flex", alignItems:"center", mb:2, gap:2 }}>
            <PriceDisplay/>
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

        {/* error */}
        {errorMsg && (
          <Typography color="error" sx={{ mb:2 }}>
            {errorMsg}
          </Typography>
        )}

        {/* deposit UI */}
        {mode === "deposit" && (
          <>
            {/* range selector */}
            <ToggleButtonGroup
              value={rangeType}
              exclusive
              onChange={(_, v) => v && setRangeType(v)}
              fullWidth
              sx={{ mb:3 }}
            >
              <ToggleButton value="full">Full range</ToggleButton>
              <ToggleButton value="custom">Custom range</ToggleButton>
            </ToggleButtonGroup>

            {rangeType === "custom" ? (
              <Box sx={{ display:"flex", gap:2, mb:3 }}>
                {/* Min price */}
                <Box sx={{ flex:1 }}>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                  >
                    Min price ({live.r1.code} = 1 {live.r0.code})
                  </Typography>
                  <TextField
                    value={priceLow}
                    onChange={e => setPriceLow(e.target.value)}
                    placeholder="e.g. 0.95"
                    fullWidth
                    InputProps={{ sx:{ color:"#fff" } }}
                  />
                  <Box sx={{ mt:1, display:"flex", gap:1 }}>
                    <Button
                      size="small"
                      onClick={() =>
                        setPriceLow(
                          (parseFloat(priceLow||marketPriceAB)*0.99).toFixed(6)
                        )
                      }
                    >−</Button>
                    <Button
                      size="small"
                      onClick={() =>
                        setPriceLow(
                          (parseFloat(priceLow||marketPriceAB)*1.01).toFixed(6)
                        )
                      }
                    >+</Button>
                  </Box>
                </Box>
                {/* Max price */}
                <Box sx={{ flex:1 }}>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                  >
                    Max price ({live.r1.code} = 1 {live.r0.code})
                  </Typography>
                  <TextField
                    value={priceHigh}
                    onChange={e => setPriceHigh(e.target.value)}
                    placeholder="e.g. 1.05"
                    fullWidth
                    InputProps={{ sx:{ color:"#fff" } }}
                  />
                  <Box sx={{ mt:1, display:"flex", gap:1 }}>
                    <Button
                      size="small"
                      onClick={() =>
                        setPriceHigh(
                          (parseFloat(priceHigh||marketPriceAB)*1.01).toFixed(6)
                        )
                      }
                    >+</Button>
                    <Button
                      size="small"
                      onClick={() =>
                        setPriceHigh(
                          (parseFloat(priceHigh||marketPriceAB)*0.99).toFixed(6)
                        )
                      }
                    >−</Button>
                  </Box>
                </Box>
              </Box>
            ) : (
              <Box
                sx={{
                  display:"flex",
                  gap:4,
                  justifyContent:"space-between",
                  mb:3,
                }}
              >
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

            {/* amount inputs */}
            <TextField
              label={`Amount ${live.r0.code}`}
              value={amtA}
              onChange={e => setAmtA(e.target.value.replace(/[^0-9.]/g, ""))}
              helperText={`Reserve: ${formatNumber(live.r0.amount, 6)}`}
              fullWidth
              sx={{ mb:2 }}
              InputProps={{ sx:{ color:"#fff" } }}
            />
            <TextField
              label={`Amount ${live.r1.code}`}
              value={amtB}
              onChange={e => setAmtB(e.target.value.replace(/[^0-9.]/g, ""))}
              helperText={`Reserve: ${formatNumber(live.r1.amount, 6)}`}
              fullWidth
              sx={{ mb:3 }}
              InputProps={{ sx:{ color:"#fff" } }}
            />
          </>
        )}

        {/* withdraw UI */}
        {mode === "withdraw" && (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb:1 }}>
              Available shares: {available}
            </Typography>
            <TextField
              label="Shares to burn"
              value={amtA}
              onChange={e => setAmtA(e.target.value.replace(/[^0-9.]/g, ""))}
              fullWidth
              sx={{ mb:2 }}
              InputProps={{ sx:{ color:"#fff" } }}
            />
            <TextField
              label={`Min ${live.r0.code} to receive`}
              value={amtB}
              onChange={e => setAmtB(e.target.value.replace(/[^0-9.]/g, ""))}
              fullWidth
              sx={{ mb:3 }}
              InputProps={{ sx:{ color:"#fff" } }}
            />
          </>
        )}

        {/* confirm */}
        <CustomButton
          onClick={handleConfirm}
          fullWidth
          disabled={
            loading ||
            (mode === "deposit" &&
              rangeType === "custom" &&
              !(
                amtA &&
                amtB &&
                isDecimal(priceLow) &&
                isDecimal(priceHigh)
              ))
          }
          sx={{ py:1.5 }}
        >
          {loading
            ? <CircularProgress size={20} color="inherit"/>
            : "Confirm"
          }
        </CustomButton>
      </Box>
    </Modal>
  );
}

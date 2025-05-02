// src/components/TokensPage.jsx
import React, { useState, useEffect } from "react";
import {
  Container,
  Box,
  Typography,
  CircularProgress,
  TextField,
  Paper,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TablePagination,
  Tooltip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
} from "@mui/material";
import { Aurora } from "diamnet-sdk";

const HORIZON_URL = "https://diamtestnet.diamcircle.io";
const server = new Aurora.Server(HORIZON_URL);

// helper: truncate long strings, show full in Tooltip
function truncate(str, start = 6, end = 6) {
  if (!str) return "";
  if (str.length <= start + end + 3) return str;
  return `${str.slice(0, start)}…${str.slice(-end)}`;
}

export default function TokensPage() {
  const walletId = localStorage.getItem("diamPublicKey") || "";

  // all on‑chain assets
  const [allAssets, setAllAssets] = useState([]);
  const [trustlines, setTrustlines] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // pagination & filter
  const [filterText, setFilterText] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // trade modal state
  const [tradeModalOpen, setTradeModalOpen] = useState(false);
  const [tradeMode, setTradeMode] = useState(""); // "buy" | "sell"
  const [tradeAsset, setTradeAsset] = useState({ code: "", issuer: "" });
  const [tradeAmount, setTradeAmount] = useState("");

  // fetch assets
  useEffect(() => {
    setLoading(true);
    fetch(`${HORIZON_URL}/assets?limit=200`)
      .then((r) => r.json())
      .then((json) => setAllAssets(json._embedded?.records || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // fetch trustlines
  useEffect(() => {
    if (!walletId) return;
    server
      .loadAccount(walletId)
      .then((acct) => {
        const map = {};
        acct.balances.forEach((b) => {
          if (b.asset_type === "native") return;
          const key = `${b.asset_code}:${b.asset_issuer}`;
          map[key] = {
            balance: parseFloat(b.balance),
            buying: parseFloat(b.buying_liabilities || 0),
            selling: parseFloat(b.selling_liabilities || 0),
          };
        });
        map["DIAM:"] = {
          balance: parseFloat(
            acct.balances.find((b) => b.asset_type === "native")?.balance || 0
          ),
          buying: 0,
          selling: 0,
        };
        setTrustlines(map);
      })
      .catch((e) => console.error(e));
  }, [walletId]);

  // filter + paginate
  const filtered = allAssets.filter((asset) => {
    const code = asset.asset_code || "DIAM";
    const issuer = asset.asset_issuer || "";
    return (
      code.toLowerCase().includes(filterText.toLowerCase()) ||
      issuer.toLowerCase().includes(filterText.toLowerCase())
    );
  });
  const paged = filtered.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  if (loading) return <Box textAlign="center" mt={8}><CircularProgress size={48} /></Box>;
  if (error) return <Typography color="error">{error}</Typography>;

  // open trade modal
  const openTradeModal = (mode, code, issuer) => {
    setTradeMode(mode);
    setTradeAsset({ code, issuer });
    setTradeAmount("");
    setTradeModalOpen(true);
  };

  // handle trade submit (stub - integrate your logic)
  const handleTrade = () => {
    // e.g. navigate or call trade function
    console.log(`${tradeMode} ${tradeAmount} ${tradeAsset.code}:${tradeAsset.issuer}`);
    setTradeModalOpen(false);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        ALL Tokens
      </Typography>

      <Box sx={{ mb: 2 }}>
        <TextField
          placeholder="Filter by code or issuer..."
          size="small"
          fullWidth
          value={filterText}
          onChange={(e) => {
            setFilterText(e.target.value);
            setPage(0);
          }}
          sx={{ backgroundColor: "#14232E", input: { color: "#FFF" } }}
        />
      </Box>

      <Paper sx={{ borderRadius: 2, overflow: "hidden" }}>
        <TableContainer sx={{ maxHeight: 600, bgcolor: "#14232E" }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: "#0E2429" }}>
                {[
                  "#",
                  "Token",
                  "Issuer",
                  "Balance",
                  "Buying Liab.",
                  "Selling Liab.",
                  "Actions",
                ].map((h, i) => (
                  <TableCell
                    key={i}
                    align={i === 0 ? "center" : "left"}
                    sx={{ color: "#FFF", fontWeight: "bold", py: 1.5, borderBottom: "none" }}
                  >
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {paged.map((asset, idx) => {
                const code = asset.asset_code || "DIAM";
                const issuer = asset.asset_issuer || "";
                const key = issuer ? `${code}:${issuer}` : "DIAM:";
                const tl = trustlines[key] || { balance:0, buying:0, selling:0 };
                return (
                  <TableRow
                    key={key}
                    sx={{
                      "&:nth-of-type(odd)": { bgcolor: "#0F1A20" },
                      "&:hover": { bgcolor: "#1A2A34" },
                    }}
                  >
                    <TableCell align="center" sx={{ color: "#CCC" }}>
                      {page * rowsPerPage + idx + 1}
                    </TableCell>
                    <TableCell sx={{ color: "#FFF" }}>{code}</TableCell>
                    <TableCell sx={{ color: "#FFF" }}>
                      {issuer ? (
                        <Tooltip title={issuer}>
                          <span>{truncate(issuer)}</span>
                        </Tooltip>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell sx={{ color: "#FFF" }}>{tl.balance.toFixed(7)}</TableCell>
                    <TableCell sx={{ color: "#FFF" }}>{tl.buying.toFixed(7)}</TableCell>
                    <TableCell sx={{ color: "#FFF" }}>{tl.selling.toFixed(7)}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => openTradeModal("buy", code, issuer)}
                        >
                          Buy
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => openTradeModal("sell", code, issuer)}
                        >
                          Sell
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={filtered.length}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => { setRowsPerPage(+e.target.value); setPage(0); }}
          rowsPerPageOptions={[5,10,25,50]}
          sx={{
            bgcolor: "#0E2429",
            ".MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows": { color: "#FFF" }
          }}
        />
      </Paper>

      <Dialog open={tradeModalOpen} onClose={() => setTradeModalOpen(false)}>
        <DialogTitle>{tradeMode === "buy" ? "Buy Asset" : "Sell Asset"}</DialogTitle>
        <DialogContent>
          <Typography variant="subtitle2" gutterBottom>
            {tradeAsset.code}{tradeAsset.issuer ? `:${tradeAsset.issuer}` : " (DIAM)"}
          </Typography>
          <TextField
            label="Amount"
            fullWidth
            variant="outlined"
            value={tradeAmount}
            onChange={(e) => setTradeAmount(e.target.value.replace(/[^0-9.]/g, ""))}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTradeModalOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleTrade} disabled={!tradeAmount}>
            {tradeMode === "buy" ? "Buy" : "Sell"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

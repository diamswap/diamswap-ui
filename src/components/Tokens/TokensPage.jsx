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

  // all on‐chain assets
  const [allAssets, setAllAssets] = useState([]);
  // user trustlines: { "CODE:ISSUER": { balance, buying, selling } }
  const [trustlines, setTrustlines] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // pagination & filter
  const [filterText, setFilterText] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // 1) Fetch up to 200 assets from Horizon
  useEffect(() => {
    setLoading(true);
    fetch(`${HORIZON_URL}/assets?limit=200`)
      .then((r) => r.json())
      .then((json) => {
        setAllAssets(json._embedded?.records || []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // 2) Fetch user's trustlines (balances & liabilities)
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
        // also include native DIAM
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

  // Filter & paginate
  const filtered = allAssets.filter((asset) => {
    // for native assets endpoint won't include native, so we insert DIAM separately
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

  if (loading) {
    return (
      <Box textAlign="center" mt={8}>
        <CircularProgress size={48} />
      </Box>
    );
  }
  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

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
          sx={{
            backgroundColor: "#14232E",
            input: { color: "#FFF" },
          }}
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
                ].map((h, i) => (
                  <TableCell
                    key={i}
                    align={i === 0 ? "center" : "left"}
                    sx={{
                      color: "#FFF",
                      fontWeight: "bold",
                      py: 1.5,
                      borderBottom: "none",
                    }}
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
                const tl = trustlines[key] || {
                  balance: 0,
                  buying: 0,
                  selling: 0,
                };

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
                    <TableCell sx={{ color: "#FFF" }}>
                      {tl.balance.toFixed(7)}
                    </TableCell>
                    <TableCell sx={{ color: "#FFF" }}>
                      {tl.buying.toFixed(7)}
                    </TableCell>
                    <TableCell sx={{ color: "#FFF" }}>
                      {tl.selling.toFixed(7)}
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
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[5, 10, 25, 50]}
          sx={{
            bgcolor: "#0E2429",
            ".MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows": {
              color: "#FFF",
            },
          }}
        />
      </Paper>
    </Container>
  );
}

// src/components/DiamanteDashboard.jsx
import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Container,
  Paper,
  Typography,
  CircularProgress,
  Divider,
  Card,
  CardContent,
  Tabs,
  Tab,
  Avatar,
  Grid,
  Collapse,
  IconButton,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TablePagination,
} from "@mui/material";
import { Aurora } from "diamnet-sdk";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}

const gradientText = {
  backgroundImage:
    "linear-gradient(270deg, rgb(15, 186, 209) 0%, rgb(255, 255, 255) 48.7783%, rgb(15, 186, 209) 100%)",
  backgroundClip: "text",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
};

export default function DiamanteDashboard() {
  const accountId = localStorage.getItem("diamPublicKey");
  const [loading, setLoading] = useState(true);
  const [accountData, setAccountData] = useState(null);
  const [claimableBalances, setClaimableBalances] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [operations, setOperations] = useState([]);
  const [offers, setOffers] = useState([]);
  const [selectedTab, setSelectedTab] = useState(0);
  const [showFullAccountData, setShowFullAccountData] = useState(false);
  const [txOps, setTxOps] = useState({});
  const [txPage, setTxPage] = useState(0);
  const [opPage, setOpPage] = useState(0);
  const [sellPage, setSellPage] = useState(0);
  const rowsPerPage = 10;

  const server = useMemo(
    () => new Aurora.Server("https://diamtestnet.diamcircle.io/"),
    []
  );

  const truncateHash = (h) =>
    h && h.length > 8 ? `${h.slice(0, 5)}...${h.slice(-8)}` : h;

  // 1) Load primary data
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const acct = await server.accounts().accountId(accountId).call();
        setAccountData(acct);

        const cb = await server
          .claimableBalances()
          .claimant(accountId)
          .call();
        setClaimableBalances(cb.records);

        const tx = await server
          .transactions()
          .forAccount(accountId)
          .limit(200)
          .order("desc")
          .call();
        setTransactions(tx.records);

        const op = await server
          .operations()
          .forAccount(accountId)
          .limit(200)
          .order("desc")
          .call();
        setOperations(op.records);

        const of = await server.offers().forAccount(accountId).call();
        setOffers(of.records);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    if (accountId) fetchData();
  }, [accountId, server]);

  // 2) Fetch per‐tx ops only on Transactions tab
  useEffect(() => {
    if (selectedTab !== 2) return;
    const start = txPage * rowsPerPage;
    const pageTxs = transactions.slice(start, start + rowsPerPage);
    pageTxs.forEach(async (tx) => {
      if (txOps[tx.id]) return;
      try {
        const resp = await server.operations().forTransaction(tx.hash).call();
        setTxOps((p) => ({ ...p, [tx.id]: resp.records }));
      } catch (e) {
        console.error(e);
      }
    });
  }, [selectedTab, txPage, transactions, server, txOps]);

  const handleTabChange = (_, v) => setSelectedTab(v);
  const toggleAccountDetails = () =>
    setShowFullAccountData((p) => !p);
  const handleTxPageChange = (_, p) => setTxPage(p);
  const handleOpPageChange = (_, p) => setOpPage(p);
  const handleSellPageChange = (_, p) => setSellPage(p);

  const getNativeBalance = () =>
    accountData?.balances.find((b) => b.asset_type === "native")?.balance ||
    "0";
  const getAccountSeq = () => accountData?.sequence || "N/A";

  const sellOffers = useMemo(
    () => offers.filter((o) => o.selling.asset_type === "native"),
    [offers]
  );

  const pagedTxs = transactions.slice(
    txPage * rowsPerPage,
    txPage * rowsPerPage + rowsPerPage
  );
  const pagedOps = operations.slice(
    opPage * rowsPerPage,
    opPage * rowsPerPage + rowsPerPage
  );
  const pagedSell = sellOffers.slice(
    sellPage * rowsPerPage,
    sellPage * rowsPerPage + rowsPerPage
  );

  if (loading)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <CircularProgress sx={{ color: "rgba(15,186,209,0.7)" }} />
      </Box>
    );

  return (
    <Container maxWidth="lg" sx={{ mt: 4, pb: 4 }}>
      <Paper
        elevation={4}
        sx={{ backgroundColor: "transparent", color: "#fff", p: 3, borderRadius: 2 }}
      >
        {/* — Account Card — */}
        <Card
          sx={{
            backgroundColor: "transparent",
            mb: 3,
            borderRadius: 2,
            border: "1px solid #333",
          }}
        >
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item>
                <Avatar sx={{ width: 64, height: 64, bgcolor: "#333" }}>
                  {accountId?.[0] ?? "?"}
                </Avatar>
              </Grid>
              <Grid item xs>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: "bold", wordBreak: "break-all" }}
                >
                  {accountId}
                </Typography>
                <Typography variant="body1" sx={{ mt: 1 }}>
                  <strong>Native Balance:</strong> {getNativeBalance()} DIAM
                </Typography>
                <Typography variant="body2">
                  <strong>Sequence:</strong> {getAccountSeq()}
                </Typography>
                <Typography
                  component="a"
                  href={`https://testnetexplorer.diamante.io/about-account/${accountId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    ...gradientText,
                    textDecoration: "underline",
                    display: "inline-block",
                    mt: 1,
                  }}
                >
                  View on Explorer
                </Typography>
              </Grid>
              <Grid item>
                <IconButton onClick={toggleAccountDetails} sx={{ color: "#fff" }}>
                  {showFullAccountData ? <FiChevronUp /> : <FiChevronDown />}
                </IconButton>
              </Grid>
            </Grid>

            <Collapse in={showFullAccountData} timeout="auto" unmountOnExit>
              <Box
                sx={{
                  backgroundColor: "#001518",
                  p: 2,
                  borderRadius: 1,
                  mt: 2,
                }}
              >
                <Typography sx={{ mb: 1 }}>
                  <strong>Account ID:</strong> {accountData.id}
                </Typography>
                <Typography sx={{ mb: 1 }}>
                  <strong>Sequence:</strong> {accountData.sequence}
                </Typography>
                <Typography sx={{ mb: 1 }}>
                  <strong>Subentry Count:</strong> {accountData.subentry_count}
                </Typography>
                <Typography sx={{ mb: 1 }}>
                  <strong>Native Balance:</strong> {getNativeBalance()} DIAM
                </Typography>
              </Box>
            </Collapse>
          </CardContent>
        </Card>

        <Divider sx={{ mb: 2, borderColor: "#444" }} />

        {/* — Tabs — */}
        <Tabs
          value={selectedTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          textColor="inherit"
          indicatorColor="primary"
          sx={{ mb: 2 }}
        >
          <Tab label="Account Info" />
          <Tab label="Claimable Balances" />
          <Tab label="Transactions" />
          <Tab label="Operations" />
          <Tab label="Sell Offers" />
        </Tabs>

        {/* Account Info */}
        <TabPanel value={selectedTab} index={0}>
          <Card
            sx={{
              backgroundColor: "transparent",
              borderRadius: 2,
              border: "1px solid #333",
            }}
          >
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Account Info
              </Typography>
              <Typography sx={{ mb: 1 }}>
                <strong>Account ID:</strong> {accountData.id}
              </Typography>
              <Typography sx={{ mb: 1 }}>
                <strong>Sequence:</strong> {accountData.sequence}
              </Typography>
              <Typography sx={{ mb: 1 }}>
                <strong>Subentry Count:</strong> {accountData.subentry_count}
              </Typography>
              <Typography sx={{ mb: 1 }}>
                <strong>Native Balance:</strong> {getNativeBalance()} DIAM
              </Typography>
            </CardContent>
          </Card>
        </TabPanel>

        {/* Claimable Balances */}
        <TabPanel value={selectedTab} index={1}>
          <Typography variant="h6" gutterBottom>
            Claimable Balances
          </Typography>
          {claimableBalances.length ? (
            claimableBalances.map((bal, i) => (
              <Card
                key={bal.id}
                sx={{
                  backgroundColor: "transparent",
                  borderRadius: 2,
                  border: "1px solid #333",
                  mb: 1,
                }}
              >
                <CardContent>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {i + 1}. Balance ID: {bal.id}
                  </Typography>
                  <Typography variant="body2">
                    Amount: {bal.amount} | Asset: {bal.asset_code || "native"}
                  </Typography>
                </CardContent>
              </Card>
            ))
          ) : (
            <Typography>No claimable balances found.</Typography>
          )}
        </TabPanel>

        {/* Transactions */}
        <TabPanel value={selectedTab} index={2}>
          <Typography variant="h6" gutterBottom>
            Transactions
          </Typography>
          {transactions.length === 0 ? (
            <Typography>No transactions found.</Typography>
          ) : (
            <>
              <Table sx={{ border: "1px solid #333" }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: "#fff" }}>#</TableCell>
                    <TableCell sx={{ color: "#fff" }}>From</TableCell>
                    <TableCell sx={{ color: "#fff" }}>Hash</TableCell>
                    <TableCell sx={{ color: "#fff" }}>Type</TableCell>
                    <TableCell sx={{ color: "#fff" }}>Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pagedTxs.flatMap((tx, idx) => {
                    const globalIndex = txPage * rowsPerPage + idx + 1;
                    const ops = txOps[tx.id] || [];
                    if (!ops.length) {
                      return (
                        <TableRow key={tx.id}>
                          <TableCell sx={{ color: "#fff" }}>{globalIndex}</TableCell>
                          <TableCell sx={{ color: "#fff" }}>
                            {tx.source_account}
                          </TableCell>
                          <TableCell sx={{ color: "#fff" }}>
                            <a
                              href={`https://testnetexplorer.diamante.io/about-tx-hash/${tx.hash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                ...gradientText,
                                textDecoration: "underline",
                              }}
                            >
                              {truncateHash(tx.hash)}
                            </a>
                          </TableCell>
                          <TableCell sx={{ color: "#fff" }} colSpan={2}>
                            No operations found
                          </TableCell>
                        </TableRow>
                      );
                    }
                    return ops.map((op) => {
                      let amount = "N/A";
                      if (op.type === "create_account") amount = op.starting_balance;
                      if (op.type === "payment") amount = op.amount;
                      if (op.type === "manage_sell_offer") amount = op.amount || "N/A";
                      return (
                        <TableRow key={op.id} hover>
                          <TableCell sx={{ color: "#fff" }}>{globalIndex}</TableCell>
                          <TableCell sx={{ color: "#fff" }}>
                            {truncateHash(tx.source_account)}
                          </TableCell>
                          <TableCell sx={{ color: "#fff" }}>
                            <a
                              href={`https://testnetexplorer.diamante.io/about-tx-hash/${tx.hash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                ...gradientText,
                                textDecoration: "underline",
                              }}
                            >
                              {truncateHash(tx.hash)}
                            </a>
                          </TableCell>
                          <TableCell sx={{ color: "#fff" }}>{op.type}</TableCell>
                          <TableCell sx={{ color: "#fff" }}>{amount}</TableCell>
                        </TableRow>
                      );
                    });
                  })}
                </TableBody>
              </Table>
              <TablePagination
                component="div"
                count={transactions.length}
                page={txPage}
                onPageChange={handleTxPageChange}
                rowsPerPage={rowsPerPage}
                rowsPerPageOptions={[]}
                sx={{ color: "#fff", mt: 1 }}
              />
            </>
          )}
        </TabPanel>

        {/* Operations */}
        <TabPanel value={selectedTab} index={3}>
          <Typography variant="h6" gutterBottom>
            Operations
          </Typography>
          {operations.length ? (
            <>
              <Table sx={{ border: "1px solid #333" }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>#</TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>Type</TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>ID</TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>Created</TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>Transaction</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pagedOps.map((op, idx) => {
                    const globalIndex = opPage * rowsPerPage + idx + 1;
                    return (
                      <TableRow key={op.id} hover>
                        <TableCell sx={{ color: "#fff" }}>{globalIndex}</TableCell>
                        <TableCell sx={{ color: "#fff" }}>{op.type}</TableCell>
                        <TableCell sx={{ color: "#fff" }}>{op.id}</TableCell>
                        <TableCell sx={{ color: "#fff" }}>
                          {new Date(op.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell sx={{ color: "#fff" }}>
                          {op.transaction_hash ? (
                            <a
                              href={`https://testnetexplorer.diamante.io/about-tx-hash/${op.transaction_hash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                ...gradientText,
                                textDecoration: "underline",
                              }}
                            >
                              {truncateHash(op.transaction_hash)}
                            </a>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <TablePagination
                component="div"
                count={operations.length}
                page={opPage}
                onPageChange={handleOpPageChange}
                rowsPerPage={rowsPerPage}
                rowsPerPageOptions={[]}
                sx={{ color: "#fff", mt: 1 }}
              />
            </>
          ) : (
            <Typography>No operations found.</Typography>
          )}
        </TabPanel>

        {/* Sell Offers */}
        <TabPanel value={selectedTab} index={4}>
          <Typography variant="h6" gutterBottom>
            Sell Offers (selling DIAM)
          </Typography>
          {sellOffers.length ? (
            <>
              <Table sx={{ border: "1px solid #333" }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>#</TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>Offer ID</TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>Selling</TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>Buying</TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>Amount</TableCell>
                    <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>Price</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pagedSell.map((o, idx) => {
                    const globalIndex = sellPage * rowsPerPage + idx + 1;
                    return (
                      <TableRow key={o.id} hover>
                        <TableCell sx={{ color: "#fff" }}>{globalIndex}</TableCell>
                        <TableCell sx={{ color: "#fff" }}>{o.id}</TableCell>
                        <TableCell sx={{ color: "#fff" }}>DIAM</TableCell>
                        <TableCell sx={{ color: "#fff" }}>
                          {o.buying.asset_code || "XLM"}
                        </TableCell>
                        <TableCell sx={{ color: "#fff" }}>{o.amount}</TableCell>
                        <TableCell sx={{ color: "#fff" }}>{o.price}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <TablePagination
                component="div"
                count={sellOffers.length}
                page={sellPage}
                onPageChange={handleSellPageChange}
                rowsPerPage={rowsPerPage}
                rowsPerPageOptions={[]}
                sx={{ color: "#fff", mt: 1 }}
              />
            </>
          ) : (
            <Typography>No sell offers found.</Typography>
          )}
        </TabPanel>
      </Paper>
    </Container>
  );
}

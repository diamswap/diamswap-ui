// src/components/SwapPage.jsx
import React, { useState, useEffect } from "react";
import {
  Asset,
  Aurora,
  Operation,
  TransactionBuilder,
  BASE_FEE,
  LiquidityPoolAsset,
} from "diamnet-sdk";
import { Buffer } from "buffer";
import {
  Container,
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  CircularProgress,
  MenuItem,
  Select,
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItemButton,
  ListItemText,
  InputAdornment,
  IconButton,
  useMediaQuery,
  ListItemIcon,
  Avatar,
} from "@mui/material";
import { styled, useTheme } from "@mui/material/styles";
import CustomButton from "../../comman/CustomButton";
import TransactionModal from "../../comman/TransactionModal";
import { PinataSDK } from "pinata-web3";
import { IoCloseCircleOutline, IoSearch } from "react-icons/io5";
import swap from "../../assets/swap.png";

// Polyfill Buffer for browser support
if (!window.Buffer) {
  window.Buffer = Buffer;
}

// ---------------------------------------------
// Configuration & Setup
// ---------------------------------------------
const NETWORK_PASSPHRASE = "Diamante Testnet 2024";
const friendbotUrl = "https://friendbot.diamcircle.io?addr=";
const server = new Aurora.Server("https://diamtestnet.diamcircle.io/");
const PINATA_JWT = import.meta.env.VITE_PINATA_JWT;

// Retrieve the user's wallet public key from localStorage.
const walletPublicKey = localStorage.getItem("diamPublicKey") || "";

// Fallback issuer for TradeToken
const realIssuerPubKey =
  "GBCELHKB7SGUWXYW5S3NGYITDBUXBLV26UT2XAGETMLBWUFFBMI4U2GA";
const fallbackTradeToken = new Asset("TradeToken", realIssuerPubKey);

// Initialize PinataSDK
const pinata = new PinataSDK({
  pinataJwt: import.meta.env.VITE_PINATA_JWT,
  pinataGateway:
    import.meta.env.VITE_GATEWAY_URL || "https://gateway.pinata.cloud",
});

// ---------------------------------------------
// Helper Functions (dynamic token extraction)
// ---------------------------------------------
function extractTokenCode(assetStr) {
  if (assetStr === "native") return "DIAM";
  const parts = assetStr.split(":");
  return parts[0] || assetStr;
}

function getAvailableTokens(liquidityPools) {
  const tokenSet = new Set();
  liquidityPools.forEach((pool) => {
    pool.reserves.forEach((reserve) => {
      tokenSet.add(extractTokenCode(reserve.asset));
    });
  });
  return Array.from(tokenSet);
}

function getPoolForPair(fromToken, toToken, liquidityPools) {
  return liquidityPools.find((pool) => {
    const hasFrom = pool.reserves.some(
      (r) => extractTokenCode(r.asset) === fromToken
    );
    const hasTo = pool.reserves.some(
      (r) => extractTokenCode(r.asset) === toToken
    );
    return hasFrom && hasTo;
  });
}

// ---------------------------------------------
// Original Helper Functions (unchanged)
// ---------------------------------------------
async function updateTransactionHistory(transactionData) {
  try {
    const response = await fetch(
      "https://api.pinata.cloud/pinning/pinJSONToIPFS",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${PINATA_JWT}`,
        },
        body: JSON.stringify({ pinataContent: transactionData }),
      }
    );
    const result = await response.json();
    console.log("Pinned transaction data:", result);
    const history = JSON.parse(localStorage.getItem("txHistory") || "[]");
    history.push({ ...transactionData, ipfsHash: result.IpfsHash });
    localStorage.setItem("txHistory", JSON.stringify(history));
    return result;
  } catch (error) {
    console.error("Error pinning transaction data:", error);
  }
}

const friendbotFund = async (publicKey) => {
  try {
    const resp = await fetch(`${friendbotUrl}${publicKey}`);
    if (!resp.ok) {
      if (resp.status === 400) {
        const errData = await resp.json();
        if (
          errData?.detail &&
          errData.detail.includes("createAccountAlreadyExist")
        ) {
          console.log("Account already exists. Proceeding...");
          return;
        } else {
          throw new Error(errData.detail || resp.statusText);
        }
      } else {
        throw new Error(resp.statusText);
      }
    }
    console.log(`Friendbot funded account: ${publicKey}`);
  } catch (error) {
    console.error("Friendbot funding error:", error);
    throw error;
  }
};

const establishUserTrustline = async (asset, walletPublicKey) => {
  if (!walletPublicKey) {
    throw new Error("Wallet not connected. Please connect your wallet.");
  }
  const userAccount = await server.loadAccount(walletPublicKey);
  const trustTx = new TransactionBuilder(userAccount, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      Operation.changeTrust({
        asset,
        limit: "1000000",
      })
    )
    .setTimeout(30)
    .build();
  console.log("Trustline XDR:", trustTx.toXDR());
  const trustResult = await window.diam.sign(
    trustTx.toXDR(),
    true,
    NETWORK_PASSPHRASE
  );
  console.log("Trustline sign response:", trustResult);
  const response = await server.submitTransaction(trustTx);
  console.log("Trustline established. Tx Hash:", response.hash);
  return response.hash;
};

function getDynamicTradeTokenIssuer(accountData, threshold = 1) {
  console.log("Determining dynamic TradeToken issuer...");
  if (!accountData || !accountData.balances) return null;
  const qualifyingTokens = accountData.balances.filter((bal) => {
    if (bal.asset_code === "TradeToken") {
      const balance = parseFloat(bal.balance);
      const buyingLiabilities = parseFloat(bal.buying_liabilities || "0");
      return balance > threshold && buyingLiabilities <= 0;
    }
    return false;
  });
  if (qualifyingTokens.length === 0) return null;
  qualifyingTokens.sort(
    (a, b) => parseFloat(b.balance) - parseFloat(a.balance)
  );
  const selectedIssuer = qualifyingTokens[0].asset_issuer;
  return selectedIssuer;
}

const getAssetObject = (assetName, dynamicIssuer = null) => {
  if (assetName === "DIAM") {
    return Asset.native();
  } else if (assetName === "TradeToken") {
    return fallbackTradeToken;
  }
  // If an asset is not recognized (e.g. test0011) throw an error.
  throw new Error(`Unknown asset: ${assetName}`);
};

const doStrictSendSwap = async (
  walletPublicKey,
  fromAsset,
  toAsset,
  sendAmount,
  destMin,
  dynamicIssuer = null
) => {
  const userAccount = await server.loadAccount(walletPublicKey);
  const swapTx = new TransactionBuilder(userAccount, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      Operation.pathPaymentStrictSend({
        sendAsset: getAssetObject(fromAsset, dynamicIssuer),
        sendAmount,
        destination: walletPublicKey,
        destAsset: getAssetObject(toAsset, dynamicIssuer),
        destMin,
        path: [],
      })
    )
    .setTimeout(300)
    .build();
  if (!window.diam || typeof window.diam.sign !== "function") {
    throw new Error("DIAM Wallet extension not available for signing.");
  }
  const signResult = await window.diam.sign(
    swapTx.toXDR(),
    true,
    NETWORK_PASSPHRASE
  );
  if (
    signResult &&
    signResult.message &&
    signResult.message.extras &&
    signResult.message.extras.result_codes &&
    Array.isArray(signResult.message.extras.result_codes.operations) &&
    signResult.message.extras.result_codes.operations.includes(
      "op_too_few_offers"
    )
  ) {
    console.warn("Received 'op_too_few_offers', insufficient liquidity.");
    return "N/A";
  }
  let finalHash = signResult.hash;
  if (!finalHash && signResult.message?.data?.hash) {
    finalHash = signResult.message.data.hash;
  }
  return finalHash || null;
};

const doStrictReceiveSwap = async (
  walletPublicKey,
  fromAsset,
  toAsset,
  sendMax,
  destAmount,
  dynamicIssuer = null
) => {
  const userAccount = await server.loadAccount(walletPublicKey);
  const swapTx = new TransactionBuilder(userAccount, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      Operation.pathPaymentStrictReceive({
        sendAsset: getAssetObject(fromAsset, dynamicIssuer),
        sendMax,
        destination: walletPublicKey,
        destAsset: getAssetObject(toAsset, dynamicIssuer),
        destAmount,
        path: [],
      })
    )
    .setTimeout(300)
    .build();
  if (!window.diam || typeof window.diam.sign !== "function") {
    throw new Error("DIAM Wallet extension not available for signing.");
  }
  const signResult = await window.diam.sign(
    swapTx.toXDR(),
    true,
    NETWORK_PASSPHRASE
  );
  let finalHash = signResult.hash;
  if (!finalHash && signResult.message?.data?.hash) {
    finalHash = signResult.message.data.hash;
  }
  return finalHash || null;
};

// ---------------------------------------------
// A simple token selector modal with search
// ---------------------------------------------
function TokenSelectModal({
  open,
  onClose,
  tokens,
  onSelectToken,
  title = "Select a token",
}) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTokens = tokens.filter((tk) =>
    tk.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (token) => {
    onSelectToken(token);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <Box
        sx={{
          backgroundColor: "#000",
          padding: "16px",
          borderRadius: "8px",
          width: "350px",
          maxHeight: "70vh",
          overflowY: "auto",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
          position: "relative",
          border: "1px solid gray",
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": {
            display: "none",
          },
        }}
      >
        <DialogTitle sx={{ color: "#fff" }}>
          {title}
          <IconButton
            aria-label="close"
            onClick={onClose}
            sx={{
              position: "absolute",
              right: 8,
              top: 8,
              color: "#aaa",
            }}
          >
            <IoCloseCircleOutline />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ bgcolor: "#000", color: "#fff", pb: 2 }}>
          <Box sx={{ display: "flex", mb: 2 }}>
            <TextField
              placeholder="Token name or address"
              fullWidth
              size="small"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{
                "& .MuiInputBase-root": {
                  color: "white",
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  borderRadius: "12px",
                },
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IoSearch style={{ color: "gray" }} />
                  </InputAdornment>
                ),
              }}
            />
          </Box>
          <List
            sx={{
              maxHeight: 300,
              overflowY: "auto",
              scrollbarWidth: "none",
              "&::-webkit-scrollbar": {
                display: "none",
              },
            }}
          >
            {filteredTokens.map((tk) => (
              <ListItemButton
                key={tk}
                sx={{
                  borderRadius: "12px",
                  "&:hover": {
                    bgcolor: "rgba(255, 255, 255, 0.1)",
                  },
                }}
                onClick={() => handleSelect(tk)}
              >
                <ListItemIcon sx={{ color: "white" }}>
                  <Avatar sx={{ width: 29, height: 29 }} />
                </ListItemIcon>
                <ListItemText
                  primary={tk}
                  sx={{ color: "#fff", textTransform: "uppercase" }}
                />
              </ListItemButton>
            ))}
            {filteredTokens.length === 0 && (
              <Typography
                variant="body2"
                sx={{ color: "#bbb", textAlign: "center", mt: 2 }}
              >
                No matching tokens
              </Typography>
            )}
          </List>
        </DialogContent>
      </Box>
    </Dialog>
  );
}

// ---------------------------------------------
// SwapPage Component - UI that looks like your screenshot
// ---------------------------------------------
export default function SwapPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // State to hold user account data for balance checking.
  const [userAccountData, setUserAccountData] = useState(null);

  // Swap inputs and transaction states.
  const [fromAsset, setFromAsset] = useState("DIAM");
  const [toAsset, setToAsset] = useState("TradeToken");
  const [sendAmount, setSendAmount] = useState("");
  const [txStatus, setTxStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState("");
  const [transactionMessage, setTransactionMessage] = useState("");
  const [transactionHash, setTransactionHash] = useState("");

  // State for dynamic TradeToken issuer.
  const [dynamicIssuer, setDynamicIssuer] = useState(null);

  // Liquidity pool and token list.
  const [liquidityPools, setLiquidityPools] = useState([]);
  const [availableTokens, setAvailableTokens] = useState([]);

  // State for token selection modal.
  const [selectTokenModalOpen, setSelectTokenModalOpen] = useState(false);
  const [activeSide, setActiveSide] = useState("from"); // "from" or "to"

  // ---------------------------------------------
  // Fetch liquidity pool & user account data on mount.
  // ---------------------------------------------
  useEffect(() => {
    async function init() {
      try {
        const resp = await fetch(
          "https://diamtestnet.diamcircle.io/liquidity_pools/?limit=100"
        );
        const data = await resp.json();
        console.log("dataToke", data)
        setLiquidityPools(data._embedded.records);
        const tokens = getAvailableTokens(data._embedded.records);
        setAvailableTokens(tokens);
      } catch (e) {
        console.error("Error fetching liquidity pools:", e);
      }

      if (walletPublicKey) {
        try {
          const account = await server
            .accounts()
            .accountId(walletPublicKey)
            .call();
          setUserAccountData(account);
          const issuer = getDynamicTradeTokenIssuer(account, 1);
          setDynamicIssuer(issuer);
        } catch (err) {
          console.error("Error loading user account:", err);
        }
      }
    }
    init();
  }, []);

  // ---------------------------------------------
  // Helper for balance check: returns true if user has sufficient balance for a given token and amount.
  // ---------------------------------------------
  const checkSufficientBalance = (token, amount) => {
    if (!userAccountData || !amount) return false;
    const balanceEntry = userAccountData.balances.find((entry) => {
      if (token === "DIAM") {
        return entry.asset_type === "native";
      }
      return entry.asset_code === token;
    });
    if (!balanceEntry) return false;
    return parseFloat(balanceEntry.balance) >= parseFloat(amount);
  };

  // ---------------------------------------------
  // Calculation: Estimated Received Amount
  // ---------------------------------------------
  const calcEstimatedReceived = () => {
    if (!sendAmount) return "";
    const pool = getPoolForPair(fromAsset, toAsset, liquidityPools);
    if (!pool) return "";
    let inReserve, outReserve;
    pool.reserves.forEach((reserve) => {
      const token = extractTokenCode(reserve.asset);
      if (token === fromAsset) {
        inReserve = parseFloat(reserve.amount);
      } else if (token === toAsset) {
        outReserve = parseFloat(reserve.amount);
      }
    });
    if (!inReserve || !outReserve) return "";
    const feeBP = parseFloat(pool.fee_bp);
    const feeRate = feeBP / 10000;
    const effectiveSend = parseFloat(sendAmount) * (1 - feeRate);
    const dy = (outReserve * effectiveSend) / (inReserve + effectiveSend);
    return dy.toFixed(4);
  };
  const estimatedReceived = calcEstimatedReceived();

  // Compute ratio: "1 fromAsset = X toAsset"
  const computedRatio = () => {
    if (!sendAmount || !estimatedReceived) return "NaN";
    const sendAmt = parseFloat(sendAmount);
    const recvAmt = parseFloat(estimatedReceived);
    if (sendAmt > 0 && recvAmt > 0) {
      return (recvAmt / sendAmt).toFixed(4);
    }
    return "NaN";
  };
  const ratioValue = computedRatio();

  // ---------------------------------------------
  // Handlers for token selection modal
  // ---------------------------------------------
  const openSelectTokenModal = (side) => {
    setActiveSide(side);
    setSelectTokenModalOpen(true);
  };
  const handleSelectToken = (token) => {
    if (activeSide === "from") {
      setFromAsset(token);
    } else {
      setToAsset(token);
    }
  };

  // ---------------------------------------------
  // Swap Handler with asset and balance checks
  // ---------------------------------------------
  const handleSwap = async () => {
    // Pre-swap check: is the selected fromAsset among available tokens?
    if (!availableTokens.includes(fromAsset)) {
      setTxStatus(`Error: Asset ${fromAsset} is not available.`);
      setTransactionStatus("error");
      setTransactionMessage(
        `Asset ${fromAsset} is not available in your liquidity pool or wallet.`
      );
      return;
    }
    // Pre-swap check: does the user have sufficient balance for the 'from' asset?
    if (!checkSufficientBalance(fromAsset, sendAmount)) {
      setTxStatus(`Error: Insufficient balance for ${fromAsset}.`);
      setTransactionStatus("error");
      setTransactionMessage(
        `You do not have sufficient balance for ${fromAsset}.`
      );
      return;
    }

    setLoading(true);
    setTxStatus("Starting swap...");
    setModalOpen(true);
    setTransactionStatus("pending");
    setTransactionMessage("Processing strict send swap...");

    try {
      // For TradeToken, establish trustline if needed.
      if (fromAsset === "TradeToken" || toAsset === "TradeToken") {
        setTransactionMessage("Establishing trustline for TradeToken...");
        await establishUserTrustline(
          getAssetObject("TradeToken", dynamicIssuer),
          walletPublicKey
        );
      }

      setTransactionMessage("Funding wallet via Friendbot...");
      await friendbotFund(walletPublicKey);

      // Slippage tolerance
      const slippageTolerance = 0.95;
      const safeSendAmount =
        sendAmount && parseFloat(sendAmount) > 0
          ? parseFloat(sendAmount).toFixed(7)
          : "1.0000000";
      const safeEstRecv = estimatedReceived ? parseFloat(estimatedReceived) : 0;
      const safeDestMin =
        safeEstRecv > 0
          ? (safeEstRecv * slippageTolerance).toFixed(7)
          : "0.0100000";

      const swapHash = await doStrictSendSwap(
        walletPublicKey,
        fromAsset,
        toAsset,
        safeSendAmount,
        safeDestMin,
        dynamicIssuer
      );
      const finalHash = swapHash || "N/A";

      setTxStatus(`Transaction successful! Hash: ${finalHash}`);
      setTransactionStatus("success");
      setTransactionMessage("Swap completed successfully!");
      setTransactionHash(finalHash);

      const transactionData = {
        txHash: finalHash,
        fromAsset,
        toAsset,
        sendAmount,
        estimatedReceived,
        timestamp: new Date().toISOString(),
      };
      await updateTransactionHistory(transactionData);
    } catch (error) {
      // If error message contains "Unknown asset", replace with a custom error message.
      let errorMsg = error.message;
      if (errorMsg.includes("Unknown asset")) {
        errorMsg = `Error: You do not have this asset (${fromAsset}) in your wallet.`;
      }
      setTxStatus(errorMsg);
      setTransactionStatus("error");
      setTransactionMessage(errorMsg);
      console.error("Swap error:", error);
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------
  // Render UI: Keep the same UI as before
  // ---------------------------------------------
  return (
    <Box sx={{ bgcolor: "#000", minHeight: "100vh" }}>
      <Card
        sx={{
          width: isMobile ? "100%" : "500px",
          backgroundColor: "rgba(0, 206, 229, 0.1)",
          margin: "2rem auto",
          borderRadius: "16px",
          border: "1px solid rgb(77, 77, 77)",
          padding: "2rem",
          color: "#FFFFFF",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <CardContent>
          {/* PAY (from) */}
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Pay
          </Typography>
          <Box
            sx={{
              backgroundColor: "rgba(255,255,255,0.05)",
              borderRadius: 2,
              p: 2,
              mb: 3,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <TextField
              variant="standard"
              placeholder="0"
              value={sendAmount}
              onChange={(e) =>
                setSendAmount(e.target.value.replace(/[^0-9.]/g, ""))
              }
              InputProps={{
                disableUnderline: true,
                style: { fontSize: "1.25rem", color: "#fff", width: "100px" },
              }}
              sx={{ mr: 2 }}
            />
            <Box
              onClick={() => openSelectTokenModal("from")}
              sx={{
                backgroundColor: "#142c41",
                borderRadius: 2,
                px: 2,
                py: 1,
                cursor: "pointer",
                userSelect: "none",
                display: "flex",
                alignItems: "center",
              }}
            >
              <Typography sx={{ fontWeight: "bold", mr: 1 }}>
                {fromAsset}
              </Typography>
              <img
                src="data:image/svg+xml,%3Csvg width='12' height='12' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M3 4l3 3 3-3' fill='%23fff'/%3E%3C/svg%3E"
                alt="down arrow"
                style={{ width: 12, height: 12 }}
              />
            </Box>
          </Box>

          <Box
            sx={{
              position: "absolute",
              top: "38%",
              left: "45%",
              transform: "translate(-50%, -50%)",
              zIndex: 1000,
              cursor: "pointer",
            }}
          >
            <IconButton onClick={() => {}}>
              <img src={swap} style={{ height: "2.5rem" }} alt="Swap" />
            </IconButton>
          </Box>
          {/* RECEIVE (to) */}
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Receive
          </Typography>
          <Box
            sx={{
              backgroundColor: "rgba(255,255,255,0.05)",
              borderRadius: 2,
              p: 2,
              mb: 3,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <TextField
              variant="standard"
              placeholder="0"
              value={estimatedReceived}
              InputProps={{
                readOnly: true,
                disableUnderline: true,
                style: { fontSize: "1.25rem", color: "#fff", width: "100px" },
              }}
              sx={{ mr: 2 }}
            />
            <Box
              onClick={() => openSelectTokenModal("to")}
              sx={{
                backgroundColor: "#142c41",
                borderRadius: 2,
                px: 2,
                py: 1,
                cursor: "pointer",
                userSelect: "none",
                display: "flex",
                alignItems: "center",
              }}
            >
              <Typography sx={{ fontWeight: "bold", mr: 1 }}>
                {toAsset}
              </Typography>
              <img
                src="data:image/svg+xml,%3Csvg width='12' height='12' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M3 4l3 3 3-3' fill='%23fff'/%3E%3C/svg%3E"
                alt="down arrow"
                style={{ width: 12, height: 12 }}
              />
            </Box>
          </Box>

          {/* Ratio Display */}
          <Typography variant="body2" sx={{ mb: 3, color: "#ccc" }}>
            1 {fromAsset} = {ratioValue} {toAsset}
          </Typography>

          {/* Swap Button */}
          <Box sx={{ textAlign: "center" }}>
            <CustomButton
              variant="contained"
              onClick={handleSwap}
              disabled={loading || !walletPublicKey}
            >
              {loading ? <CircularProgress size={24} /> : "Swap"}
            </CustomButton>
          </Box>

          {/* Transaction Status */}

          {txStatus && (
            <Typography
              sx={{
                display: "block",
                textAlign: "center",
                mt: 2,
                color:
                  transactionStatus === "success"
                    ? "success.main"
                    : transactionStatus === "error"
                    ? "error.main"
                    : "#fff",
              }}
            >
              {txStatus}
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Transaction Modal */}
      <TransactionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        status={transactionStatus}
        message={transactionMessage}
        transactionHash={transactionHash}
      />

      {/* Token Selection Modal */}
      <TokenSelectModal
        open={selectTokenModalOpen}
        onClose={() => setSelectTokenModalOpen(false)}
        tokens={availableTokens}
        onSelectToken={handleSelectToken}
      />
    </Box>
  );
}

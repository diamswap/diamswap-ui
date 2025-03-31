import { useState } from "react";
import {
  Box,
  Button,
  Card,
  Container,
  Grid,
  Stack,
  TextField,
  Typography,
  styled,
  Modal,
  Avatar,
  FormControl,
  IconButton,
  useMediaQuery,
} from "@mui/material";
import { IoIosArrowDown, IoIosRemove, IoIosSearch } from "react-icons/io";
import usdtImage from "../../assets/USDT.png";
import ethImage from "../../assets/ETH.png";
import usdcImage from "../../assets/USDC.png";
import { MdOutlineSwapVert } from "react-icons/md";
import { FaPlus } from "react-icons/fa6";
import { useTheme } from "@emotion/react";
import CustomButton from "../../comman/CustomButton";

// Custom styled components
const DarkCard = styled(Card)(({ theme }) => ({
  backgroundColor: "#000",
  color: "white",
  padding: theme.spacing(3),
}));

const CustomTextField = styled(TextField)(({ theme }) => ({
  "& .MuiOutlinedInput-root": {
    backgroundColor: "#000",
    color: "white",
    "& fieldset": {
      borderColor: "#000",
    },
    "&:hover fieldset": {
      borderColor: "#000",
    },
  },
  "& .MuiInputLabel-root": {
    color: "#B2BAC2",
  },
}));

const TokenButton = styled(Button)(({ theme }) => ({
  backgroundColor: "#0A020A",
  color: "white",
  padding: "8px 16px",
  borderRadius: 8,
  "&:hover": {
    backgroundColor: "#000",
    borderRadius: 8,
  },
}));

const DarkTextField = styled(TextField)(({ theme }) => ({
  "& .MuiOutlinedInput-root": {
    backgroundColor: "rgba(0, 206, 229, 0.06)",
    color: "white",
    "& fieldset": {
      borderColor: "rgba(0, 206, 229, 0.06)",
    },
    "&:hover fieldset": {
      borderColor: "#2977C9",
    },
    "& input": {
      textAlign: "center",
      fontSize: "14px",
      padding: "10px",
    },
  },
  "& .MuiInputLabel-root": {
    color: "rgba(0, 206, 229, 0.06)",
  },
}));

// Token selection modal component
const TokenSelectionModal = ({ open, onClose, tokenData, onSelectToken }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));



  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          backgroundColor: "#06030A",
          borderRadius: "16px",
          width:  isMobile ? "100%" :"420px",
          padding: "1.5rem",
          boxShadow: "0px 8px 32px rgba(0, 0, 0, 0.4)",
          border: "1px solid #333333",
        }}
      >
        <Typography
          variant="h6"
          sx={{
            color: "#E0E0E0",
            fontWeight: "bold",
            marginBottom: "1rem",
            textAlign: "center",
          }}
        >
          Select Token
        </Typography>
        <TextField
          fullWidth
          placeholder="Search token..."
          onChange={(e) => setSearchQuery(e.target.value.toLowerCase())}
          sx={{
            marginBottom: "1rem",
            "& .MuiOutlinedInput-root": {
              backgroundColor: "black",
              borderRadius: "24px",
              color: "#FFFFFF",
            },
            "& .MuiOutlinedInput-input": {
              paddingLeft: "2rem",
            },
          }}
          InputProps={{
            startAdornment: (
              <Box sx={{ position: "absolute" }}>
                <IoIosSearch style={{ color: "#888888", fontSize: 25 }} />
              </Box>
            ),
          }}
        />
        <Box sx={{ maxHeight: "300px", overflowY: "auto" }}>
          {tokenData
            .filter((token) =>
              token.name.toLowerCase().includes(searchQuery || "")
            )
            .map((token) => (
              <Box
                key={token.name}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  padding: "0.75rem",
                  cursor: "pointer",
                  backgroundColor: "black",
                  borderRadius: "24px",
                  marginBottom: "0.5rem",
                  transition: "background-color 0.2s",
                  "&:hover": {
                    backgroundColor: "#040F25",
                  },
                }}
                onClick={() => onSelectToken(token)}
              >
                <Avatar
                  src={token.logoURI}
                  alt={token.name}
                  sx={{ width: 36, height: 36 }}
                />
                <Typography
                  sx={{
                    marginLeft: "1rem",
                    color: "#FFFFFF",
                    fontWeight: "500",
                    fontSize: "1rem",
                  }}
                >
                  {token.name}
                </Typography>
              </Box>
            ))}
        </Box>
      </Box>
    </Modal>
  );
};

const tokenData = [
  { name: "USDT", icon: usdtImage },
  { name: "ETH", icon: ethImage },
  { name: "USDC", icon: usdcImage },
];

export default function NewPosition({onliquidity}) {
  const theme = useTheme();

  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [feeTier, setFeeTier] = useState("0.01");
  const [priceRange, setPriceRange] = useState("full");
  const [openModal, setOpenModal] = useState(false);
  const [autoSelectedToken, setAutoSelectedToken] = useState(
    tokenData.find((token) => token.name === "ETH")
  ); // Default auto-select ETH
  const [selectedToken, setSelectedToken] = useState(null);
  const [triggerSource, setTriggerSource] = useState(null);
  const [minPrice, setMinPrice] = useState("0");
  const [maxPrice, setMaxPrice] = useState("0");
  const [ethAmount, setEthAmount] = useState("");
  const [usdcAmount, setUsdcAmount] = useState("");

  const handlePriceChange = () => {
    const currentValue =
      type === "min" ? parseFloat(minPrice) : parseFloat(maxPrice);
    const newValue = operation === "add" ? currentValue + 1 : currentValue - 1;
    if (type === "min") {
      setMinPrice(Math.max(0, newValue).toString());
    } else {
      setMaxPrice(Math.max(0, newValue).toString());
    }
  };

  // Handle opening modal
  const handleOpenModal = (source) => {
    setTriggerSource(source); 
    setOpenModal(true);
  };

  // Handle closing modal
  const handleCloseModal = () => {
    setOpenModal(false);
  };

  // Handle selecting token from modal
  const handleTokenSelect = (token) => {
    if (triggerSource === "dropdown") {
      setAutoSelectedToken(token);
    } else if (triggerSource === "button") {
      setSelectedToken(token);
    }
    handleCloseModal(); // Close modal after selection
  };

  return (
    <Box sx={{ minHeight: "100vh", color: "white", py: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} lg={8}>
            <Stack spacing={4} p={2}>
              {/* Header */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Typography variant="h4">New Position</Typography>
              </Box>

              {/* Token Selection */}
              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  Select Pair
                </Typography>

                <Stack direction="row" spacing={2}>
                  {/* Left side: Auto-Select Dropdown for Token */}
                  <FormControl>
                    <Button
                      sx={{
                        backgroundColor: "#000",
                        borderRadius: 4,
                        pl: 1.5,
                        pr: 1.5,
                        color: "white",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                      onClick={() => handleOpenModal("dropdown")}
                    >
                      <Box display="flex" alignItems="center">
                        <Avatar
                          src={autoSelectedToken.icon}
                          alt={autoSelectedToken.name}
                          sx={{ width: 24, height: 24 }}
                        />
                        <Typography sx={{ marginLeft: "0.5rem" }}>
                          {autoSelectedToken.name}
                        </Typography>
                      </Box>
                      <IoIosArrowDown />
                    </Button>
                  </FormControl>

                  {/* Right side: Select Token Button */}
                  <FormControl>
                    <Button
                      sx={{
                        backgroundColor: selectedToken ? "#000" : "#D3D3D3", // Conditional color change
                        color: "white",
                        pl: 1.5,
                        pr: 1.5,

                        textTransform: "none",
                        borderRadius: 4,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        width: 130,
                      }}
                      onClick={() => handleOpenModal("button")}
                    >
                      {selectedToken ? (
                        <>
                          <Avatar
                            src={selectedToken.logoURI}
                            sx={{ width: 24, height: 24 }}
                          />
                          {selectedToken.name}
                        </>
                      ) : (
                        "Select Token"
                      )}

                      <IoIosArrowDown />
                    </Button>
                  </FormControl>
                </Stack>
              </Box>

              {/* Fee Tier */}
              <Box>
                <Box
                  sx={{
                    justifyContent: "space-between",
                    mb: 2,
                  }}
                >
                  <Typography variant="h5">Fee Tier</Typography>
                  <Typography sx={{ color: "#768190", fontSize: 12 }}>
                    The % you’ll earn in fees
                  </Typography>
                </Box>
                <Grid container spacing={1}>
                  {["0.01", "0.05", "0.30", "1.00"].map((fee) => (
                    <Grid item xs={2} key={fee}>
                      <Button
                        variant={feeTier === fee ? "contained" : "outlined"}
                        onClick={() => setFeeTier(fee)}
                        sx={{
                          color: feeTier === fee ? "white" : "#B2BAC2",
                          borderColor: "#000",
                          backgroundColor: "#000",
                          borderRadius: 8,
                        }}
                      >
                        {fee}%
                      </Button>
                    </Grid>
                  ))}
                </Grid>
              </Box>

              {/* Price Range */}
      

              {/* Deposit Amount */}
              <Box sx={{ color: "white", borderRadius: 2 }}>
                {/* Price Range Section */}
                <Stack spacing={4}>
                  {/* Min Price */}
                  <Box sx={{ backgroundColor: "rgba(0, 206, 229, 0.06)" }}>
                    <Typography
                      variant="subtitle2"
                      color="gray"
                      gutterBottom
                      align="center"
                    >
                      Min Price
                    </Typography>
                    <Stack
                      direction="row"
                      spacing={2}
                      alignItems="center"
                      justifyContent="space-between"
                    >
                      <IconButton
                        onClick={() => handlePriceChange("min", "subtract")}
                        sx={{ color: "white" }}
                      >
                        <IoIosRemove />
                      </IconButton>
                      <DarkTextField
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                        variant="outlined"
                        sx={{ width: "200px", height: 50 }}
                      />
                      <IconButton
                        onClick={() => handlePriceChange("min", "add")}
                        sx={{ color: "white" }}
                      >
                        <FaPlus fontSize={16} />
                      </IconButton>
                    </Stack>
                    <Typography
                      variant="caption"
                      color="gray"
                      align="center"
                      display="block"
                    >
                      ETH Per USDC
                    </Typography>
                  </Box>

                  {/* Max Price */}
                  <Box sx={{ backgroundColor: "rgba(0, 206, 229, 0.06)" }}>
                    <Typography
                      variant="subtitle2"
                      color="gray"
                      gutterBottom
                      align="center"
                    >
                      Max Price
                    </Typography>
                    <Stack
                      direction="row"
                      spacing={2}
                      alignItems="center"
                      justifyContent="space-between"
                    >
                      <IconButton
                        onClick={() => handlePriceChange("max", "subtract")}
                        sx={{ color: "white" }}
                      >
                        <IoIosRemove />
                      </IconButton>
                      <DarkTextField
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                        variant="outlined"
                        sx={{ width: "200px" }}
                      />
                      <IconButton
                        onClick={() => handlePriceChange("max", "add")}
                        sx={{ color: "white" }}
                      >
                        <FaPlus fontSize={16} />
                      </IconButton>
                    </Stack>
                    <Typography
                      variant="caption"
                      color="gray"
                      align="center"
                      display="block"
                    >
                      ETH Per USDC
                    </Typography>
                  </Box>

                  <Typography
                    variant="caption"
                    sx={{
                      color: "#FFD700",
                      textAlign: "center",
                      display: "block",
                    }}
                  >
                    Your position will not earn fees or be used in trades until
                    the market price moves into your range.
                  </Typography>

                  {/* Deposit Amount Section */}
                  <Box sx={{ mt: 4 }}>
                    <Typography variant="h6" gutterBottom>
                      Deposit Amount
                    </Typography>

                    {/* ETH Input */}
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="gray">
                        Amount of ETH
                      </Typography>
                      <Box sx={{ position: "relative" }}>
                        <DarkTextField
                          fullWidth
                          value={ethAmount}
                          onChange={(e) => setEthAmount(e.target.value)}
                          sx={{ pr: 12 }}
                        />

                        {/* */}
                        <TokenButton
                          sx={{
                            position: "absolute",
                            right: 8,
                            top: "50%",
                            transform: "translateY(-50%)",

                            gap: 2,
                          }}
                        >
                          <Box display="flex" alignItems="center">
                            <Avatar
                              src={autoSelectedToken.logoURI}
                              alt={autoSelectedToken.name}
                              sx={{ width: 24, height: 24 }}
                            />
                            <Typography sx={{ marginLeft: "0.5rem" }}>
                              {autoSelectedToken.name}
                            </Typography>
                          </Box>
                        </TokenButton>
                      </Box>
                      <Typography
                        variant="caption"
                        color="gray"
                        textAlign={"right"}
                      >
                        Balance: 0.00
                      </Typography>
                    </Box>

                    {/* Swap Button */}
                    <Box
                      sx={{ display: "flex", justifyContent: "center", my: 2 }}
                    >
                      <IconButton
                        sx={{
                          bgcolor: "#132F4C",
                          color: "white",
                          "&:hover": { bgcolor: "#D3D3D35E" },
                        }}
                      >
                        <MdOutlineSwapVert />
                      </IconButton>
                    </Box>

                    {/* USDC Input */}
                    <Box>
                      <Typography variant="caption" color="gray">
                        Amount of USDC
                      </Typography>
                      <Box sx={{ position: "relative" }}>
                        <DarkTextField
                          fullWidth
                          value={usdcAmount}
                          onChange={(e) => setUsdcAmount(e.target.value)}
                          sx={{ pr: 12 }}
                        />
                        {selectedToken ? (
                          <TokenButton
                            sx={{
                              position: "absolute",
                              right: 8,
                              top: "50%",
                              transform: "translateY(-50%)",
                              gap: 2,
                            }}
                          >
                            <Avatar
                              src={selectedToken?.icon}
                              sx={{ width: 24, height: 24 }}
                            />

                            <Typography> {selectedToken?.name}</Typography>
                          </TokenButton>
                        ) : null}
                      </Box>
                      <Typography variant="caption" color="gray">
                        Balance: 0.00
                      </Typography>
                    </Box>
                  </Box>
                </Stack>
              </Box>

              {/* APR */}
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography>Estimated APR</Typography>
                <Typography sx={{ color: "#fff" }}>0.00%</Typography>
              </Box>

              {/* Connect Wallet Button */}
              <CustomButton>Swap</CustomButton>
          
            </Stack>
          </Grid>

          {/* Positions Card */}
          <Grid item xs={12} lg={4}>
            <DarkCard
              sx={{
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mt: isMobile ? 1 : 20,
                mb:10
              }}
            >
              <Stack alignItems="center" spacing={2}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    bgcolor: "#132F4C",
                    borderRadius: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  🏠
                </Box>
                <Typography color="#B2BAC2" variant="h4">
                  Positions will  <br /> appear here
                </Typography>
              </Stack>
            </DarkCard>
          </Grid>
        </Grid>

      {/* Token Selection Modal */}
      <TokenSelectionModal
        open={openModal}
        onClose={handleCloseModal}
        tokenData={tokenData}
        onSelectToken={handleTokenSelect}
      />
    </Box>
  );
}

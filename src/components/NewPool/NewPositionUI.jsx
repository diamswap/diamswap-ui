
import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Stepper,
  Step,
  StepLabel,
  TextField,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Grid,
  IconButton,
  Container,
  Tabs,
  Tab
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  FiSettings,
  FiChevronDown,
  FiRefreshCw,
  FiEdit2,
  FiZoomIn,
  FiZoomOut,
  FiChevronRight,
  FiChevronUp
} from 'react-icons/fi';
import { metadata } from "./metadata/tokens";
import TokenSelectorModal from './comman/TokenSelector';
import { FaEthereum } from "react-icons/fa"
import { IoMdAdd, IoMdRemove } from "react-icons/io"
import { MdEdit, MdZoomIn, MdZoomOut } from "react-icons/md"
import { SiTether } from "react-icons/si"
import {
  LineChart,
  Line,
  ResponsiveContainer,
} from "recharts"
import CustomButton from './comman/CustomButton';
const steps = [
  { label: 'Step 1', description: 'Select token pair and fees' },
  { label: 'Step 2', description: 'Set price range' },
  { label: 'Step 3', description: 'Enter deposit amounts' },
];

const ContentWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(4),
  padding: theme.spacing(3),
  maxWidth: '1200px',
  margin: '0 auto',
}));

const StepperWrapper = styled(Box)(({ theme }) => ({
  width: '240px',
  flexShrink: 0,
}));

const MainContent = styled(Box)(({ theme }) => ({
  flex: 1,
  maxWidth: '800px',
}));


// Custom styled components
const PriceInput = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
  marginBottom: theme.spacing(2),
}))

const StyledTextField = styled(TextField)(({ theme }) => ({
  "& .MuiInputBase-input": {
    fontSize: "20px",
    fontWeight: "bold",
    backgroundColor:"#000",
    border:"0.1px solid gray",
    borderRadius:8,
    padding:"0.7rem"
  },
}))


const NewPosition = () => {
  const [activeStep, setActiveStep] = useState(0);

  const handleNext = () => {
    if (activeStep < steps.length - 1) {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep((prevStep) => prevStep - 1);
    }
  };

  return (
    <Box sx={{ py: 4, px: 2 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">New position</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button startIcon={<FiRefreshCw />} variant="outlined">Reset</Button>
          <Button endIcon={<FiChevronDown />} variant="outlined">v3 position</Button>
          <Button variant="outlined"><FiSettings /></Button>
        </Box>
      </Box>

      <ContentWrapper>
        <StepperWrapper>
          <Stepper activeStep={activeStep} orientation="vertical">
            {steps.map((step, index) => (
              <Step key={step.label}>
                <StepLabel>
                  <Typography variant="subtitle2">{step.label}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {step.description}
                  </Typography>
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </StepperWrapper>

        <MainContent>
          {activeStep === 0 && <TokenPairSelection />}
          {activeStep === 1 && <PriceRange />}
          {activeStep === 2 && <DepositTokens />}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button variant="outlined" onClick={handleBack} disabled={activeStep === 0}>Back</Button>
            <Button variant="contained" onClick={handleNext}>{activeStep === steps.length - 1 ? 'Finish' : 'Continue'}</Button>
          </Box>
        </MainContent>
      </ContentWrapper>

      
    </Box>
  );
};


const TokenPairSelection = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedToken1, setSelectedToken1] = useState(metadata.tokens[0]);
  const [selectedToken2, setSelectedToken2] = useState(metadata.tokens[1]);
  const [isSelectingToken1, setIsSelectingToken1] = useState(true);
  const [selectedFeeTier, setSelectedFeeTier] = useState("0.05%");
  const [isExpanded, setIsExpanded] = useState(false);
  const handleOpenModal = (isToken1) => {
    setIsSelectingToken1(isToken1);
    setIsModalOpen(true);
  };

  const handleSelectToken = (token) => {
    if (isSelectingToken1) {
      setSelectedToken1(token);
    } else {
      setSelectedToken2(token);
    }
  };

  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const feeTiers = [
    { tier: "0.01%", description: "Best for very stable pairs.", tvl: "$7.0M TVL", select: "6.486%" },
    { tier: "0.05%", description: "Best for stable pairs.", tvl: "$30.5M TVL", select: "28.075%" },
    { tier: "0.3%", description: "Best for most pairs.", tvl: "$70.4M TVL", select: "64.813%" },
    { tier: "1%", description: "Best for exotic pairs.", tvl: "$680.9K TVL", select: "0.627%" },
  ];

  return (
    <Box
      sx={{
        backgroundColor: "naviblue",
        borderRadius: "12px",
        p: 4,
        maxWidth: "600px",
        mx: "auto",
        boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
      }}
    >
      <Typography variant="h6" sx={{ mb: 2 }}>
        Select pair
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Choose the tokens you want to provide liquidity for. You can select tokens on all supported networks.
      </Typography>

      <Box
        sx={{
          display: "flex",
          gap: 2,
          alignItems: "center",
          justifyContent: "space-between",
          mb: 4,
        }}
      >
        <Button
          onClick={() => handleOpenModal(true)}
          sx={{
            width: "calc(50% - 8px)",
            backgroundColor: "transparent",
            
            border: "1px solid #E0E0E0",
            borderRadius: "12px",
            justifyContent: "space-between",
            textTransform: "none",
            p: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Box
              component="img"
              src={selectedToken1.icon}
              alt={selectedToken1.name}
              sx={{ width: 24, height: 24, mr: 1 }}
            />
            <Typography>{selectedToken1.symbol}</Typography>
          </Box>
          <FiChevronDown />
        </Button>

        <Button
          onClick={() => handleOpenModal(false)}
          sx={{
            width: "calc(50% - 8px)",
            backgroundColor: "transparent",
            border: "1px solid #E0E0E0",
            borderRadius: "12px",
            justifyContent: "space-between",
            textTransform: "none",
            p: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Box
              component="img"
              src={selectedToken2.icon}
              alt={selectedToken2.name}
              sx={{ width: 24, height: 24, mr: 1 }}
            />
            <Typography>{selectedToken2.symbol}</Typography>
          </Box>
          <FiChevronDown />
        </Button>
      </Box>

      <Typography variant="h6" sx={{ mb: 2 }}>
        Fee tier
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        The amount earned providing liquidity. Choose an amount that suits your risk tolerance and strategy.
      </Typography>

      
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px",
            border:"1px solid gray",
            borderRadius:4,
            mb:2
          }}
        >
          <Box>
            <Typography variant="subtitle2">{selectedFeeTier} fee tier</Typography>
            <Typography variant="caption" color="text.secondary">
              The % you will earn in fees
            </Typography>
          </Box>
          <IconButton onClick={handleToggleExpand}>
            {isExpanded ? <FiChevronUp color='white' /> : <FiChevronDown  color='white'/>}
          </IconButton>
        </Box>

      {isExpanded && (
        <Grid container spacing={2} sx={{ mb: 4 }}>
          {feeTiers.map((fee) => (
            <Grid item xs={6} key={fee.tier}>
              <Card
                sx={{
                  border: selectedFeeTier === fee.tier ? "2px solid #1976d2" : "1px solid #E0E0E0",
                  borderRadius: "12px",
                  p: 2,
                  cursor: "pointer",
                  backgroundColor: selectedFeeTier === fee.tier ? "#000" : "transparent",
                }}
                onClick={() => setSelectedFeeTier(fee.tier)}
              >
                <Typography variant="subtitle2">{fee.tier}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {fee.description}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                  {fee.tvl}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {fee.select} select
                </Typography>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Button
        variant="contained"
        fullWidth
        size="large"
        sx={{
          backgroundColor: "#000",
          color: "#fff",
          textTransform: "none",
          p: 1.5,
          fontWeight: 600,
        }}
      >
        Continue
      </Button>

      <TokenSelectorModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        tokens={metadata.tokens}
        onSelectToken={handleSelectToken}
      />
    </Box>
  );
};


const PriceRange = () => {
  const [rangeType, setRangeType] = useState("full")
  const [minPrice, setMinPrice] = useState("9537.0978")
  const [maxPrice, setMaxPrice] = useState("339848740000000")

  const handleRangeChange = (event, newValue) => {
    setRangeType(newValue)
  }

  const handleIncrement = (type) => {
    if (type === "min") {
      setMinPrice((prev) => (parseFloat(prev) + 1).toString())
    } else {
      setMaxPrice((prev) => (parseFloat(prev) + 1).toString())
    }
  }

  const handleDecrement = (type) => {
    if (type === "min") {
      setMinPrice((prev) => (parseFloat(prev) - 1).toString())
    } else {
      setMaxPrice((prev) => (parseFloat(prev) - 1).toString())
    }
  }

  return (
    <Container maxWidth="sm">
      <Box sx={{ mb: 4, mt: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <FaEthereum size={24} color="#627EEA" />
              <Typography variant="h6" component="span" sx={{ ml: 1 }}>
                ETH / USDT
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
              v3
            </Typography>
            <Typography variant="body2" color="success.main" sx={{ ml: 1 }}>
              0.05%
            </Typography>
          </Box>
          <IconButton size="small">
            <MdEdit  color='white'/>
          </IconButton>
        </Box>

        <Typography variant="h6" sx={{ mb: 2 }}>
          Set price range
        </Typography>

        <Tabs
          value={rangeType}
          onChange={handleRangeChange}
          sx={{ mb: 3 }}
          TabIndicatorProps={{ sx: { display: "none" } }}
        >
          <Tab
            label="Full range"
            value="full"
            sx={{
              borderRadius: "8px",
              mr: 1,
              "&.Mui-selected": { bgcolor: "action.hover" },
            }}
          />
          <Tab
            label="Custom range"
            value="custom"
            sx={{
              borderRadius: "8px",
              "&.Mui-selected": { bgcolor: "action.hover" },
            }}
          />
        </Tabs>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          Custom range allows you to concentrate your liquidity within specific price bounds, enhancing capital efficiency and
          fee earnings but requiring more active management.
        </Typography>

        <Box sx={{ mb: 4 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Current price: 1 WETH = 3,899.02 USDT ($3,900.22)
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mb: 2 , }}>
            <IconButton size="small">
              <MdZoomOut color='white' />
            </IconButton>
            <IconButton size="small">
              <MdZoomIn  color='white'/>
            </IconButton>
          </Box>
          {/* Price Chart would go here */}
          <Box
            sx={{
              height: "200px",
              bgcolor: "#000",
              borderRadius: 1,
              mb: 4,
            }}
          />
        </Box>

        <PriceInput>
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Min price
            </Typography>
            <StyledTextField
              fullWidth
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              variant="outlined"
              size="small"
            />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              USDT per ETH
            </Typography>
          </Box>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <IconButton size="small" onClick={() => handleIncrement("min")}>
              <IoMdAdd color='white' />
            </IconButton>
            <IconButton size="small" onClick={() => handleDecrement("min")}>
              <IoMdRemove color='white' />
            </IconButton>
          </Box>
        </PriceInput>

        <PriceInput>
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Max price
            </Typography>
            <StyledTextField
              fullWidth
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              variant="outlined"
              size="small"
            />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              USDT per ETH
            </Typography>
          </Box>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <IconButton size="small" onClick={() => handleIncrement("max")}>
              <IoMdAdd  color='white'/>
            </IconButton>
            <IconButton size="small" onClick={() => handleDecrement("max")}>
              <IoMdRemove color='white' />
            </IconButton>
          </Box>
        </PriceInput>

        <Button
          variant="contained"
          fullWidth
          sx={{
            mt: 2,
            bgcolor: "black",
            color: "white",
            py: 2,
            "&:hover": {
              bgcolor: "grey.900",
            },
          }}
        >
          Continue
        </Button>
      </Box>
    </Container>
  )
}

const data = [
  { value: 4000 },
  { value: 3800 },
  { value: 4200 },
  { value: 3900 },
  { value: 3700 },
  { value: 3873.79 },
]


const DepositTokens = () => {
  const [ethAmount, setEthAmount] = useState("0")
  const [usdtAmount, setUsdtAmount] = useState("0")

  return (
    <Box sx={{ maxWidth: 480, mx: "auto", p: 3, borderRadius: 2, backgroundColor:"#000" }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <FaEthereum size={24} color="#627EEA" />
            <SiTether size={24} color="#26A17B" />
          </Box>
          <Typography variant="h6">ETH / USDT</Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            v3
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            0.05%
          </Typography>
        </Box>
        <Button startIcon={<MdEdit />} size="small">
          Edit
        </Button>
      </Box>

      {/* Chart Section */}
      <Box sx={{ height: 100, mb: 2 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <Line
              type="monotone"
              dataKey="value"
              stroke="#4CAF50"
              dot={false}
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </Box>

      {/* Price Range */}
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Box>
          <Typography variant="body2" color="text.secondary">
            Min
          </Typography>
          <Typography>3,873.79 USDT/ETH</Typography>
        </Box>
        <Box>
          <Typography variant="body2" color="text.secondary">
            Max
          </Typography>
          <Typography>∞ USDT/ETH</Typography>
        </Box>
        <Button startIcon={<MdEdit />}  size="small">
          Edit
        </Button>
      </Box>

      {/* Deposit Form */}
      <Typography variant="h6" sx={{ mb: 2 }}>
        Deposit tokens
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Specify the token amounts for your liquidity contribution.
      </Typography>

      {/* ETH Input */}
      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          value={ethAmount}
          onChange={(e) => setEthAmount(e.target.value)}
          InputProps={{
            startAdornment: (
              <Box sx={{ mr: 1 }}>
                <FaEthereum size={24} color="#627EEA" />
              </Box>
            ),
            endAdornment: (
              <Typography variant="body2" color="text.secondary">
                ETH
              </Typography>
            ),
          }}
          sx={{ mb: 1 }}
        />
        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography variant="body2" color="text.secondary">
            ${(parseFloat(ethAmount) * 3873.79).toFixed(2)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            0 ETH Max
          </Typography>
        </Box>
      </Box>

      {/* USDT Input */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          value={usdtAmount}
          onChange={(e) => setUsdtAmount(e.target.value)}
          InputProps={{
            startAdornment: (
              <Box sx={{ mr: 1 }}>
                <SiTether size={24} color="#26A17B" />
              </Box>
            ),
            endAdornment: (
              <Typography variant="body2" color="text.secondary">
                USDT
              </Typography>
            ),
          }}
          sx={{ mb: 1 }}
        />
        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography variant="body2" color="text.secondary">
            ${usdtAmount}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            0 USDT Max
          </Typography>
        </Box>
      </Box>

      {/* Submit Button */}
      <CustomButton
        fullWidth
        variant="contained"
       
      >
        Enter an amount
      </CustomButton>
    </Box>
  )
}





export default NewPosition;
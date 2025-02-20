import { useState } from "react";
import {
  Box,
  Button,
  Collapse,
  Container,
  IconButton,
  Stack,
  Typography,
  styled,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { IoIosSearch } from "react-icons/io";
import { MdKeyboardArrowDown, MdOutlineKeyboardArrowUp } from "react-icons/md";

// Styled components
const DarkBox = styled(Box)(({ theme }) => ({
  color: "white",
  minHeight: "100vh",
  padding: theme.spacing(4),
}));

const SearchBar = styled(Box)(({ theme }) => ({
  backgroundColor: "transparent",
  borderRadius: "29px",
  border: "1px solid #D3D3D3",
  padding: theme.spacing(2),
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2),
  marginBottom: theme.spacing(3),
  cursor: "pointer",
  "&:hover": {
    backgroundColor: "#D3D3D35E",
  },
}));

const PairBox = styled(Box)(({ theme }) => ({
  backgroundColor: "rgba(0, 206, 229, 0.06)",
  borderRadius: "16px",
  padding: theme.spacing(2),
  marginBottom: theme.spacing(2),
}));

const TokenPair = ({ expanded = false }) => {
  const [isExpanded, setIsExpanded] = useState(expanded);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  

  return (
    <PairBox>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: isExpanded ? 2 : 0,
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Box
              component="img"
              src="/placeholder.svg?height=24&width=24"
              sx={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                bgcolor: "#fff",
                mr: -1,
                zIndex: 1,
              }}
            />
            <Box
              component="img"
              src="/placeholder.svg?height=24&width=24"
              sx={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                bgcolor: "#1976d2",
              }}
            />
          </Box>
          <Typography>ETH- USDC</Typography>
        </Stack>
        <Button
          endIcon={
            isExpanded ? <MdOutlineKeyboardArrowUp /> : <MdKeyboardArrowDown />
          }
          onClick={() => setIsExpanded(!isExpanded)}
          sx={{ color: "#fff" }}
        >
          Manage
        </Button>
      </Box>

      <Collapse in={isExpanded}>
        <Stack spacing={2}>
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography color="gray">Pool Tokens</Typography>
            <Typography>0.00</Typography>
          </Box>
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography color="gray">Pool ETH</Typography>
            <Typography>0.00</Typography>
          </Box>
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography color="gray">Pool USDC</Typography>
            <Typography>0.00</Typography>
          </Box>
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography color="gray">Pool Share</Typography>
            <Typography>0.00</Typography>
          </Box>

          <Button
            sx={{
              color: "#fff",
              textAlign: "center",
              width: "100%",
              "&:hover": { backgroundColor: "#132F4C" },
            }}
          >
            Account analytics and accrued fees ↗
          </Button>

          <Stack direction="row" spacing={2}>
            <Button
              fullWidth
              sx={{
                bgcolor: "rgba(255, 0, 0, 0.1)",
                color: "#ff4444",
                "&:hover": { bgcolor: "rgba(255, 0, 0, 0.2)" },
              }}
            >
              Remove Liquidity
            </Button>
            <Button
              fullWidth
              sx={{
                bgcolor: "rgba(0, 255, 0, 0.1)",
                color: "#44ff44",
                "&:hover": { bgcolor: "rgba(0, 255, 0, 0.2)" },
              }}
            >
              Increase Liquidity
            </Button>
          </Stack>
        </Stack>
      </Collapse>
    </PairBox>
  );
};

export default function Liquidity() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  return (
    <DarkBox>
      <Container maxWidth="md">
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Stack direction="row" spacing={1} alignItems="baseline">
            <Typography variant={isMobile ? "h6":"h4"}>Your Liquidity</Typography>
            <Typography variant="subtitle1" sx={{ color: "gray" }}>
              V2
            </Typography>
          </Stack>
          <Stack direction="row" spacing={2}>
            <Button sx={{ color: "#fff" }}>Create a pair</Button>
            <Button
              variant="contained"
              sx={{
                bgcolor: "#fff",
                "&:hover": { bgcolor: "#1976d2" },
                borderRadius: "24px",
              }}
            >
              Add Liquidity
            </Button>
          </Stack>
        </Box>

        <SearchBar>
          <IoIosSearch sx={{ color: "gray" }} />
          <Typography color="gray">
            Account analytics and accrued fees
          </Typography>
        </SearchBar>

        <Stack spacing={2}>
          <TokenPair expanded={true} />
          <TokenPair />
          <TokenPair />
        </Stack>
      </Container>
    </DarkBox>
  );
}

import React, { useState } from "react";
import { Box } from "@mui/material";
import OverviewPage from "../../components/Pools/OverviewPage";
import NewPositionPage from "../../components/Pools/NewPositionPage";
import chainImage from "../../assets/chain.png"; // Import the chain background image
import Liquidity from "../../components/Pools/liquidity";

const Pools = () => {
  const [currentPage, setCurrentPage] = useState("overview"); // Track page

  return (
    <Box
      sx={{
        maxWidth: "800px",
        backgroundImage: `url(${chainImage})`,
        backgroundRepeat: "no-repeat",
        backgroundSize: "350px",
        backgroundPosition: "right top",
        margin: "2rem auto",
        color: "#FFFFFF",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Box>
        {currentPage === "overview" && (
          <OverviewPage onNewPosition={() => setCurrentPage("new")} />
        )}
        {currentPage === "new" && (
          <NewPositionPage onliquidity={() => setCurrentPage("liquidity")} />
        )}

        {currentPage === "liquidity" && (
          <Liquidity onBack={() => setCurrentPage("overview")} />
        )}
      </Box>
    </Box>
  );
};

export default Pools;

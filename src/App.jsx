import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Header";
import Pools from "./pages/Pools";
import ExplorePage from "./pages/Explore";
import { Box } from "@mui/material";
import PoolsOverview from "./pages/Pools/PoolsOverview";
import PoolDetail from "./pages/Pools/pool-detail";
import TabNavigation from "./components/Swap";
import Staking from "./pages/Staking";
import AddLiquidity from "./components/Liquidity";
import CreatePool from "./components/CreatePool";
import ViewPosition from "./components/ViewPosition";
import TokenExplorer from "./components/TokenExplorer";
import NewPosition from "./components/NewPool";
import Transactions from "./components/Transactions";
import Home from "./components/Home";
import Explore from "./components/Explore/Explore";
import Etherrum from "./pages/Pools/Etherrum";
import Positions from "./components/ViewPosition/YourPositions";
import PositionDetail from "./components/ViewPosition/PositionDetail";
import LiquidityManagement from "./components/LiquidityManagement";
import DecreaseLiquidity from "./components/LiquidityManagement/DecreaseLiquidity";
import PoolList from "./components/ViewPosition";
const App = () => {
  const [activeTab, setActiveTab] = useState("Swap");
  const [activeExploreTab, setActiveExploreTab] = useState("Swap");
  return (

    <Router>
      <Navbar setActiveTab={setActiveTab} />

      <Routes>
        <Route path="/" element={<Home />} />

        <Route
          path="/swap"
          element={
            <TabNavigation
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />
          }
        />
        <Route
          path="/limit"
          element={
            <TabNavigation
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />
          }
        />
        <Route
          path="/send"
          element={
            <TabNavigation
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />
          }
        />
        <Route
          path="/buy"
          element={
            <TabNavigation
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />
          }
        />

        <Route
          path="/explore/tokens/:id"
          element={
            <Explore
              activeTab={activeExploreTab}
              setActiveTab={setActiveExploreTab}
            />
          }
        />
        <Route path="/explore/Etherrum" element={<Etherrum />} />
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/pools" element={<Pools />} />
        <Route path="/staking" element={<Staking />} />
        <Route path="/pool/:poolId" element={<PoolDetail />} />
        <Route path="/pools/create" element={<CreatePool />} />
        <Route path="/pools/positions/create" element={<NewPosition />} />
        <Route path="/position/:id" element={<PositionDetail />} />
        <Route path="/position/view" element={<Positions />} />
        <Route path="/pools/view" element={<PoolList />} />

        <Route path="/explore/pools" element={<PoolsOverview />} />
        <Route path="/explore/tokens" element={<TokenExplorer />} />
        <Route path="/explore/transactions" element={<Transactions />} />
        <Route
          path="/increase-liquidity/:tokenId"
          element={<LiquidityManagement />}
        />
        <Route
          path="/decrease-liquidity/:tokenId"
          element={<DecreaseLiquidity />}
        />
      </Routes>
    </Router>

  );
};

export default App;


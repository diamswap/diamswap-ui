import React, { useState } from "react";
import { Box, Container, Stack, Typography } from "@mui/material";
import { OverviewCharts } from "./overview-charts";
import TableTab from "../../comman/TableTab";
import TableComp from "../../comman/TableComp";
import TokenExplorer from "../../components/TokenExplorer";
import { useNavigate } from "react-router-dom";
import Dropdown from "../../comman/Dropdown";

// const StyledTableCell = styled(TableCell)(() => ({
//   color: "white",
//   borderBottom: "1px solid #D3D3D35E",
//   padding: "16px 8px",
// }));

// const Tokens = () => (
//   <Typography variant="h6" color="white" textAlign="center">
//     Tokens Content Goes Here!
//   </Typography>
// );

// const Pools = ({
//   poolsData,
//   sortField,
//   sortOrder,
//   handleSort,
//   handleRowClick,
// }) => (
//   <TableContainer sx={{ border: "1px solid gray", borderRadius: 4 }}>
//     <Table>
//       <TableHead>
//         <TableRow sx={{ backgroundColor: "#000" }}>
//           <StyledTableCell>#</StyledTableCell>
//           <StyledTableCell>Pool</StyledTableCell>
//           <StyledTableCell
//             onClick={() => handleSort("tvl")}
//             style={{ cursor: "pointer", display: "flex", alignItems: "center" }}
//           >
//             TVL
//             {sortField === "tvl" &&
//               (sortOrder === "asc" ? (
//                 <IoIosArrowUp style={{ marginLeft: "4px" }} />
//               ) : (
//                 <IoIosArrowDown style={{ marginLeft: "4px" }} />
//               ))}
//           </StyledTableCell>
//           <StyledTableCell>APR</StyledTableCell>
//           <StyledTableCell>1D vol</StyledTableCell>
//           <StyledTableCell>30D vol</StyledTableCell>
//           <StyledTableCell>1D vol/TVL</StyledTableCell>
//         </TableRow>
//       </TableHead>
//       <TableBody>
//         {poolsData.map((pool, index) => (
//           <TableRow
//             key={pool.id}
//             onClick={() => handleRowClick(pool.id)}
//             sx={{ cursor: "pointer" }}
//           >
//             <StyledTableCell>{index + 1}</StyledTableCell>
//             <StyledTableCell>{pool.pair}</StyledTableCell>
//             <StyledTableCell>{`$${pool.tvl}M`}</StyledTableCell>
//             <StyledTableCell>{pool.apr}</StyledTableCell>
//             <StyledTableCell>{pool.oneDayVol}</StyledTableCell>
//             <StyledTableCell>{pool.thirtyDayVol}</StyledTableCell>
//             <StyledTableCell>{pool.oneDayVolPerTVL}</StyledTableCell>
//           </TableRow>
//         ))}
//       </TableBody>
//     </Table>
//   </TableContainer>
// );

const Transactions = () => (
  <Typography variant="h6" color="white" textAlign="center">
    Transactions Content Comming Soon!
  </Typography>
);

const PoolsOverview = () => {
  const tabs = ["Tokens", "Pools", "Transactions"];
  const [itemType, setItemType] = useState("1D Volume");
  const [sortField, setSortField] = useState("tvl");
  const [sortOrder, setSortOrder] = useState("desc");

  const navigate = useNavigate();

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const handleItemTypeChange = (event) => {
    setItemType(event.target.value);
  };

  const handleRowClick = (poolId) => {
    navigate(`/pool/${poolId}`); // Navigate to the pool details page
  };

  const poolHeaders = [
    { field: "id", label: "#", sortable: false },
    { field: "pair", label: "Pool", sortable: false },
    { field: "tvl", label: "TVL", sortable: true },
    { field: "apr", label: "APR", sortable: false },
    { field: "oneDayVol", label: "1D vol", sortable: false },
    { field: "thirtyDayVol", label: "30D vol", sortable: false },
    { field: "oneDayVolPerTVL", label: "1D vol/TVL", sortable: false },
  ];

  const poolsData = [
    {
      id: 1,
      pair: "WISE/ETH",
      tvl: 225.0,
      apr: "0.008%",
      oneDayVol: "$15.5K",
      thirtyDayVol: "$1.3M",
      oneDayVolPerTVL: "<0.01",
    },
    {
      id: 2,
      pair: "WBTC/ETH",
      tvl: 172.8,
      apr: "3.616%",
      oneDayVol: "$5.7M",
      thirtyDayVol: "$469.8M",
      oneDayVolPerTVL: "0.03",
    },
    {
      id: 3,
      pair: "ETH/USDT",
      tvl: 151.4,
      apr: "20.829%",
      oneDayVol: "$28.8M",
      thirtyDayVol: "$2.6B",
      oneDayVolPerTVL: "0.19",
    },
    {
      id: 4,
      pair: "USDC/ETH",
      tvl: 120.6,
      apr: "12.056%",
      oneDayVol: "$79.6M",
      thirtyDayVol: "$9.7B",
      oneDayVolPerTVL: "0.66",
    },
    {
      id: 5,
      pair: "ETH/USDT",
      tvl: 90.5,
      apr: "5.606%",
      oneDayVol: "$4.6M",
      thirtyDayVol: "$266.9M",
      oneDayVolPerTVL: "0.05",
    },
  ];

  const components = {
    tokens: <TokenExplorer />,
    pools: (
      <TableComp
        headers={poolHeaders}
        data={poolsData}
        sortField={sortField}
        sortOrder={sortOrder}
        handleSort={handleSort}
        handleRowClick={handleRowClick}
      />
    ),
    transactions: <Transactions />,
  };

  const dropItems = [
    { value: "1H Volume", label: "1H Volume" },
    { value: "1D Volume", label: "1D Volume" },
    { value: "1W Volume", label: "1W Volume" },
    { value: "1M Volume", label: "1M Volume" },
    { value: "1Y Volume", label: "1Y Volume" },
  ];

  return (
    <Box sx={{ minHeight: "100vh", color: "white", py: 4, margin: "auto" , maxWidth: "1200px"}}>
      <Container maxWidth="xl">
        <OverviewCharts />
        <Box
          sx={{
            backgroundColor: "transparent",
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: "1rem",
          }}
        >
          <Dropdown
            value={itemType}
            onChange={handleItemTypeChange}
            items={dropItems}
            renderValue={(selected) =>
              selected === "1H Volume"
                ? "1H Volume"
                : selected === "1D Volume"
                ? "1D Volume"
                : selected === "1W Volume"
                ? "1W Volume"
                : selected === "1M Volume"
                ? "1M Volume"
                : "1Y Volume"
            }
          />
        </Box>
        <Stack spacing={4}>
          <TableTab tabs={tabs} components={components} />
        </Stack>
      </Container>
    </Box>
  );
};

export default PoolsOverview;

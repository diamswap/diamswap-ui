import React from "react";
import {
  Box,
  useTheme,
  useMediaQuery,
  CircularProgress,
  Typography,
} from "@mui/material";
import { LineChart, Line } from "recharts";
import { useQuery } from "@tanstack/react-query";
import TableComp from "../../comman/TableComp";

const TokenExplorer = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const fetchTokens = async () => {
    const response = await fetch(
      "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=true"
    );
    if (!response.ok) {
      throw new Error("Failed to fetch data");
    }
    return response.json();
  };
  const {
    data: tokens = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["tokens"],
    queryFn: fetchTokens,
    staleTime: 1000 * 60 * 5, // Cache data for 5 minutes
    cacheTime: 1000 * 60 * 10, // Keep unused data in cache for 10 minutes
    refetchOnWindowFocus: false, // Prevent refetching on window focus
  });


  const headers = [
    { label: "#", field: "index", sortable: false },
    { label: "Token Name", field: "name", sortable: false },
    { label: "Price", field: "current_price", sortable: false },
    { label: "1 Day", field: "price_change_percentage_24h", sortable: false },
    { label: "Market Cap", field: "market_cap", sortable: false },
    { label: "Volume", field: "total_volume", sortable: false },
    { label: "Sparkline (7d)", field: "sparkline", sortable: false },
  ];

  const data = tokens.map((token, index) => ({
    id: token.id,
    index: index + 1,
    name: (
      <Box display={"flex"} alignItems="center">
        <img
          src={token.image}
          alt={token.name}
          style={{ width: 20, marginRight: 10 }}
        />
        <Typography>
          {token.name} ({token.symbol.toUpperCase()})
        </Typography>
      </Box>
    ),
    current_price: `$${token.current_price.toFixed(2)}`,
    price_change_percentage_24h: (
      <Typography
        style={{
          color: token.price_change_percentage_24h > 0 ? "green" : "red",
        }}
      >
        {token.price_change_percentage_24h?.toFixed(2)}%
      </Typography>
    ),
    market_cap: `$${token.market_cap.toLocaleString()}`,
    total_volume: `$${token.total_volume.toLocaleString()}`,
    sparkline: (
      <LineChart
        width={100}
        height={50}
        data={token.sparkline_in_7d.price.map((price, i) => ({
          index: i,
          price,
        }))}
      >
        <Line
          type="monotone"
          dataKey="price"
          stroke={
            token.sparkline_in_7d.price[0] <
            token.sparkline_in_7d.price[token.sparkline_in_7d.price.length - 1]
              ? "green"
              : "red"
          }
          dot={false}
        />
      </LineChart>
    ),
  }));

  if (isLoading)
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  if (error) return <div>Error: {error.message}</div>;

  return (
    <Box
      sx={{ p: isMobile ? 1 : 0,  display: "flex" }}
    >
      <TableComp
        headers={headers}
        data={data}
        sortField={null}
        sortOrder={null}
        handleSort={() => {}}
        handleRowClick={() => {}} 
      />
    </Box>
  );
};

export default TokenExplorer;

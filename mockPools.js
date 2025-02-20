const mockPools = [
    {
      id: "0x21b8065d10f73EE2e260e5B47D3344d3Ced7596",
      name: "WISE / ETH",
      volume: "$15,364.58",
      tvl: "$225.5M",
      apr: "0.006%",
      stats: [
        { time: "8:30 PM", volume: 5000 },
        { time: "11:30 PM", volume: 7000 },
        { time: "2:30 AM", volume: 2000 },
        { time: "8:30 AM", volume: 6000 },
        { time: "11:30 AM", volume: 1500 },
      ],
      transactions: [
        { type: "Sell", usd: "$392.06", token: "1700.04 WISE", eth: "0.10603 ETH", time: "1m ago" },
        { type: "Buy", usd: "$36.94", token: "159.373 WISE", eth: "0.01 ETH", time: "5h ago" },
      ],
    },
    {
      id: "0xabc123",
      name: "WBTC / ETH",
      volume: "$4.9M",
      tvl: "$173.4M",
      apr: "3.077%",
      stats: [
        { time: "8:30 PM", volume: 3000 },
        { time: "11:30 PM", volume: 4500 },
        { time: "2:30 AM", volume: 4000 },
        { time: "8:30 AM", volume: 3500 },
        { time: "11:30 AM", volume: 2000 },
      ],
      transactions: [
        { type: "Sell", usd: "$500.00", token: "0.02 WBTC", eth: "0.8 ETH", time: "2h ago" },
      ],
    },
  ];
  
  export default mockPools;
  
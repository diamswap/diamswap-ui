import { useState } from "react";
import {
  CardContent,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
  Box,
  Grid,
} from "@mui/material";
import {
  Line,
  LineChart,
  Bar,
  BarChart,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

// Generate TVL data with realistic market movements
const generateTVLData = () => {
  const dataPoints = [];
  const totalDays = 1460; // 4 years * 365 days

  for (let i = 0; i < totalDays; i++) {
    const date = new Date(2021, 0, 1);
    date.setDate(date.getDate() + i);

    let tvl = 1.0; // Base TVL
    if (i > 180 && i < 300) {
      tvl = 3.5 + Math.sin((i - 180) / 30) * 0.5;
    } else if (i >= 300) {
      tvl = 2.0 + Math.sin(i / 100) * 0.3;
    }
    tvl += (Math.random() - 0.5) * 0.1;

    let price =
      tvl * (1 + Math.sin(i / 80) * 0.3) + (Math.random() - 0.5) * 0.1;

    dataPoints.push({
      date: date.toISOString().split("T")[0],
      tvl: Math.max(0.5, tvl),
      price: Math.max(0.5, price),
    });
  }

  return dataPoints;
};

// Sample volume data for D, W, M
const volumeDataDaily = Array.from({ length: 17 }, (_, i) => ({
  date: `Nov ${i + 1}`,
  volume1: Math.random() * 10,
  volume2: Math.random() * 5,
}));

const volumeDataWeekly = Array.from({ length: 44 }, (_, i) => ({
  date: `Week ${i + 1}`,
  volume1: Math.random() * 10,
  volume2: Math.random() * 25,
}));

const volumeDataMonthly = Array.from({ length: 0 }, (_, i) => ({
  date: `Month ${i + 1}`,
  volume1: Math.random() * 10,
  volume2: Math.random() * 15,
}));

export function OverviewCharts() {
  const [timePeriod, setTimePeriod] = useState("D");
  const [volumeData, setVolumeData] = useState(volumeDataDaily);

  const handleTimePeriodChange = (event, newTimePeriod) => {
    if (newTimePeriod !== null) {
      setTimePeriod(newTimePeriod);
      if (newTimePeriod === "D") {
        setVolumeData(volumeDataDaily);
      } else if (newTimePeriod === "W") {
        setVolumeData(volumeDataWeekly);
      } else if (newTimePeriod === "M") {
        setVolumeData(volumeDataMonthly);
      }
    }
  };

  return (
    <Grid container >
    {/* TVL Chart */}
    <Grid item xs={12} md={6}>
      <CardContent>
        <Typography variant="body2" color="text.secondary">
          Uniswap TVL
        </Typography>
        <Typography
          variant="h4"
          component="div"
          sx={{ fontWeight: 500, mb: 2 }}
        >
          $3.76B
        </Typography>
        <div style={{ height: 300, width: "100%" }}>
          <ResponsiveContainer>
            <LineChart
              data={generateTVLData()}
              margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
            >
              <defs>
                <linearGradient id="gradient1-tvl" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D3D3D3" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#D3D3D3" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="gradient2-tvl" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00AAFF" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#00AAFF" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return date.getFullYear().toString(); // Display years only
                }}
                minTickGap={50}
              />
              <YAxis
                stroke="#888888"
                fontSize={0}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #ccc",
                  borderRadius: "8px",
                  padding: "8px",
                }}
                formatter={(value) => [`$${value.toFixed(2)}B`]}
                labelFormatter={(label) => {
                  const date = new Date(label);
                  return date.toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  });
                }}
              />
              <Line
                type="monotone"
                dataKey="tvl"
                stroke="#64937c"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
                fill="url(#gradient1-tvl)"
              />
              <Line
                type="monotone"
                dataKey="price"
                stroke="#b9b9b9"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
                fill="url(#gradient2-tvl)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Grid>

    {/* Volume Chart */}
    <Grid item xs={12} md={6}>
      <CardContent>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginTop: "10px",
          }}
        >
          <ToggleButtonGroup
            value={timePeriod}
            exclusive
            onChange={handleTimePeriodChange}
            aria-label="time period"
            size="small"
          >
            <ToggleButton
              value="D"
              aria-label="day"
              sx={{ backgroundColor: "#000", color: "white" }}
            >
              D
            </ToggleButton>
            <ToggleButton
              value="W"
              aria-label="week"
              sx={{ backgroundColor: "#000", color: "white" }}
            >
              W
            </ToggleButton>
            <ToggleButton
              value="M"
              aria-label="month"
              sx={{ backgroundColor: "#000", color: "white" }}
            >
              M
            </ToggleButton>
          </ToggleButtonGroup>
        </div>
        <Typography variant="body2" color="text.secondary">
          Uniswap volume
        </Typography>
        <Typography variant="h4" component="div">
          $53.50B
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Past month
        </Typography>
        <div style={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={volumeData}
              margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
            >
              <XAxis
                dataKey="date"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                minTickGap={50}
              />

              <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${value}B`}
              />
              <Tooltip />
              <Bar
                dataKey="volume1"
                stackId="volume"
                fill="#64937c"
                radius={[0, 0, 0, 0]}
                barSize={6}
              />
              <Bar
                dataKey="volume2"
                stackId="volume"
                fill="#b9b9b9"
                radius={[2, 2, 0, 0]}
                barSize={6}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Grid>
  </Grid>
  );
}

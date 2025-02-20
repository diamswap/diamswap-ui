
import React, { useState } from "react"
import { Card, CardContent, Typography, Tabs, Tab } from "@mui/material"
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"

const tvlData = [
  { date: "2021", TVL: 1.2, Price: 1.0 },
  { date: "2022", TVL: 3.7, Price: 3.2 },
  { date: "2023", TVL: 2.8, Price: 2.5 },
  { date: "2024", TVL: 3.73, Price: 3.1 },
]

const volumeData = Array.from({ length: 30 }, (_, i) => ({
  date: `Nov ${i + 1}`,
  Volume: Math.random() * 2 + 1,
  "Volume USD": Math.random() * 3 + 1,
}))

export function OverviewCharts() {
  const [activeTab, setActiveTab] = useState(0)

  const handleTabChange = () => {
    setActiveTab(newValue)
  }

  return (
    <Card>
      <CardContent>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <Typography variant="h4">
              {activeTab === 0 ? "$3.73B" : "$53.27B"}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {activeTab === 0 ? "Total TVL" : "Past month volume"}
            </Typography>
          </div>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab label="TVL" />
            <Tab label="Volume" />
          </Tabs>
        </div>

        <div style={{ height: 350 }}>
          {activeTab === 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={tvlData}>
                <XAxis dataKey="date" />
                <YAxis tickFormatter={(value) => `$${value}B`} />
                <Tooltip />
                <Line type="monotone" dataKey="TVL" stroke="#8884d8" strokeWidth={2} />
                <Line type="monotone" dataKey="Price" stroke="#82ca9d" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={volumeData}>
                <XAxis dataKey="date" />
                <YAxis tickFormatter={(value) => `$${value}B`} />
                <Tooltip />
                <Bar dataKey="Volume" fill="#8884d8" />
                <Bar dataKey="Volume USD" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  )
}


import React from 'react';
import { Card, CardContent, Typography, Grid } from '@mui/material';

const Stats = ({ tvl, marketCap, fdv, oneDayVolume }) => {
  const stats = [
    { label: 'TVL', value: tvl },
    { label: 'Market Cap', value: marketCap },
    { label: 'FDV', value: fdv },
    { label: '1 Day Volume', value: oneDayVolume },
  ];

  return (
    <Grid container spacing={3}>
      {stats.map((stat, index) => (
        <Grid item xs={12} sm={6} md={3} key={index}>
          <Card style={{ backgroundColor: 'transparent', boxShadow: 'none' }}>
            <CardContent>
              <Typography variant="body2" color="grey">{stat.label}</Typography>
              <Typography variant="h6">{stat.value}</Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default Stats;
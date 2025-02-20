import React from 'react';
import { Box, Button, Card, Divider, Input, MenuItem, Select, Typography } from '@mui/material';
import { FiArrowLeft, FiSettings, FiZoomIn, FiZoomOut } from 'react-icons/fi';

export default function AddLiquidity() {
  return (
    <Box sx={{ maxWidth: '600px', mx: 'auto', p: 4 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={1}>
          <Button variant="text" startIcon={<FiArrowLeft />}>
            Back
          </Button>
          <Typography variant="h6">Add liquidity</Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={1}>
          <Button variant="text" color="secondary">
            Clear all
          </Button>
          <Button variant="text" startIcon={<FiSettings />} />
        </Box>
      </Box>

      {/* Select Pair */}
      <Box mb={3}>
        <Typography variant="body2" color="textSecondary">
          Select pair
        </Typography>
        <Box display="flex" gap={2} mt={1}>
          <Select fullWidth defaultValue="dai">
            <MenuItem value="dai">
              <Box display="flex" alignItems="center" gap={1}>
                <Box
                  sx={{ width: 20, height: 20, bgcolor: 'yellow', borderRadius: '50%' }}
                />
                DAI
              </Box>
            </MenuItem>
          </Select>
          <Select fullWidth defaultValue="usdc">
            <MenuItem value="usdc">
              <Box display="flex" alignItems="center" gap={1}>
                <Box
                  sx={{ width: 20, height: 20, bgcolor: 'blue', borderRadius: '50%' }}
                />
                USDC
              </Box>
            </MenuItem>
          </Select>
        </Box>
      </Box>

      {/* Fee Tier */}
      <Card sx={{ p: 2, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="body2">0.01% fee tier</Typography>
          <Button size="small">Edit</Button>
        </Box>
        <Typography variant="caption" color="textSecondary">
          50% select
        </Typography>
      </Card>

      {/* Set Price Range */}
      <Box mb={3}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="body2">Set price range</Typography>
          <Box display="flex" gap={1}>
            <Button variant="contained" size="small">
              Full range
            </Button>
            <Button variant="outlined" size="small">
              DAI
            </Button>
            <Button variant="outlined" size="small">
              USDC
            </Button>
          </Box>
        </Box>

        {/* Price Range Inputs */}
        <Box mt={2}>
          <Card sx={{ p: 2, mb: 2 }}>
            <Typography variant="caption" color="textSecondary">
              Low price
            </Typography>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Input
                type="number"
                value="0.99880342"
                fullWidth
                disableUnderline
                sx={{ fontSize: '1.2rem' }}
              />
              <Box display="flex" gap={1}>
                <Button variant="text" startIcon={<FiZoomIn />} />
                <Button variant="text" startIcon={<FiZoomOut />} />
              </Box>
            </Box>
            <Typography variant="caption" color="textSecondary">
              USDC per DAI
            </Typography>
          </Card>

          <Card sx={{ p: 2 }}>
            <Typography variant="caption" color="textSecondary">
              High price
            </Typography>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Input
                type="number"
                value="1.000903"
                fullWidth
                disableUnderline
                sx={{ fontSize: '1.2rem' }}
              />
              <Box display="flex" gap={1}>
                <Button variant="text" startIcon={<FiZoomIn />} />
                <Button variant="text" startIcon={<FiZoomOut />} />
              </Box>
            </Box>
            <Typography variant="caption" color="textSecondary">
              USDC per DAI
            </Typography>
          </Card>
        </Box>
      </Box>

      {/* Graph Placeholder */}
      <Box
        sx={{
          height: '150px',
          bgcolor: 'black',
          borderRadius: '8px',
          mb: 3,
          position: 'relative',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Box sx={{ width: '2px', height: '100%', bgcolor: 'pink' }} />
        </Box>
      </Box>

      {/* Deposit Amounts */}
      <Box mb={3}>
        <Typography variant="body2">Deposit amounts</Typography>
        <Card sx={{ p: 2, mb: 2 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Input placeholder="0" fullWidth disableUnderline sx={{ fontSize: '1.2rem' }} />
            <Box display="flex" alignItems="center" gap={1}>
              <Box
                sx={{ width: 20, height: 20, bgcolor: 'yellow', borderRadius: '50%' }}
              />
              <Typography>DAI</Typography>
            </Box>
          </Box>
          <Box display="flex" justifyContent="space-between" mt={1}>
            <Typography variant="caption" color="textSecondary">
              -
            </Typography>
            <Typography variant="caption" color="textSecondary">
              Balance: 0
            </Typography>
          </Box>
        </Card>

        <Card sx={{ p: 2 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Input placeholder="0" fullWidth disableUnderline sx={{ fontSize: '1.2rem' }} />
            <Box display="flex" alignItems="center" gap={1}>
              <Box
                sx={{ width: 20, height: 20, bgcolor: 'blue', borderRadius: '50%' }}
              />
              <Typography>USDC</Typography>
            </Box>
          </Box>
          <Box display="flex" justifyContent="space-between" mt={1}>
            <Typography variant="caption" color="textSecondary">
              -
            </Typography>
            <Typography variant="caption" color="textSecondary">
              Balance: 0
            </Typography>
          </Box>
        </Card>
      </Box>

      {/* Submit Button */}
      <Button variant="contained" fullWidth size="large">
        Enter an amount
      </Button>
    </Box>
  );
}

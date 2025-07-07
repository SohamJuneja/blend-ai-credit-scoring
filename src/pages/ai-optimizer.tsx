import { PositionsEstimate } from '@blend-capital/blend-sdk';
import AutoGraphIcon from '@mui/icons-material/AutoGraph';
import SecurityIcon from '@mui/icons-material/Security';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  FormControlLabel,
  Grid,
  LinearProgress,
  Switch,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import type { NextPage } from 'next';
import React, { useState } from 'react';
import { useWallet } from '../contexts/wallet';
import { usePool, usePoolMeta, usePoolOracle, usePoolUser } from '../hooks/api';
import { toBalance, toPercentage } from '../utils/formatter';

// AI-powered yield optimization strategies
interface YieldStrategy {
  id: string;
  name: string;
  description: string;
  riskLevel: 'Conservative' | 'Moderate' | 'Aggressive';
  expectedAPY: number;
  aiConfidence: number;
  allocations: { asset: string; percentage: number }[];
}

interface UserRiskProfile {
  riskTolerance: 'Conservative' | 'Moderate' | 'Aggressive';
  autoRebalance: boolean;
}

const YieldOptimizer: NextPage = () => {
  const theme = useTheme();
  const { connected } = useWallet();
  const poolId = 'CCLBPEYS3XFK65MYYXSBMOGKUI4ODN5S7SUZBGD7NALUQF64QILLX5B5';

  // Hooks
  const { data: poolMeta } = usePoolMeta(poolId);
  const { data: pool } = usePool(poolMeta);
  const { data: poolOracle } = usePoolOracle(pool);
  const { data: userPoolData } = usePoolUser(pool);

  // State
  const [activeTab, setActiveTab] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [userProfile, setUserProfile] = useState<UserRiskProfile>({
    riskTolerance: 'Moderate',
    autoRebalance: false,
  });
  const [selectedStrategy, setSelectedStrategy] = useState<YieldStrategy | null>(null);
  const [aiInsights, setAiInsights] = useState<string[]>([]);

  // Mock AI strategies based on current market conditions
  const mockStrategies: YieldStrategy[] = [
    {
      id: 'conservative',
      name: 'AI Conservative Growth',
      description: 'Low-risk strategy focusing on stable yields with capital preservation',
      riskLevel: 'Conservative',
      expectedAPY: 8.5,
      aiConfidence: 92,
      allocations: [
        { asset: 'USDC', percentage: 70 },
        { asset: 'XLM', percentage: 30 },
      ],
    },
    {
      id: 'moderate',
      name: 'AI Balanced Optimizer',
      description: 'Balanced approach with dynamic rebalancing based on market conditions',
      riskLevel: 'Moderate',
      expectedAPY: 12.3,
      aiConfidence: 87,
      allocations: [
        { asset: 'USDC', percentage: 40 },
        { asset: 'XLM', percentage: 35 },
        { asset: 'BLND', percentage: 25 },
      ],
    },
    {
      id: 'aggressive',
      name: 'AI Alpha Hunter',
      description: 'High-yield strategy leveraging advanced DeFi opportunities',
      riskLevel: 'Aggressive',
      expectedAPY: 18.7,
      aiConfidence: 78,
      allocations: [
        { asset: 'USDC', percentage: 30 },
        { asset: 'BLND', percentage: 40 },
        { asset: 'XLM', percentage: 30 },
      ],
    },
  ];

  // Calculate current user position
  const userEst =
    pool && poolOracle && userPoolData
      ? PositionsEstimate.build(pool, poolOracle, userPoolData.positions)
      : null;

  // AI Analysis simulation
  const analyzeOptimalStrategy = async () => {
    setIsAnalyzing(true);

    // Simulate AI processing
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const strategy =
      mockStrategies.find((s) => s.riskLevel === userProfile.riskTolerance) || mockStrategies[1];
    setSelectedStrategy(strategy);

    // Generate AI insights
    const insights = [
      `Market volatility is ${
        strategy.riskLevel === 'Conservative' ? 'low' : 'elevated'
      }, favoring ${strategy.riskLevel.toLowerCase()} strategies`,
      `AI confidence: ${strategy.aiConfidence}% - Based on 10,000+ market simulations`,
      `Expected yield improvement: +${(strategy.expectedAPY - (userEst?.netApy || 0) * 100).toFixed(
        2
      )}%`,
      `Recommended rebalancing frequency: ${userProfile.autoRebalance ? 'Daily' : 'Weekly'}`,
    ];

    setAiInsights(insights);
    setIsAnalyzing(false);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const RiskProfileCard = () => (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          <SecurityIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Risk Profile
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="body2" color="text.secondary">
              Risk Tolerance
            </Typography>
            <Grid container spacing={1} sx={{ mt: 1 }}>
              {(['Conservative', 'Moderate', 'Aggressive'] as const).map((risk) => (
                <Grid item key={risk}>
                  <Chip
                    label={risk}
                    color={userProfile.riskTolerance === risk ? 'primary' : 'default'}
                    onClick={() => setUserProfile({ ...userProfile, riskTolerance: risk })}
                    clickable
                  />
                </Grid>
              ))}
            </Grid>
          </Grid>
        </Grid>
        <FormControlLabel
          control={
            <Switch
              checked={userProfile.autoRebalance}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setUserProfile({ ...userProfile, autoRebalance: e.target.checked })
              }
            />
          }
          label="Auto-Rebalance"
          sx={{ mt: 1 }}
        />
      </CardContent>
    </Card>
  );

  const AIInsightsCard = () => (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          <SmartToyIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          AI Market Insights
        </Typography>
        {aiInsights.length > 0 ? (
          <Box>
            {aiInsights.map((insight: string, index: number) => (
              <Alert key={index} severity="info" sx={{ mb: 1 }}>
                {insight}
              </Alert>
            ))}
          </Box>
        ) : (
          <Typography color="text.secondary">
            Run optimization to get AI-powered insights
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  const OptimizationResultCard = () =>
    selectedStrategy && (
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <TrendingUpIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Recommended Strategy
          </Typography>
          <Typography variant="h6" color="primary">
            {selectedStrategy.name}
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            {selectedStrategy.description}
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Expected APY
              </Typography>
              <Typography variant="h4" color="primary.main">
                {selectedStrategy.expectedAPY}%
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                AI Confidence
              </Typography>
              <Typography variant="h4" color="success.main">
                {selectedStrategy.aiConfidence}%
              </Typography>
            </Grid>
          </Grid>

          <Box mt={2}>
            <Typography variant="body2" gutterBottom>
              Recommended Asset Allocation
            </Typography>
            {selectedStrategy.allocations.map((allocation, index: number) => (
              <Box
                key={index}
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={1}
              >
                <Typography variant="body2">{allocation.asset}</Typography>
                <Box display="flex" alignItems="center" sx={{ width: '60%' }}>
                  <LinearProgress
                    variant="determinate"
                    value={allocation.percentage}
                    sx={{ flexGrow: 1, mr: 1 }}
                  />
                  <Typography variant="body2">{allocation.percentage}%</Typography>
                </Box>
              </Box>
            ))}
          </Box>

          <Box mt={2}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => alert('Rebalancing feature will be implemented')}
              sx={{ mr: 1 }}
            >
              Implement Strategy
            </Button>
          </Box>
        </CardContent>
      </Card>
    );

  const CurrentPositionCard = () => (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          <AutoGraphIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Current Position
        </Typography>
        {userEst ? (
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Net APY
              </Typography>
              <Typography variant="h5">{toPercentage(userEst.netApy)}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Total Value
              </Typography>
              <Typography variant="h5">${toBalance(userEst.totalSupplied)}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Borrow Capacity
              </Typography>
              <Typography variant="body1">${toBalance(userEst.borrowCap)}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Health Factor
              </Typography>
              <Typography
                variant="body1"
                color={userEst.borrowCap > 0 ? 'success.main' : 'text.secondary'}
              >
                {userEst.borrowCap > 0 ? 'Healthy' : 'No borrows'}
              </Typography>
            </Grid>
          </Grid>
        ) : (
          <Typography color="text.secondary">
            {connected ? 'No positions found' : 'Connect wallet to view positions'}
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  if (!connected) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom>
          <SmartToyIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          AI Yield Optimizer
        </Typography>
        <Typography color="text.secondary" gutterBottom>
          Connect your wallet to start optimizing your yields with AI-powered strategies
        </Typography>
        <Alert severity="info" sx={{ mt: 2, mb: 2 }}>
          This is a demo of an AI-powered yield optimization system that could be built on top of
          Blend Protocol
        </Alert>
        <Button variant="contained" color="primary" sx={{ mt: 2 }}>
          Connect Wallet
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1200, margin: '0 auto' }}>
      <Typography variant="h4" gutterBottom>
        <SmartToyIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        AI Yield Optimizer
      </Typography>
      <Typography color="text.secondary" gutterBottom>
        Maximize your DeFi yields with AI-powered optimization strategies
      </Typography>

      <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label="Dashboard" />
        <Tab label="AI Optimization" />
        <Tab label="Strategy Library" />
      </Tabs>

      {activeTab === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <RiskProfileCard />
            <CurrentPositionCard />
          </Grid>
          <Grid item xs={12} md={6}>
            <AIInsightsCard />
            <OptimizationResultCard />
          </Grid>
        </Grid>
      )}

      {activeTab === 1 && (
        <Box>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                AI-Powered Strategy Analysis
              </Typography>
              <Typography color="text.secondary" gutterBottom>
                Our AI analyzes market conditions, volatility patterns, and your risk profile to
                recommend optimal yield strategies
              </Typography>

              <Button
                variant="contained"
                color="primary"
                onClick={analyzeOptimalStrategy}
                disabled={isAnalyzing}
                sx={{ mt: 2 }}
              >
                {isAnalyzing ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
                {isAnalyzing ? 'Analyzing Market Conditions...' : 'Run AI Analysis'}
              </Button>
            </CardContent>
          </Card>

          {selectedStrategy && <OptimizationResultCard />}
        </Box>
      )}

      {activeTab === 2 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Available AI Strategies
          </Typography>
          <Grid container spacing={2}>
            {mockStrategies.map((strategy) => (
              <Grid item xs={12} md={4} key={strategy.id}>
                <Card
                  sx={{
                    height: '100%',
                    border:
                      selectedStrategy?.id === strategy.id
                        ? `2px solid ${theme.palette.primary.main}`
                        : 'none',
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {strategy.name}
                    </Typography>
                    <Chip label={strategy.riskLevel} color="primary" size="small" sx={{ mb: 1 }} />
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {strategy.description}
                    </Typography>
                    <Typography variant="h5" color="primary.main" gutterBottom>
                      {strategy.expectedAPY}% APY
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      AI Confidence: {strategy.aiConfidence}%
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={strategy.aiConfidence}
                      sx={{ mb: 2 }}
                    />
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => setSelectedStrategy(strategy)}
                    >
                      Select Strategy
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Box>
  );
};

export default YieldOptimizer;

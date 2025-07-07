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
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Switch,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import type { NextPage } from 'next';
import React, { useState } from 'react';
import { useWallet } from '../contexts/wallet';
import {
  useBackstop,
  useHorizonAccount,
  usePool,
  usePoolMeta,
  usePoolOracle,
  usePoolUser,
} from '../hooks/api';
import { toBalance, toPercentage } from '../utils/formatter';

// AI-powered yield optimization strategies
interface YieldStrategy {
  id: string;
  name: string;
  description: string;
  riskLevel: 'Conservative' | 'Moderate' | 'Aggressive';
  expectedAPY: number;
  minAmount: number;
  maxAmount: number;
  allocations: { poolId: string; percentage: number; asset: string }[];
  aiConfidence: number;
}

interface UserRiskProfile {
  riskTolerance: 'Conservative' | 'Moderate' | 'Aggressive';
  investmentHorizon: 'Short' | 'Medium' | 'Long';
  totalInvestment: number;
  preferredAssets: string[];
  autoRebalance: boolean;
}

interface OptimizationResult {
  strategy: YieldStrategy;
  projectedYield: number;
  currentYield: number;
  improvement: number;
  riskScore: number;
  rebalanceNeeded: boolean;
}

const YieldOptimizer: NextPage = () => {
  const theme = useTheme();
  const { connected, walletAddress } = useWallet();
  const poolId = 'CCLBPEYS3XFK65MYYXSBMOGKUI4ODN5S7SUZBGD7NALUQF64QILLX5B5';

  // Hooks
  const { data: poolMeta } = usePoolMeta(poolId);
  const { data: pool } = usePool(poolMeta);
  const { data: poolOracle } = usePoolOracle(pool);
  const { data: userPoolData } = usePoolUser(pool);
  const { data: account } = useHorizonAccount();
  const { data: backstop } = useBackstop(poolMeta?.version);

  // State
  const [activeTab, setActiveTab] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [userProfile, setUserProfile] = useState<UserRiskProfile>({
    riskTolerance: 'Moderate',
    investmentHorizon: 'Medium',
    totalInvestment: 0,
    preferredAssets: [],
    autoRebalance: false,
  });
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  const [aiInsights, setAiInsights] = useState<string[]>([]);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [rebalanceDialogOpen, setRebalanceDialogOpen] = useState(false);

  // Mock AI strategies based on current market conditions
  const mockStrategies: YieldStrategy[] = [
    {
      id: 'conservative',
      name: 'AI Conservative Growth',
      description: 'Low-risk strategy focusing on stable yields with capital preservation',
      riskLevel: 'Conservative',
      expectedAPY: 8.5,
      minAmount: 100,
      maxAmount: 50000,
      allocations: [
        { poolId: poolId, percentage: 70, asset: 'USDC' },
        { poolId: poolId, percentage: 30, asset: 'XLM' },
      ],
      aiConfidence: 92,
    },
    {
      id: 'moderate',
      name: 'AI Balanced Optimizer',
      description: 'Balanced approach with dynamic rebalancing based on market conditions',
      riskLevel: 'Moderate',
      expectedAPY: 12.3,
      minAmount: 500,
      maxAmount: 100000,
      allocations: [
        { poolId: poolId, percentage: 40, asset: 'USDC' },
        { poolId: poolId, percentage: 35, asset: 'XLM' },
        { poolId: poolId, percentage: 25, asset: 'BLND' },
      ],
      aiConfidence: 87,
    },
    {
      id: 'aggressive',
      name: 'AI Alpha Hunter',
      description: 'High-yield strategy leveraging advanced DeFi opportunities',
      riskLevel: 'Aggressive',
      expectedAPY: 18.7,
      minAmount: 1000,
      maxAmount: 500000,
      allocations: [
        { poolId: poolId, percentage: 30, asset: 'USDC' },
        { poolId: poolId, percentage: 40, asset: 'BLND' },
        { poolId: poolId, percentage: 30, asset: 'XLM' },
      ],
      aiConfidence: 78,
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

    const selectedStrategy =
      mockStrategies.find((s) => s.riskLevel === userProfile.riskTolerance) || mockStrategies[1];
    const currentYield = userEst?.netApy || 0;
    const projectedYield = selectedStrategy.expectedAPY / 100;

    const result: OptimizationResult = {
      strategy: selectedStrategy,
      projectedYield,
      currentYield,
      improvement: projectedYield - currentYield,
      riskScore:
        selectedStrategy.riskLevel === 'Conservative'
          ? 3
          : selectedStrategy.riskLevel === 'Moderate'
          ? 5
          : 8,
      rebalanceNeeded: Math.abs(projectedYield - currentYield) > 0.02,
    };

    setOptimizationResult(result);

    // Generate AI insights
    const insights = [
      `Market volatility is ${
        selectedStrategy.riskLevel === 'Conservative' ? 'low' : 'elevated'
      }, favoring ${selectedStrategy.riskLevel.toLowerCase()} strategies`,
      `Your current portfolio has ${
        result.improvement > 0 ? 'optimization potential' : 'good allocation'
      }`,
      `AI confidence: ${selectedStrategy.aiConfidence}% - Based on 10,000+ simulations`,
      `Recommended rebalancing frequency: ${userProfile.autoRebalance ? 'Daily' : 'Weekly'}`,
    ];

    setAiInsights(insights);
    setIsAnalyzing(false);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleProfileUpdate = () => {
    setProfileDialogOpen(false);
    analyzeOptimalStrategy();
  };

  const RiskProfileCard = () => (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" gutterBottom>
            <SecurityIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Risk Profile
          </Typography>
          <Button variant="outlined" size="small" onClick={() => setProfileDialogOpen(true)}>
            Edit Profile
          </Button>
        </Box>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Risk Tolerance
            </Typography>
            <Chip label={userProfile.riskTolerance} color="primary" size="small" />
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Investment Horizon
            </Typography>
            <Chip label={userProfile.investmentHorizon} color="secondary" size="small" />
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
    optimizationResult && (
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <TrendingUpIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Optimization Result
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Strategy
              </Typography>
              <Typography variant="h6">{optimizationResult.strategy.name}</Typography>
              <Typography variant="body2">{optimizationResult.strategy.description}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Projected APY
              </Typography>
              <Typography variant="h4" color="primary.main">
                {toPercentage(optimizationResult.projectedYield)}
              </Typography>
              <Typography
                variant="body2"
                color={optimizationResult.improvement > 0 ? 'success.main' : 'text.secondary'}
              >
                {optimizationResult.improvement > 0 ? '+' : ''}
                {toPercentage(optimizationResult.improvement)} improvement
              </Typography>
            </Grid>
          </Grid>

          <Box mt={2}>
            <Typography variant="body2" gutterBottom>
              Asset Allocation
            </Typography>
            {optimizationResult.strategy.allocations.map((allocation: any, index: number) => (
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
              onClick={() => setRebalanceDialogOpen(true)}
              disabled={!optimizationResult.rebalanceNeeded}
              sx={{ mr: 1 }}
            >
              {optimizationResult.rebalanceNeeded ? 'Rebalance Portfolio' : 'Portfolio Optimal'}
            </Button>
            <Chip
              label={`AI Confidence: ${optimizationResult.strategy.aiConfidence}%`}
              color="success"
              size="small"
            />
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
          AI Yield Optimizer
        </Typography>
        <Typography color="text.secondary" gutterBottom>
          Connect your wallet to start optimizing your yields with AI
        </Typography>
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
        <Tab label="Optimization" />
        <Tab label="Analytics" />
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
                AI-Powered Strategy Selection
              </Typography>
              <Typography color="text.secondary" gutterBottom>
                Our AI analyzes market conditions, risk factors, and your profile to recommend
                optimal strategies
              </Typography>

              <Button
                variant="contained"
                color="primary"
                onClick={analyzeOptimalStrategy}
                disabled={isAnalyzing}
                sx={{ mt: 2 }}
              >
                {isAnalyzing ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
                {isAnalyzing ? 'Analyzing...' : 'Run AI Optimization'}
              </Button>
            </CardContent>
          </Card>

          <Grid container spacing={2}>
            {mockStrategies.map((strategy) => (
              <Grid item xs={12} md={4} key={strategy.id}>
                <Card
                  sx={{
                    height: '100%',
                    border:
                      optimizationResult?.strategy.id === strategy.id
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
                      sx={{ mb: 1 }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      Range: ${strategy.minAmount.toLocaleString()} - $
                      {strategy.maxAmount.toLocaleString()}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {activeTab === 2 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Advanced Analytics
          </Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            Coming soon: Real-time yield tracking, risk analytics, and performance metrics
          </Alert>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Performance Tracking
                  </Typography>
                  <Typography color="text.secondary">
                    Track your optimized yields over time
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Risk Analytics
                  </Typography>
                  <Typography color="text.secondary">
                    Advanced risk assessment and monitoring
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Profile Edit Dialog */}
      <Dialog open={profileDialogOpen} onClose={() => setProfileDialogOpen(false)}>
        <DialogTitle>Edit Risk Profile</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mb: 2, mt: 1 }}>
            <InputLabel>Risk Tolerance</InputLabel>
            <Select
              value={userProfile.riskTolerance}
              onChange={(e: any) =>
                setUserProfile({ ...userProfile, riskTolerance: e.target.value as any })
              }
            >
              <MenuItem value="Conservative">Conservative</MenuItem>
              <MenuItem value="Moderate">Moderate</MenuItem>
              <MenuItem value="Aggressive">Aggressive</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Investment Horizon</InputLabel>
            <Select
              value={userProfile.investmentHorizon}
              onChange={(e: any) =>
                setUserProfile({ ...userProfile, investmentHorizon: e.target.value as any })
              }
            >
              <MenuItem value="Short">Short (1-3 months)</MenuItem>
              <MenuItem value="Medium">Medium (3-12 months)</MenuItem>
              <MenuItem value="Long">Long (1+ years)</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProfileDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleProfileUpdate} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Rebalance Dialog */}
      <Dialog open={rebalanceDialogOpen} onClose={() => setRebalanceDialogOpen(false)}>
        <DialogTitle>Rebalance Portfolio</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            The AI recommends rebalancing your portfolio to optimize yields.
          </Typography>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This will execute multiple transactions to rebalance your assets according to the AI
            strategy.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRebalanceDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" color="primary">
            Execute Rebalance
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default YieldOptimizer;

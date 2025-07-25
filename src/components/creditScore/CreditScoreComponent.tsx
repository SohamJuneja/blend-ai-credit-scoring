import {
  AccountBalance as AccountBalanceIcon,
  CreditScore as CreditScoreIcon,
  ExpandMore as ExpandMoreIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  Security as SecurityIcon,
  Share as ShareIcon,
  Timeline as TimelineIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Tooltip,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useEffect, useState } from 'react';
import { useWallet } from '../../contexts/wallet';
import { usePool, usePoolMeta } from '../../hooks/api';
import { BlendCreditIntegrationService } from '../../services/blendCreditIntegration';
import { StellarDataService } from '../../services/stellarDataService';
import { CreditScoringAlgorithm } from '../../utils/creditScoring';
import ImprovementSuggestions from './ImprovementSuggestions';
import UnderCollateralizedLending from './UnderCollateralizedLending';

interface CreditFactor {
  id: string;
  name: string;
  score: number;
  maxScore: number;
  weight: number;
  description: string;
  status: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'VERY_POOR';
  data: any;
  improvements: string[];
}

interface CreditScoreData {
  totalScore: number;
  grade: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'VERY_POOR';
  factors: CreditFactor[];
  benefits: {
    maxLTV: number;
    interestRateDiscount: number;
    maxBorrowAmount: number;
    priorityAccess: boolean;
    liquidationBuffer: number;
  };
  recommendations: string[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  lastUpdated: Date;
}

interface CreditScoreComponentProps {
  walletAddress: string;
  poolId?: string; // Add poolId for Blend integration
  onScoreCalculated?: (score: CreditScoreData) => void;
}

// Dummy wallet and credit score data for demo mode
const DUMMY_WALLET = 'GDUMMYWALLETADDRESS1234567890EXAMPLE';
const DUMMY_CREDIT_DATA: CreditScoreData = {
  totalScore: 850,
  grade: 'EXCELLENT',
  factors: [
    {
      id: 'wallet_age',
      name: 'Wallet Age',
      score: 100,
      maxScore: 100,
      weight: 20,
      description: 'How long the wallet has existed',
      status: 'EXCELLENT',
      data: { months: 36 },
      improvements: [],
    },
    {
      id: 'transaction_history',
      name: 'Transaction Count',
      score: 100,
      maxScore: 100,
      weight: 15,
      description: 'Number of transactions',
      status: 'EXCELLENT',
      data: { totalTransactions: 500 },
      improvements: [],
    },
    {
      id: 'loan_activity',
      name: 'Loan Activity',
      score: 100,
      maxScore: 100,
      weight: 15,
      description: 'Number of loans taken',
      status: 'EXCELLENT',
      data: { totalLoans: 20 },
      improvements: [],
    },
    {
      id: 'repayment_history',
      name: 'Repayment History',
      score: 100,
      maxScore: 100,
      weight: 15,
      description: 'On-time repayments',
      status: 'EXCELLENT',
      data: { totalLoans: 20, onTimePayments: 20, latePayments: 0, missedPayments: 0 },
      improvements: [],
    },
    {
      id: 'asset_diversity',
      name: 'Asset Diversity',
      score: 100,
      maxScore: 100,
      weight: 10,
      description: 'Number of unique assets held',
      status: 'EXCELLENT',
      data: { uniqueAssets: 10 },
      improvements: [],
    },
    {
      id: 'collateralization',
      name: 'Collateralization',
      score: 100,
      maxScore: 100,
      weight: 15,
      description: 'Average collateralization ratio',
      status: 'EXCELLENT',
      data: { timeWeightedAverage: 2.5 },
      improvements: [],
    },
    {
      id: 'liquidation_history',
      name: 'Liquidation History',
      score: 100,
      maxScore: 100,
      weight: 10,
      description: 'Number of liquidations',
      status: 'EXCELLENT',
      data: { totalLiquidations: 0 },
      improvements: [],
    },
  ],
  benefits: {
    maxLTV: 90,
    interestRateDiscount: 5,
    maxBorrowAmount: 100000,
    priorityAccess: true,
    liquidationBuffer: 10,
  },
  recommendations: [],
  riskLevel: 'LOW',
  lastUpdated: new Date(),
};

const CreditScoreComponent: React.FC<CreditScoreComponentProps> = ({
  walletAddress,
  poolId = 'CCLBPEYS3XFK65MYYXSBMOGKUI4ODN5S7SUZBGD7NALUQF64QILLX5B5', // Default to main pool
  onScoreCalculated,
}) => {
  const theme = useTheme();
  const { connected } = useWallet();
  const [creditData, setCreditData] = useState<CreditScoreData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blendIntegration, setBlendIntegration] = useState<BlendCreditIntegrationService | null>(
    null
  );
  const [useDummy, setUseDummy] = useState(false);

  // DEBUG: Log key state on every render
  console.log('CreditScoreComponent render', {
    connected,
    walletAddress,
    creditData,
    isLoading,
    error,
  });

  // Hooks for Blend Protocol integration
  const { data: poolMeta } = usePoolMeta(poolId);
  const { data: pool } = usePool(poolMeta);

  // Services
  const stellarDataService = new StellarDataService();
  const creditScoringAlgorithm = new CreditScoringAlgorithm();

  // Use dummy or real data based on toggle
  const displayWallet = useDummy ? DUMMY_WALLET : walletAddress;
  const displayCreditData = useDummy ? DUMMY_CREDIT_DATA : creditData;

  const calculateCreditScore = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch real wallet data
      const onChainData = await stellarDataService.fetchOnChainData(displayWallet);
      const scoreData = creditScoringAlgorithm.calculateCreditScore(onChainData);

      setCreditData(scoreData);
      onScoreCalculated?.(scoreData);

      // Create Blend Protocol integration if pool is available
      if (pool && scoreData) {
        const integration = new BlendCreditIntegrationService(pool, scoreData);
        setBlendIntegration(integration);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to calculate credit score');
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 850) return theme.palette.success.main;
    if (score >= 700) return theme.palette.info.main;
    if (score >= 550) return theme.palette.warning.main;
    if (score >= 400) return theme.palette.error.main;
    return theme.palette.grey[500];
  };

  const getFactorColor = (factor: CreditFactor): string => {
    const percentage = (factor.score / factor.maxScore) * 100;
    if (percentage >= 80) return theme.palette.success.main;
    if (percentage >= 60) return theme.palette.info.main;
    if (percentage >= 40) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  const getGradeDescription = (grade: string): string => {
    const descriptions = {
      EXCELLENT: 'Outstanding credit profile with access to premium lending terms',
      GOOD: 'Strong credit profile with favorable lending terms',
      FAIR: 'Decent credit profile with standard lending terms',
      POOR: 'Weak credit profile with limited lending options',
      VERY_POOR: 'Very poor credit profile with restricted access',
    };
    return descriptions[grade as keyof typeof descriptions] || '';
  };

  const handleShareScore = () => {
    if (displayCreditData) {
      const shareText = `My Stellar Blend DeFi Credit Score: ${displayCreditData.totalScore}/1000 (${displayCreditData.grade})`;
      if (navigator.share) {
        navigator.share({
          title: 'Stellar Blend DeFi Credit Score',
          text: shareText,
          url: window.location.href,
        });
      } else {
        navigator.clipboard.writeText(shareText);
        // You might want to show a toast notification here
      }
    }
  };

  // Auto-trigger credit score calculation when wallet is available
  useEffect(() => {
    console.log('CreditScoreComponent useEffect', {
      connected,
      walletAddress,
      creditData,
      isLoading,
      error,
    });
    if (connected && walletAddress && !creditData && !isLoading && !error) {
      calculateCreditScore();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, walletAddress]);

  // Fallback: if connected and walletAddress but no creditData after 2s, trigger calculation
  useEffect(() => {
    if (connected && walletAddress && !creditData && !isLoading && !error) {
      const timeout = setTimeout(() => {
        if (!creditData && !isLoading && !error) {
          calculateCreditScore();
        }
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [connected, walletAddress, creditData, isLoading, error]);

  if (isLoading) {
    return (
      <Box textAlign="center" py={8}>
        <Box mb={3}>
          <label style={{ fontWeight: 'bold', fontSize: 16 }}>
            <input
              type="checkbox"
              checked={useDummy}
              onChange={() => setUseDummy((v) => !v)}
              style={{ marginRight: 8 }}
            />
            Demo Mode (Show Good Score)
          </label>
        </Box>
        <CircularProgress size={80} thickness={4} />
        <Typography variant="h5" sx={{ mt: 3, mb: 1 }}>
          Analyzing Your Credit Profile
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Processing your on-chain data and DeFi activity...
        </Typography>
        <Box sx={{ mt: 2, maxWidth: 400, mx: 'auto' }}>
          <Typography variant="body2" color="text.secondary">
            This may take a few moments while we analyze your transaction history, lending patterns,
            and risk metrics.
          </Typography>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Box mb={3}>
          <label style={{ fontWeight: 'bold', fontSize: 16 }}>
            <input
              type="checkbox"
              checked={useDummy}
              onChange={() => setUseDummy((v) => !v)}
              style={{ marginRight: 8 }}
            />
            Demo Mode (Show Good Score)
          </label>
        </Box>
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="h6">Unable to Calculate Credit Score</Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            {error}
          </Typography>
          <Button
            variant="contained"
            color="error"
            onClick={calculateCreditScore}
            sx={{ mt: 2 }}
            startIcon={<RefreshIcon />}
          >
            Try Again
          </Button>
        </Alert>
      </Box>
    );
  }

  if (!displayCreditData && !isLoading) {
    return (
      <Box>
        <Box mb={3}>
          <label style={{ fontWeight: 'bold', fontSize: 16 }}>
            <input
              type="checkbox"
              checked={useDummy}
              onChange={() => setUseDummy((v) => !v)}
              style={{ marginRight: 8 }}
            />
            Demo Mode (Show Good Score)
          </label>
        </Box>
        <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
          <CardContent>
            <Box textAlign="center" py={6}>
              <CreditScoreIcon sx={{ fontSize: 80, color: 'white', mb: 3 }} />
              <Typography variant="h4" gutterBottom sx={{ color: 'white', fontWeight: 'bold' }}>
                Get Your DeFi Credit Score
              </Typography>
              <Typography variant="h6" color="rgba(255,255,255,0.8)" gutterBottom sx={{ mb: 4 }}>
                Unlock better lending terms with our comprehensive credit analysis
              </Typography>
              <Button
                variant="contained"
                size="large"
                onClick={calculateCreditScore}
                sx={{
                  mt: 2,
                  py: 1.5,
                  px: 4,
                  backgroundColor: 'white',
                  color: 'primary.main',
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.9)',
                  },
                }}
              >
                Analyze My Wallet
              </Button>
              <Typography variant="body2" color="white" sx={{ mt: 2 }}>
                If the results do not appear automatically, click the button above.
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>
    );
  }

  // Use displayWallet and displayCreditData for all UI below
  if (!displayCreditData) return null; // Ensure non-null for the rest of the render

  return (
    <Box>
      <Box mb={3}>
        <label style={{ fontWeight: 'bold', fontSize: 16 }}>
          <input
            type="checkbox"
            checked={useDummy}
            onChange={() => setUseDummy((v) => !v)}
            style={{ marginRight: 8 }}
          />
          Demo Mode (Show Good Score)
        </label>
      </Box>
      {/* Wallet Info Banner */}
      <Alert severity="success" sx={{ mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h6">📊 Live Wallet Analysis</Typography>
            <Typography variant="body2">
              Analyzing wallet: {displayWallet.substring(0, 12)}...
              {displayWallet.substring(displayWallet.length - 8)}
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={calculateCreditScore}
            sx={{ borderColor: 'success.main', color: 'success.main' }}
            disabled={useDummy}
          >
            Refresh Score
          </Button>
        </Box>
      </Alert>

      {/* Enhanced Score Display */}
      <Card
        sx={{
          mb: 4,
          background: `linear-gradient(135deg, ${getScoreColor(
            displayCreditData!.totalScore
          )}15, ${getScoreColor(displayCreditData!.totalScore)}05)`,
          border: `2px solid ${getScoreColor(displayCreditData!.totalScore)}30`,
          boxShadow: `0 8px 32px ${getScoreColor(displayCreditData!.totalScore)}20`,
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={4}>
              <Box textAlign="center">
                <Box
                  sx={{
                    position: 'relative',
                    display: 'inline-block',
                    mb: 2,
                  }}
                >
                  <CircularProgress
                    variant="determinate"
                    value={100}
                    size={160}
                    thickness={4}
                    sx={{
                      color: `${getScoreColor(displayCreditData!.totalScore)}20`,
                      position: 'absolute',
                    }}
                  />
                  <CircularProgress
                    variant="determinate"
                    value={displayCreditData!.totalScore / 10}
                    size={160}
                    thickness={4}
                    sx={{
                      color: getScoreColor(displayCreditData!.totalScore),
                    }}
                  />
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      bottom: 0,
                      right: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'column',
                    }}
                  >
                    <Typography
                      variant="h3"
                      component="div"
                      sx={{
                        color: getScoreColor(displayCreditData!.totalScore),
                        fontWeight: 'bold',
                        lineHeight: 1,
                      }}
                    >
                      {displayCreditData!.totalScore}
                    </Typography>
                    <Typography variant="body2" component="div" color="text.secondary">
                      out of 1000
                    </Typography>
                  </Box>
                </Box>
                <Chip
                  label={displayCreditData!.grade}
                  sx={{
                    backgroundColor: getScoreColor(displayCreditData!.totalScore),
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '0.9rem',
                    px: 2,
                    py: 0.5,
                  }}
                />
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                🎯 Credit Benefits
              </Typography>
              <List dense>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <TrendingUpIcon sx={{ color: getScoreColor(displayCreditData!.totalScore) }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Max LTV Ratio"
                    secondary={
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 'bold',
                          color: getScoreColor(displayCreditData!.totalScore),
                        }}
                      >
                        {displayCreditData!.benefits.maxLTV.toFixed(1)}%
                      </Typography>
                    }
                  />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <SecurityIcon sx={{ color: getScoreColor(displayCreditData!.totalScore) }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Interest Discount"
                    secondary={
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 'bold',
                          color: getScoreColor(displayCreditData!.totalScore),
                        }}
                      >
                        {displayCreditData!.benefits.interestRateDiscount.toFixed(1)}%
                      </Typography>
                    }
                  />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <AccountBalanceIcon
                      sx={{ color: getScoreColor(displayCreditData!.totalScore) }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary="Max Borrow Amount"
                    secondary={
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 'bold',
                          color: getScoreColor(displayCreditData!.totalScore),
                        }}
                      >
                        ${displayCreditData!.benefits.maxBorrowAmount.toLocaleString()}
                      </Typography>
                    }
                  />
                </ListItem>
              </List>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                📈 Score Analysis
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                {getGradeDescription(displayCreditData!.grade)}
              </Typography>
              <Box display="flex" gap={2} mt={3}>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={calculateCreditScore}
                  sx={{
                    flex: 1,
                    borderColor: getScoreColor(displayCreditData!.totalScore),
                    color: getScoreColor(displayCreditData!.totalScore),
                    '&:hover': {
                      borderColor: getScoreColor(displayCreditData!.totalScore),
                      backgroundColor: `${getScoreColor(displayCreditData!.totalScore)}10`,
                    },
                  }}
                  disabled={useDummy}
                >
                  Refresh
                </Button>
                <Button
                  variant="contained"
                  startIcon={<ShareIcon />}
                  onClick={handleShareScore}
                  sx={{
                    flex: 1,
                    backgroundColor: getScoreColor(displayCreditData!.totalScore),
                    '&:hover': {
                      backgroundColor: getScoreColor(displayCreditData!.totalScore),
                      opacity: 0.9,
                    },
                  }}
                >
                  Share
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Real Blend Protocol Integration */}
      {!useDummy && blendIntegration && pool && (
        <Card sx={{ mb: 4, border: '2px solid', borderColor: 'success.main' }}>
          <CardContent sx={{ p: 4 }}>
            <Typography
              variant="h5"
              gutterBottom
              sx={{ fontWeight: 'bold', color: 'success.main' }}
            >
              🔗 Live Blend Protocol Integration
            </Typography>
            <Alert severity="success" sx={{ mb: 3 }}>
              <Typography variant="body1">
                <strong>Your credit score is now actively integrated with Blend Protocol!</strong>
                The terms below are your actual personalized lending parameters.
              </Typography>
            </Alert>

            <Grid container spacing={3}>
              {Array.from(pool.reserves.entries())
                .slice(0, 3)
                .map(([assetId, reserve]) => {
                  const lendingTerms = blendIntegration.getLendingTermsSummary(reserve, 100000);
                  const underCollateralizedCheck = blendIntegration.checkUnderCollateralizedLending(
                    50000,
                    100000
                  );

                  return (
                    <Grid item xs={12} md={4} key={assetId}>
                      <Paper
                        sx={{
                          p: 3,
                          border: '1px solid',
                          borderColor: 'success.main',
                          borderRadius: 2,
                          background: 'linear-gradient(135deg, #4caf5010, #4caf5005)',
                        }}
                      >
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                          {assetId.substring(0, 10)}... Asset
                        </Typography>

                        <Box sx={{ mt: 2 }}>
                          <Typography variant="body2" color="text.secondary">
                            <strong>Your Personalized Terms:</strong>
                          </Typography>
                          <List dense>
                            <ListItem sx={{ px: 0 }}>
                              <ListItemText
                                primary="Max LTV"
                                secondary={
                                  <Typography
                                    variant="body2"
                                    sx={{ fontWeight: 'bold', color: 'success.main' }}
                                  >
                                    {(lendingTerms.maxLTV * 100).toFixed(1)}%
                                    <Typography
                                      component="span"
                                      variant="caption"
                                      color="text.secondary"
                                    >
                                      {' '}
                                      (vs 80% standard)
                                    </Typography>
                                  </Typography>
                                }
                              />
                            </ListItem>
                            <ListItem sx={{ px: 0 }}>
                              <ListItemText
                                primary="Interest Rate"
                                secondary={
                                  <Typography
                                    variant="body2"
                                    sx={{ fontWeight: 'bold', color: 'success.main' }}
                                  >
                                    {(lendingTerms.interestRate * 100).toFixed(2)}%
                                    <Typography
                                      component="span"
                                      variant="caption"
                                      color="text.secondary"
                                    >
                                      {' '}
                                      (vs 8% standard)
                                    </Typography>
                                  </Typography>
                                }
                              />
                            </ListItem>
                            <ListItem sx={{ px: 0 }}>
                              <ListItemText
                                primary="Liquidation Buffer"
                                secondary={
                                  <Typography
                                    variant="body2"
                                    sx={{ fontWeight: 'bold', color: 'success.main' }}
                                  >
                                    {(lendingTerms.liquidationThreshold * 100).toFixed(1)}%
                                    <Typography
                                      component="span"
                                      variant="caption"
                                      color="text.secondary"
                                    >
                                      {' '}
                                      (vs 85% standard)
                                    </Typography>
                                  </Typography>
                                }
                              />
                            </ListItem>
                          </List>
                        </Box>

                        {underCollateralizedCheck.qualifies && (
                          <Box
                            sx={{ mt: 2, p: 2, backgroundColor: 'success.light', borderRadius: 1 }}
                          >
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 'bold', color: 'success.dark' }}
                            >
                              ✅ Under-Collateralized Lending Available
                            </Typography>
                            <Typography variant="caption" color="success.dark">
                              You qualify for loans up to $
                              {underCollateralizedCheck.creditBasedLimit.toLocaleString()}
                              with minimal collateral requirements.
                            </Typography>
                          </Box>
                        )}
                      </Paper>
                    </Grid>
                  );
                })}
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Under-Collateralized Lending Demo */}
      {!useDummy && displayCreditData && blendIntegration && (
        <UnderCollateralizedLending
          creditData={displayCreditData}
          blendIntegration={blendIntegration}
        />
      )}

      {/* Dummy Blend/Under-Collateralized sections for demo mode */}
      {useDummy && (
        <>
          <Card sx={{ mb: 4, border: '2px solid', borderColor: 'success.main' }}>
            <CardContent sx={{ p: 4 }}>
              <Typography
                variant="h5"
                gutterBottom
                sx={{ fontWeight: 'bold', color: 'success.main' }}
              >
                🔗 Demo Blend Protocol Integration
              </Typography>
              <Alert severity="success" sx={{ mb: 3 }}>
                <Typography variant="body1">
                  <strong>
                    This is a demo of Blend Protocol integration for a high credit score wallet.
                  </strong>
                  The terms below are sample personalized lending parameters.
                </Typography>
              </Alert>
              <Grid container spacing={3}>
                {[1, 2, 3].map((idx) => (
                  <Grid item xs={12} md={4} key={idx}>
                    <Paper
                      sx={{
                        p: 3,
                        border: '1px solid',
                        borderColor: 'success.main',
                        borderRadius: 2,
                        background: 'linear-gradient(135deg, #4caf5010, #4caf5005)',
                      }}
                    >
                      <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                        DEMO-ASSET-{idx}
                      </Typography>
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Your Personalized Terms:</strong>
                        </Typography>
                        <List dense>
                          <ListItem sx={{ px: 0 }}>
                            <ListItemText
                              primary="Max LTV"
                              secondary={
                                <Typography
                                  variant="body2"
                                  sx={{ fontWeight: 'bold', color: 'success.main' }}
                                >
                                  90.0%
                                  <Typography
                                    component="span"
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    {' '}
                                    (vs 80% standard)
                                  </Typography>
                                </Typography>
                              }
                            />
                          </ListItem>
                          <ListItem sx={{ px: 0 }}>
                            <ListItemText
                              primary="Interest Rate"
                              secondary={
                                <Typography
                                  variant="body2"
                                  sx={{ fontWeight: 'bold', color: 'success.main' }}
                                >
                                  3.00%
                                  <Typography
                                    component="span"
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    {' '}
                                    (vs 8% standard)
                                  </Typography>
                                </Typography>
                              }
                            />
                          </ListItem>
                          <ListItem sx={{ px: 0 }}>
                            <ListItemText
                              primary="Liquidation Buffer"
                              secondary={
                                <Typography
                                  variant="body2"
                                  sx={{ fontWeight: 'bold', color: 'success.main' }}
                                >
                                  10.0%
                                  <Typography
                                    component="span"
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    {' '}
                                    (vs 85% standard)
                                  </Typography>
                                </Typography>
                              }
                            />
                          </ListItem>
                        </List>
                      </Box>
                      <Box sx={{ mt: 2, p: 2, backgroundColor: 'success.light', borderRadius: 1 }}>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 'bold', color: 'success.dark' }}
                        >
                          ✅ Under-Collateralized Lending Available
                        </Typography>
                        <Typography variant="caption" color="success.dark">
                          You qualify for loans up to $100,000 with minimal collateral requirements.
                        </Typography>
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </>
      )}

      {/* Enhanced Factor Breakdown */}
      <Card sx={{ mb: 4 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
            <TimelineIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
            Credit Score Breakdown
          </Typography>
          <Grid container spacing={3}>
            {displayCreditData.factors.map((factor, index) => (
              <Grid item xs={12} md={6} key={factor.id}>
                <Paper
                  sx={{
                    p: 3,
                    border: `2px solid ${getFactorColor(factor)}30`,
                    borderRadius: 2,
                    background: `linear-gradient(135deg, ${getFactorColor(
                      factor
                    )}05, ${getFactorColor(factor)}02)`,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: `0 8px 25px ${getFactorColor(factor)}20`,
                    },
                  }}
                >
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Box display="flex" alignItems="center">
                      <Typography
                        variant="h6"
                        fontWeight="bold"
                        sx={{ color: getFactorColor(factor) }}
                      >
                        {factor.name}
                        {factor.id === 'wallet_age' && factor.data?.months !== undefined && (
                          <Typography
                            variant="body2"
                            component="span"
                            sx={{ ml: 1, color: 'text.secondary', fontWeight: 'normal' }}
                          >
                            ({factor.data.months} months)
                          </Typography>
                        )}
                        {factor.id === 'transaction_history' &&
                          factor.data?.totalTransactions !== undefined && (
                            <Typography
                              variant="body2"
                              component="span"
                              sx={{ ml: 1, color: 'text.secondary', fontWeight: 'normal' }}
                            >
                              ({factor.data.totalTransactions} txns)
                            </Typography>
                          )}
                        {factor.id === 'repayment_history' &&
                          factor.data?.totalLoans !== undefined && (
                            <Typography
                              variant="body2"
                              component="span"
                              sx={{ ml: 1, color: 'text.secondary', fontWeight: 'normal' }}
                            >
                              ({factor.data.totalLoans} loans, {factor.data.onTimePayments} on-time,{' '}
                              {factor.data.latePayments} late, {factor.data.missedPayments} missed)
                            </Typography>
                          )}
                        {factor.id === 'collateralization' &&
                          factor.data?.timeWeightedAverage !== undefined && (
                            <Typography
                              variant="body2"
                              component="span"
                              sx={{ ml: 1, color: 'text.secondary', fontWeight: 'normal' }}
                            >
                              (Avg: {factor.data.timeWeightedAverage.toFixed(2)}x)
                            </Typography>
                          )}
                        {factor.id === 'liquidation_history' &&
                          factor.data?.totalLiquidations !== undefined && (
                            <Typography
                              variant="body2"
                              component="span"
                              sx={{ ml: 1, color: 'text.secondary', fontWeight: 'normal' }}
                            >
                              ({factor.data.totalLiquidations} liquidations)
                            </Typography>
                          )}
                        {factor.id === 'asset_diversity' &&
                          factor.data?.uniqueAssets !== undefined && (
                            <Typography
                              variant="body2"
                              component="span"
                              sx={{ ml: 1, color: 'text.secondary', fontWeight: 'normal' }}
                            >
                              ({factor.data.uniqueAssets} assets)
                            </Typography>
                          )}
                        {factor.id === 'loan_activity' && factor.data?.totalLoans !== undefined && (
                          <Typography
                            variant="body2"
                            component="span"
                            sx={{ ml: 1, color: 'text.secondary', fontWeight: 'normal' }}
                          >
                            ({factor.data.totalLoans} loans)
                          </Typography>
                        )}
                      </Typography>
                      <Tooltip title={factor.description}>
                        <InfoIcon sx={{ ml: 1, fontSize: 18, color: 'text.secondary' }} />
                      </Tooltip>
                    </Box>
                    <Chip
                      label={`${Math.round((factor.score / factor.maxScore) * 100)}%`}
                      sx={{
                        backgroundColor: getFactorColor(factor),
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '0.9rem',
                      }}
                    />
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={(factor.score / factor.maxScore) * 100}
                    sx={{
                      height: 12,
                      borderRadius: 6,
                      backgroundColor: `${getFactorColor(factor)}20`,
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: getFactorColor(factor),
                        borderRadius: 6,
                      },
                    }}
                  />
                  <Box display="flex" justifyContent="space-between" mt={2}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {Math.round(factor.score)}/{factor.maxScore} points
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Weight: {factor.weight}%
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Improvement Suggestions */}
      <ImprovementSuggestions
        currentScore={displayCreditData.totalScore}
        factors={displayCreditData.factors}
      />

      {/* Enhanced Detailed Factor Analysis */}
      <Card sx={{ mb: 4 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
            🔍 Detailed Factor Analysis
          </Typography>
          {displayCreditData.factors.map((factor) => (
            <Accordion
              key={factor.id}
              sx={{
                mb: 1,
                border: `1px solid ${getFactorColor(factor)}30`,
                borderRadius: 2,
                '&:before': {
                  display: 'none',
                },
                '&.Mui-expanded': {
                  margin: '0 0 8px 0',
                  boxShadow: `0 4px 20px ${getFactorColor(factor)}20`,
                },
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  backgroundColor: `${getFactorColor(factor)}05`,
                  '&.Mui-expanded': {
                    backgroundColor: `${getFactorColor(factor)}10`,
                  },
                }}
              >
                <Box display="flex" alignItems="center" width="100%">
                  <Typography
                    variant="h6"
                    fontWeight="bold"
                    sx={{ flex: 1, color: getFactorColor(factor) }}
                  >
                    {factor.name}
                    {factor.id === 'wallet_age' && factor.data?.months !== undefined && (
                      <Typography
                        variant="body2"
                        component="span"
                        sx={{ ml: 1, color: 'text.secondary', fontWeight: 'normal' }}
                      >
                        ({factor.data.months} months)
                      </Typography>
                    )}
                    {factor.id === 'transaction_history' &&
                      factor.data?.totalTransactions !== undefined && (
                        <Typography
                          variant="body2"
                          component="span"
                          sx={{ ml: 1, color: 'text.secondary', fontWeight: 'normal' }}
                        >
                          ({factor.data.totalTransactions} txns)
                        </Typography>
                      )}
                    {factor.id === 'repayment_history' && factor.data?.totalLoans !== undefined && (
                      <Typography
                        variant="body2"
                        component="span"
                        sx={{ ml: 1, color: 'text.secondary', fontWeight: 'normal' }}
                      >
                        ({factor.data.totalLoans} loans, {factor.data.onTimePayments} on-time,{' '}
                        {factor.data.latePayments} late, {factor.data.missedPayments} missed)
                      </Typography>
                    )}
                    {factor.id === 'collateralization' &&
                      factor.data?.timeWeightedAverage !== undefined && (
                        <Typography
                          variant="body2"
                          component="span"
                          sx={{ ml: 1, color: 'text.secondary', fontWeight: 'normal' }}
                        >
                          (Avg: {factor.data.timeWeightedAverage.toFixed(2)}x)
                        </Typography>
                      )}
                    {factor.id === 'liquidation_history' &&
                      factor.data?.totalLiquidations !== undefined && (
                        <Typography
                          variant="body2"
                          component="span"
                          sx={{ ml: 1, color: 'text.secondary', fontWeight: 'normal' }}
                        >
                          ({factor.data.totalLiquidations} liquidations)
                        </Typography>
                      )}
                    {factor.id === 'asset_diversity' && factor.data?.uniqueAssets !== undefined && (
                      <Typography
                        variant="body2"
                        component="span"
                        sx={{ ml: 1, color: 'text.secondary', fontWeight: 'normal' }}
                      >
                        ({factor.data.uniqueAssets} assets)
                      </Typography>
                    )}
                    {factor.id === 'loan_activity' && factor.data?.totalLoans !== undefined && (
                      <Typography
                        variant="body2"
                        component="span"
                        sx={{ ml: 1, color: 'text.secondary', fontWeight: 'normal' }}
                      >
                        ({factor.data.totalLoans} loans)
                      </Typography>
                    )}
                  </Typography>
                  <Chip
                    label={factor.status}
                    size="small"
                    sx={{
                      backgroundColor: getFactorColor(factor),
                      color: 'white',
                      fontWeight: 'bold',
                      mr: 2,
                    }}
                  />
                  <Typography
                    variant="body1"
                    sx={{ fontWeight: 'bold', color: getFactorColor(factor) }}
                  >
                    {factor.score}/{factor.maxScore} points
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 3 }}>
                <Typography variant="body1" color="text.secondary" paragraph>
                  {factor.description}
                </Typography>
                <Box sx={{ mt: 3, p: 2, backgroundColor: 'background.paper', borderRadius: 1 }}>
                  <Typography variant="body1" fontWeight="bold" gutterBottom>
                    Performance Analysis:
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {factor.status === 'EXCELLENT' &&
                      '🌟 Exceptional performance in this area. Keep up the excellent work!'}
                    {factor.status === 'GOOD' &&
                      '✅ Strong performance with room for minor improvements.'}
                    {factor.status === 'FAIR' &&
                      '⚠️ Average performance. Consider focusing on improvements in this area.'}
                    {factor.status === 'POOR' &&
                      '❌ Below average performance. This area needs significant attention.'}
                    {factor.status === 'VERY_POOR' &&
                      '🚨 Very poor performance. This is a critical area requiring immediate attention.'}
                  </Typography>
                </Box>
              </AccordionDetails>
            </Accordion>
          ))}
        </CardContent>
      </Card>

      {/* Enhanced Blend Protocol Integration */}
      <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ color: 'white', fontWeight: 'bold' }}>
            🚀 Blend Protocol Integration
          </Typography>
          <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.9)', mb: 4 }}>
            Your credit score directly impacts your borrowing terms on Blend Protocol
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  p: 3,
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: 2,
                  border: '1px solid rgba(255,255,255,0.2)',
                }}
              >
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold', mb: 2 }}>
                  💎 Your Current Benefits
                </Typography>
                <List dense>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemText
                      primary={<Typography sx={{ color: 'white' }}>Maximum LTV Ratio</Typography>}
                      secondary={
                        <Typography
                          sx={{
                            color: 'rgba(255,255,255,0.8)',
                            fontWeight: 'bold',
                            fontSize: '1.1rem',
                          }}
                        >
                          {displayCreditData.benefits.maxLTV.toFixed(1)}%
                        </Typography>
                      }
                    />
                  </ListItem>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemText
                      primary={
                        <Typography sx={{ color: 'white' }}>Interest Rate Discount</Typography>
                      }
                      secondary={
                        <Typography
                          sx={{
                            color: 'rgba(255,255,255,0.8)',
                            fontWeight: 'bold',
                            fontSize: '1.1rem',
                          }}
                        >
                          {displayCreditData.benefits.interestRateDiscount.toFixed(1)}%
                        </Typography>
                      }
                    />
                  </ListItem>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemText
                      primary={<Typography sx={{ color: 'white' }}>Liquidation Buffer</Typography>}
                      secondary={
                        <Typography
                          sx={{
                            color: 'rgba(255,255,255,0.8)',
                            fontWeight: 'bold',
                            fontSize: '1.1rem',
                          }}
                        >
                          {displayCreditData.benefits.liquidationBuffer.toFixed(1)}%
                        </Typography>
                      }
                    />
                  </ListItem>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemText
                      primary={<Typography sx={{ color: 'white' }}>Priority Access</Typography>}
                      secondary={
                        <Typography
                          sx={{
                            color: 'rgba(255,255,255,0.8)',
                            fontWeight: 'bold',
                            fontSize: '1.1rem',
                          }}
                        >
                          {displayCreditData.benefits.priorityAccess ? '✅ Yes' : '❌ No'}
                        </Typography>
                      }
                    />
                  </ListItem>
                </List>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  p: 3,
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: 2,
                  border: '1px solid rgba(255,255,255,0.2)',
                }}
              >
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold', mb: 2 }}>
                  📊 Score Tiers
                </Typography>
                <List dense>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemText
                      primary={<Typography sx={{ color: 'white' }}>Excellent (850+)</Typography>}
                      secondary={
                        <Typography sx={{ color: 'rgba(255,255,255,0.8)' }}>
                          Premium rates, max LTV 90%
                        </Typography>
                      }
                    />
                  </ListItem>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemText
                      primary={<Typography sx={{ color: 'white' }}>Good (700-849)</Typography>}
                      secondary={
                        <Typography sx={{ color: 'rgba(255,255,255,0.8)' }}>
                          Favorable rates, max LTV 80%
                        </Typography>
                      }
                    />
                  </ListItem>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemText
                      primary={<Typography sx={{ color: 'white' }}>Fair (550-699)</Typography>}
                      secondary={
                        <Typography sx={{ color: 'rgba(255,255,255,0.8)' }}>
                          Standard rates, max LTV 70%
                        </Typography>
                      }
                    />
                  </ListItem>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemText
                      primary={<Typography sx={{ color: 'white' }}>Poor (400-549)</Typography>}
                      secondary={
                        <Typography sx={{ color: 'rgba(255,255,255,0.8)' }}>
                          Higher rates, max LTV 60%
                        </Typography>
                      }
                    />
                  </ListItem>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemText
                      primary={<Typography sx={{ color: 'white' }}>Very Poor (&lt;400)</Typography>}
                      secondary={
                        <Typography sx={{ color: 'rgba(255,255,255,0.8)' }}>
                          Highest rates, max LTV 50%
                        </Typography>
                      }
                    />
                  </ListItem>
                </List>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default CreditScoreComponent;

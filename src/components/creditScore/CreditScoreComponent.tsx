import CreditScoreIcon from '@mui/icons-material/CreditScore';
import RefreshIcon from '@mui/icons-material/Refresh';
import { Alert, Box, Button, Card, CardContent, Typography } from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';
import { useTheme } from '@mui/material/styles';
import { useEffect, useState } from 'react';
import { usePool, usePoolMeta } from '../../hooks/api';
import { BlendCreditIntegrationService } from '../../services/blendCreditIntegration';
import { StellarDataService } from '../../services/stellarDataService';
import { CreditScoringAlgorithm } from '../../utils/creditScoring';

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
  connected?: boolean;
}

const CreditScoreComponent: React.FC<CreditScoreComponentProps> = ({
  walletAddress,
  poolId = 'CCLBPEYS3XFK65MYYXSBMOGKUI4ODN5S7SUZBGD7NALUQF64QILLX5B5', // Default to main pool
  onScoreCalculated,
  connected = false,
}) => {
  const theme = useTheme();
  const [creditData, setCreditData] = useState<CreditScoreData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blendIntegration, setBlendIntegration] = useState<BlendCreditIntegrationService | null>(
    null
  );

  // Hooks for Blend Protocol integration
  const { data: poolMeta } = usePoolMeta(poolId);
  const { data: pool } = usePool(poolMeta);

  // Services
  const stellarDataService = new StellarDataService();
  const creditScoringAlgorithm = new CreditScoringAlgorithm();

  const calculateCreditScore = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch real wallet data
      const onChainData = await stellarDataService.fetchOnChainData(walletAddress);
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
    if (creditData) {
      const shareText = `My Stellar Blend DeFi Credit Score: ${creditData.totalScore}/1000 (${creditData.grade})`;
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
    console.log('CreditScoreComponent effect:', {
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

  if (!connected) {
    return (
      <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <CardContent>
          <Box textAlign="center" py={6}>
            <CreditScoreIcon sx={{ fontSize: 80, color: 'white', mb: 3 }} />
            <Typography variant="h4" gutterBottom sx={{ color: 'white', fontWeight: 'bold' }}>
              Connect Wallet to Get Started
            </Typography>
            <Typography variant="h6" color="rgba(255,255,255,0.8)" gutterBottom sx={{ mb: 4 }}>
              Please connect your wallet to access your DeFi credit score and personalized lending
              terms.
            </Typography>
            <Button
              variant="contained"
              size="large"
              // onClick logic here if needed
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
              Connect Wallet
            </Button>
          </Box>
        </CardContent>
      </Card>
    );
  }
  if (isLoading) {
    return (
      <Box textAlign="center" py={8}>
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
  if (!creditData && !isLoading) {
    return (
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
              // onClick logic here if needed
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
    );
  }
  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        <Typography variant="h6">Unable to Calculate Credit Score</Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>
          {error}
        </Typography>
        <Button
          variant="contained"
          color="error"
          // onClick logic here if needed
          sx={{ mt: 2 }}
          startIcon={<RefreshIcon />}
        >
          Try Again
        </Button>
      </Alert>
    );
  }
  // If all states handled, return null (or main UI if you have it)
  return null;
};

export default CreditScoreComponent;

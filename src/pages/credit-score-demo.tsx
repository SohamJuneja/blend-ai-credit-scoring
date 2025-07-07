import { Alert, Box, Container, Typography } from '@mui/material';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import EnvironmentDebug from '../components/debug/EnvironmentDebug';
import { useWallet } from '../contexts/wallet';
import DefaultLayout from '../layouts/DefaultLayout';

// Dynamically import the component to avoid SSR issues
const CreditScoreComponent = dynamic(
  () => import('../components/creditScore/CreditScoreComponent'),
  {
    ssr: false,
    loading: () => <Typography>Loading credit scoring system...</Typography>,
  }
);

const CreditScoreDemo = () => {
  const { walletAddress, connected } = useWallet();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <DefaultLayout>
        <Container maxWidth="lg">
          <Box sx={{ py: 4 }}>
            <Typography>Loading...</Typography>
          </Box>
        </Container>
      </DefaultLayout>
    );
  }

  if (!connected) {
    return (
      <DefaultLayout>
        <Container maxWidth="lg">
          <Box sx={{ py: 4 }}>
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="h6">Connect Your Wallet</Typography>
              <Typography variant="body2">
                Please connect your Stellar wallet to access the credit scoring system.
              </Typography>
            </Alert>

            {/* Debug information for troubleshooting */}
            <EnvironmentDebug />
          </Box>
        </Container>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout>
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          <Typography variant="h3" gutterBottom sx={{ fontWeight: 'bold', textAlign: 'center' }}>
            🏦 DeFi Credit Score System
          </Typography>
          <Typography variant="h6" sx={{ textAlign: 'center', mb: 4, color: 'text.secondary' }}>
            Integrated with Blend Protocol for Personalized Lending Terms
          </Typography>

          <Alert severity="success" sx={{ mb: 4 }}>
            <Typography variant="body1">
              <strong>🎉 Live Integration Demo:</strong> This credit scoring system is now fully
              integrated with Blend Protocol! Your credit score directly affects your actual lending
              terms including LTV ratios, interest rates, and liquidation thresholds.
            </Typography>
          </Alert>

          <CreditScoreComponent
            walletAddress={walletAddress}
            poolId="CCLBPEYS3XFK65MYYXSBMOGKUI4ODN5S7SUZBGD7NALUQF64QILLX5B5"
          />

          {/* Debug information for troubleshooting */}
          <EnvironmentDebug />
        </Box>
      </Container>
    </DefaultLayout>
  );
};

export default CreditScoreDemo;

import { Alert, Box, Container, Typography } from '@mui/material';
import DefaultLayout from '../layouts/DefaultLayout';
import CreditScoreComponent from '../components/creditScore/CreditScoreComponent';
import { useWallet } from '../contexts/wallet';

const CreditScoreDemo = () => {
  const { walletAddress, connected } = useWallet();

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
              <strong>🎉 Live Integration Demo:</strong> This credit scoring system is now fully integrated 
              with Blend Protocol! Your credit score directly affects your actual lending terms including 
              LTV ratios, interest rates, and liquidation thresholds.
            </Typography>
          </Alert>

          <CreditScoreComponent 
            walletAddress={walletAddress}
            poolId="CCLBPEYS3XFK65MYYXSBMOGKUI4ODN5S7SUZBGD7NALUQF64QILLX5B5"
          />
        </Box>
      </Container>
    </DefaultLayout>
  );
};

export default CreditScoreDemo;

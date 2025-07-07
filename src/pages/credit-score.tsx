import { Alert, Box, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import type { NextPage } from 'next';
import CreditScoreComponent from '../components/creditScore/CreditScoreComponent';
import { useWallet } from '../contexts/wallet';

const CreditScoreSystem: NextPage = () => {
  const theme = useTheme();
  const { connected, walletAddress } = useWallet();

  if (!connected || !walletAddress) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom>
          Stellar Blend DeFi Credit Score
        </Typography>
        <Typography color="text.secondary" gutterBottom>
          Connect your wallet to calculate your comprehensive DeFi credit score
        </Typography>
        <Alert severity="info" sx={{ mt: 2, mb: 2, maxWidth: 600, mx: 'auto' }}>
          <Typography variant="h6" gutterBottom>
            🚀 Advanced Credit Scoring System
          </Typography>
          Our AI-powered system analyzes your on-chain activity across 7 key factors:
          <br />• Wallet Age & Transaction History
          <br />• Blend Protocol Repayment History
          <br />• Collateralization Management
          <br />• Liquidation History
          <br />• Asset Diversity
          <br />• Loan Activity Patterns
          <br />• Risk Assessment
        </Alert>
        <h3>Connect Wallet from the top to Get Started</h3>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1200, margin: '0 auto' }}>
      <Typography variant="h4" gutterBottom>
        Stellar Blend DeFi Credit Score
      </Typography>
      <Typography color="text.secondary" gutterBottom sx={{ mb: 3 }}>
        Comprehensive credit analysis for better DeFi lending terms
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          How Your Credit Score Works
        </Typography>
        Your score is calculated using a sophisticated 7-factor algorithm that analyzes your
        on-chain behavior, repayment history, and risk management patterns. Higher scores unlock
        better lending terms including lower interest rates, higher LTV ratios, and access to
        premium DeFi products.
      </Alert>

      <CreditScoreComponent
        walletAddress={walletAddress}
        onScoreCalculated={(score) => {
          console.log('Credit score calculated:', score);
        }}
      />
    </Box>
  );
};

export default CreditScoreSystem;

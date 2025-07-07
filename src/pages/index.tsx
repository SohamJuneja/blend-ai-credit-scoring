import CreditScoreIcon from '@mui/icons-material/CreditScore';
import { Box, Button, Card, CardContent, Grid, Typography } from '@mui/material';
import { useRouter } from 'next/router';

const Index = () => {
  const router = useRouter();

  const navigateToPage = (path: string) => {
    router.push(path);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h3" gutterBottom textAlign="center" sx={{ mb: 4 }}>
        Stellar Blend DeFi Credit Score
      </Typography>

      <Typography variant="h6" color="text.secondary" textAlign="center" sx={{ mb: 4 }}>
        Advanced credit scoring system for the Stellar Blend protocol
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6} lg={6}>
          <Card
            sx={{ height: '100%', cursor: 'pointer' }}
            onClick={() => navigateToPage('/credit-score')}
          >
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <CreditScoreIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
              <Typography variant="h5" gutterBottom>
                DeFi Credit Score System
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                Get your comprehensive DeFi credit score based on your on-chain activity, repayment
                history, and risk management patterns
              </Typography>
              <Button variant="contained" color="primary" size="large">
                Check Your Credit Score
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6} lg={6}>
          <Card
            sx={{
              height: '100%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
            }}
          >
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <Typography variant="h5" gutterBottom>
                🚀 Features
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                • 7-Factor Credit Algorithm
                <br />
                • AI-Powered Improvement Suggestions
                <br />
                • Score Simulation Tools
                <br />
                • Better Lending Terms
                <br />• Comprehensive Analytics
              </Typography>
              <Typography variant="body2" fontWeight="bold">
                Built for Stellar Hackathon 2025
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom>
          Credit Score Benefits
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Card sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h6" color="primary">
                Lower Interest Rates
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Up to 3% discount on borrowing rates
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h6" color="primary">
                Higher LTV Ratios
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Borrow up to 90% of collateral value
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h6" color="primary">
                Priority Access
              </Typography>
              <Typography variant="body2" color="text.secondary">
                First access to new lending products
              </Typography>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default Index;

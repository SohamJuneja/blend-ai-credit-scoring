import { Check as CheckIcon, Close as CloseIcon } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  List,
  ListItem,
  ListItemText,
  Paper,
  Slider,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useState } from 'react';
import { BlendCreditIntegrationService } from '../../services/blendCreditIntegration';
import { CreditScoreData } from '../../types/creditScore';

interface UnderCollateralizedLendingProps {
  creditData: CreditScoreData;
  blendIntegration: BlendCreditIntegrationService;
}

const UnderCollateralizedLending: React.FC<UnderCollateralizedLendingProps> = ({
  creditData,
  blendIntegration,
}) => {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [loanAmount, setLoanAmount] = useState(25000);
  const [collateralAmount, setCollateralAmount] = useState(50000);

  const underCollateralizedCheck = blendIntegration.checkUnderCollateralizedLending(
    loanAmount,
    collateralAmount
  );

  const traditionalLTV = 0.8; // 80% traditional LTV
  const traditionalCollateralRequired = loanAmount / traditionalLTV;
  const savings = traditionalCollateralRequired - underCollateralizedCheck.requiredCollateral;
  const actualSavings = Math.max(0, savings); // Only show positive savings

  const handleOpenDialog = () => {
    setOpen(true);
  };

  const handleCloseDialog = () => {
    setOpen(false);
  };

  const getQualificationColor = (qualifies: boolean) => {
    return qualifies ? theme.palette.success.main : theme.palette.error.main;
  };

  return (
    <>
      <Card sx={{ mb: 4, border: '2px solid', borderColor: 'primary.main' }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            🚀 Under-Collateralized Lending Demo
          </Typography>

          <Typography variant="body1" sx={{ mb: 3 }}>
            Your credit score of <strong>{creditData.totalScore}</strong> unlocks access to
            under-collateralized lending opportunities. See how much less collateral you need!
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, backgroundColor: 'background.default' }}>
                <Typography variant="h6" gutterBottom sx={{ color: 'error.main' }}>
                  ❌ Traditional DeFi Lending
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText
                      primary="Loan Amount"
                      secondary={`$${loanAmount.toLocaleString()}`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Required Collateral"
                      secondary={`$${traditionalCollateralRequired.toLocaleString()}`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="LTV Ratio" secondary="80% (Fixed)" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Interest Rate" secondary="8.0% (Standard)" />
                  </ListItem>
                </List>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, backgroundColor: 'success.light' }}>
                <Typography variant="h6" gutterBottom sx={{ color: 'success.dark' }}>
                  ✅ Credit-Based Lending (Blend + Credit Score)
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText
                      primary="Loan Amount"
                      secondary={`$${loanAmount.toLocaleString()}`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Required Collateral"
                      secondary={
                        <Box>
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: 'bold', color: 'success.dark' }}
                          >
                            ${underCollateralizedCheck.requiredCollateral.toLocaleString()}
                          </Typography>
                          {actualSavings > 0 && (
                            <Typography variant="caption" sx={{ color: 'success.main' }}>
                              Save ${actualSavings.toLocaleString()}!
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="LTV Ratio"
                      secondary={`${(underCollateralizedCheck.terms.maxLTV * 100).toFixed(
                        1
                      )}% (Credit-Based)`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Interest Rate"
                      secondary={`${(underCollateralizedCheck.terms.interestRate * 100).toFixed(
                        2
                      )}% (Credit-Based)`}
                    />
                  </ListItem>
                </List>
              </Paper>
            </Grid>
          </Grid>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Alert
              severity={underCollateralizedCheck.qualifies ? 'success' : 'warning'}
              sx={{ mb: 2 }}
            >
              <Typography variant="body1">
                {underCollateralizedCheck.qualifies ? (
                  <>
                    <strong>🎉 You qualify for under-collateralized lending!</strong>
                    Your credit score enables you to borrow with less collateral.
                  </>
                ) : (
                  <>
                    <strong>
                      ⚠️ You don&apos;t currently qualify for under-collateralized lending.
                    </strong>
                    Improve your credit score to unlock this feature.
                  </>
                )}
              </Typography>
            </Alert>

            <Button
              variant="contained"
              size="large"
              onClick={handleOpenDialog}
              sx={{
                backgroundColor: getQualificationColor(underCollateralizedCheck.qualifies),
                color: 'white',
                '&:hover': {
                  backgroundColor: getQualificationColor(underCollateralizedCheck.qualifies),
                  opacity: 0.9,
                },
              }}
            >
              {underCollateralizedCheck.qualifies ? 'Try Interactive Demo' : 'See How to Qualify'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Interactive Demo Dialog */}
      <Dialog open={open} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            🎮 Interactive Under-Collateralized Lending Demo
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 4 }}>
            <Typography variant="body1" sx={{ mb: 3 }}>
              Adjust the loan amount and see how your credit score affects collateral requirements
              in real-time:
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Loan Amount: ${loanAmount.toLocaleString()}
                </Typography>
                <Slider
                  value={loanAmount}
                  onChange={(_, newValue) => setLoanAmount(newValue as number)}
                  min={10000}
                  max={underCollateralizedCheck.creditBasedLimit}
                  step={5000}
                  marks={[
                    { value: 10000, label: '$10K' },
                    { value: 50000, label: '$50K' },
                    { value: underCollateralizedCheck.creditBasedLimit, label: 'Max' },
                  ]}
                  sx={{ mb: 3 }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Your Collateral: ${collateralAmount.toLocaleString()}
                </Typography>
                <Slider
                  value={collateralAmount}
                  onChange={(_, newValue) => setCollateralAmount(newValue as number)}
                  min={20000}
                  max={200000}
                  step={10000}
                  marks={[
                    { value: 20000, label: '$20K' },
                    { value: 100000, label: '$100K' },
                    { value: 200000, label: '$200K' },
                  ]}
                  sx={{ mb: 3 }}
                />
              </Grid>
            </Grid>

            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" gutterBottom>
                Real-Time Calculation Results:
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2, backgroundColor: 'error.light' }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'error.dark' }}>
                      Traditional DeFi Requirements
                    </Typography>
                    <Typography variant="body2">
                      Collateral needed: ${traditionalCollateralRequired.toLocaleString()}
                    </Typography>
                    <Typography variant="body2">LTV: 80% (Fixed)</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2, backgroundColor: 'success.light' }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'success.dark' }}>
                      Your Credit-Based Terms
                    </Typography>
                    <Typography variant="body2">
                      Collateral needed: $
                      {underCollateralizedCheck.requiredCollateral.toLocaleString()}
                    </Typography>
                    <Typography variant="body2">
                      LTV: {(underCollateralizedCheck.terms.maxLTV * 100).toFixed(1)}%
                      (Credit-Based)
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Chip
                  icon={underCollateralizedCheck.qualifies ? <CheckIcon /> : <CloseIcon />}
                  label={
                    underCollateralizedCheck.qualifies && actualSavings > 0
                      ? `✅ Approved! Save $${actualSavings.toLocaleString()} in collateral`
                      : underCollateralizedCheck.qualifies
                      ? `✅ Approved for under-collateralized lending!`
                      : `❌ Not approved. Need higher credit score.`
                  }
                  color={underCollateralizedCheck.qualifies ? 'success' : 'error'}
                  sx={{
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    py: 1,
                    px: 2,
                  }}
                />
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">
            Close Demo
          </Button>
          {underCollateralizedCheck.qualifies && (
            <Button variant="contained" color="success" onClick={handleCloseDialog}>
              Proceed to Loan Application
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
};

export default UnderCollateralizedLending;

import { Alert, Box, Card, CardContent, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { EnvironmentValidator } from '../../utils/environment';

const EnvironmentDebug = () => {
  const [envInfo, setEnvInfo] = useState<any>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    // Get comprehensive environment information
    const info = EnvironmentValidator.getEnvironmentInfo();
    setEnvInfo(info);
  }, []);

  if (!isClient) {
    return <Typography>Loading environment debug info...</Typography>;
  }

  if (!envInfo) {
    return <Typography>Gathering environment information...</Typography>;
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Alert severity={envInfo.isValid ? 'success' : 'error'} sx={{ mb: 2 }}>
        <Typography variant="h6">Environment Status</Typography>
        <Typography variant="body2">
          {envInfo.isValid 
            ? '✅ All required environment variables are properly configured'
            : `❌ Missing ${envInfo.missingVars.length} required environment variables`
          }
        </Typography>
        {envInfo.isVercel && (
          <Typography variant="body2" sx={{ mt: 1 }}>
            🚀 Running on Vercel ({envInfo.vercelEnv})
          </Typography>
        )}
      </Alert>

      {!envInfo.isValid && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="h6">Missing Environment Variables</Typography>
          {envInfo.missingVars.map((varName: string) => (
            <Typography key={varName} variant="body2" sx={{ fontFamily: 'monospace' }}>
              • {varName}
            </Typography>
          ))}
          <Typography variant="body2" sx={{ mt: 1 }}>
            Please set these in your Vercel dashboard under Environment Variables.
          </Typography>
        </Alert>
      )}

      {envInfo.warnings.length > 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="h6">Warnings</Typography>
          {envInfo.warnings.map((warning: string, index: number) => (
            <Typography key={index} variant="body2">
              • {warning}
            </Typography>
          ))}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Environment Variables
          </Typography>
          
          {Object.entries(envInfo.allEnvVars).map(([key, value]) => (
            <Box key={key} sx={{ mb: 1 }}>
              <Typography variant="body2" component="span" sx={{ fontWeight: 'bold' }}>
                {key}:
              </Typography>
              <Typography 
                variant="body2" 
                component="span" 
                sx={{ 
                  ml: 1, 
                  color: value === 'NOT SET' ? 'error.main' : 'success.main',
                  fontFamily: 'monospace'
                }}
              >
                {value === 'NOT SET' ? '❌ NOT SET' : `✅ ${String(value).substring(0, 20)}...`}
              </Typography>
            </Box>
          ))}
        </CardContent>
      </Card>
    </Box>
  );
};

export default EnvironmentDebug;

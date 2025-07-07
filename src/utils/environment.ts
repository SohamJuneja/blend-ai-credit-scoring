/**
 * Environment configuration validator for Vercel deployment
 */
export class EnvironmentValidator {
  private static requiredEnvVars = [
    'NEXT_PUBLIC_STELLAR_EXPERT_URL',
    'NEXT_PUBLIC_RPC_URL',
    'NEXT_PUBLIC_HORIZON_URL',
    'NEXT_PUBLIC_PASSPHRASE',
    'NEXT_PUBLIC_WALLET_CONNECT_URL',
    'NEXT_PUBLIC_WALLET_CONNECT_NAME',
    'NEXT_PUBLIC_BACKSTOP',
    'NEXT_PUBLIC_BACKSTOP_V2',
    'NEXT_PUBLIC_USDC_ISSUER',
    'NEXT_PUBLIC_BLND_ISSUER',
    'NEXT_PUBLIC_BLEND_POOL_CONTRACT',
  ];

  /**
   * Validate that all required environment variables are present
   */
  static validateEnvironment(): { isValid: boolean; missingVars: string[]; warnings: string[] } {
    const missingVars: string[] = [];
    const warnings: string[] = [];

    // Check required variables
    for (const varName of this.requiredEnvVars) {
      const value = process.env[varName];
      if (!value || value === 'NOT SET' || value === '') {
        missingVars.push(varName);
      }
    }

    // Check optional variables that might cause issues
    if (!process.env.NEXT_PUBLIC_ORACLE_PRICE_FETCHER) {
      warnings.push('NEXT_PUBLIC_ORACLE_PRICE_FETCHER is not set (optional but recommended)');
    }

    return {
      isValid: missingVars.length === 0,
      missingVars,
      warnings,
    };
  }

  /**
   * Get environment information for debugging
   */
  static getEnvironmentInfo() {
    const validation = this.validateEnvironment();

    return {
      ...validation,
      nodeEnv: process.env.NODE_ENV,
      isVercel: !!process.env.VERCEL,
      vercelEnv: process.env.VERCEL_ENV,
      allEnvVars: this.requiredEnvVars.reduce((acc, varName) => {
        acc[varName] = process.env[varName] || 'NOT SET';
        return acc;
      }, {} as Record<string, string>),
    };
  }
}

/**
 * Environment configuration with defaults
 */
export const EnvironmentConfig = {
  STELLAR_EXPERT_URL:
    process.env.NEXT_PUBLIC_STELLAR_EXPERT_URL || 'https://stellar.expert/explorer/testnet',
  RPC_URL: process.env.NEXT_PUBLIC_RPC_URL || 'https://soroban-testnet.stellar.org',
  HORIZON_URL: process.env.NEXT_PUBLIC_HORIZON_URL || 'https://horizon-testnet.stellar.org',
  PASSPHRASE: process.env.NEXT_PUBLIC_PASSPHRASE || 'Test SDF Network ; September 2015',
  WALLET_CONNECT_URL: process.env.NEXT_PUBLIC_WALLET_CONNECT_URL || 'https://testnet.blend.capital',
  WALLET_CONNECT_NAME: process.env.NEXT_PUBLIC_WALLET_CONNECT_NAME || 'Blend Testnet',
  BACKSTOP:
    process.env.NEXT_PUBLIC_BACKSTOP || 'CC4TSDVQKBAYMK4BEDM65CSNB3ISI2A54OOBRO6IPSTFHJY3DEEKHRKV',
  BACKSTOP_V2:
    process.env.NEXT_PUBLIC_BACKSTOP_V2 ||
    'CC4TSDVQKBAYMK4BEDM65CSNB3ISI2A54OOBRO6IPSTFHJY3DEEKHRKV',
  USDC_ISSUER:
    process.env.NEXT_PUBLIC_USDC_ISSUER ||
    'GATALTGTWIOT6BUDBCZM3Q4OQ4BO2COLOAZ7IYSKPLC2PMSOPPGF5V56',
  BLND_ISSUER:
    process.env.NEXT_PUBLIC_BLND_ISSUER ||
    'GATALTGTWIOT6BUDBCZM3Q4OQ4BO2COLOAZ7IYSKPLC2PMSOPPGF5V56',
  BLEND_POOL_CONTRACT:
    process.env.NEXT_PUBLIC_BLEND_POOL_CONTRACT ||
    'CCLBPEYS3XFK65MYYXSBMOGKUI4ODN5S7SUZBGD7NALUQF64QILLX5B5',
  ORACLE_PRICE_FETCHER: process.env.NEXT_PUBLIC_ORACLE_PRICE_FETCHER || '',
  BLOCKED_POOLS: process.env.NEXT_PUBLIC_BLOCKED_POOLS || '',
};

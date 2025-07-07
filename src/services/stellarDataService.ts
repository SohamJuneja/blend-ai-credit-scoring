import { Horizon } from '@stellar/stellar-sdk';
import {
  AssetDiversityData,
  CollateralizationData,
  LiquidationHistory,
  LoanActivityData,
  OnChainData,
  RepaymentHistory,
} from '../types/creditScore';
import { EnvironmentConfig } from '../utils/environment';

export class StellarDataService {
  private horizon: Horizon.Server;
  private blendPoolContract: string;

  constructor(network: 'testnet' | 'mainnet' = 'testnet') {
    this.horizon = new Horizon.Server(
      network === 'testnet' ? EnvironmentConfig.HORIZON_URL : 'https://horizon.stellar.org'
    );
    this.blendPoolContract = EnvironmentConfig.BLEND_POOL_CONTRACT;
  }

  async fetchOnChainData(walletAddress: string): Promise<OnChainData> {
    try {
      const [
        walletAge,
        totalTransactions,
        repaymentHistory,
        collateralizationData,
        liquidationHistory,
        assetDiversity,
        loanActivity,
      ] = await Promise.all([
        this.getWalletAge(walletAddress),
        this.getTotalTransactions(walletAddress),
        this.getRepaymentHistory(walletAddress),
        this.getCollateralizationData(walletAddress),
        this.getLiquidationHistory(walletAddress),
        this.getAssetDiversity(walletAddress),
        this.getLoanActivity(walletAddress),
      ]);

      return {
        walletAddress,
        walletAge,
        totalTransactions,
        blendRepaymentHistory: repaymentHistory,
        collateralizationRatios: collateralizationData,
        liquidationHistory,
        assetDiversity,
        loanActivity,
      };
    } catch (error) {
      console.error('Error fetching on-chain data:', error);
      throw new Error('Failed to fetch on-chain data');
    }
  }

  private async getWalletAge(walletAddress: string): Promise<number> {
    try {
      const account = await this.horizon.accounts().accountId(walletAddress).call();
      const transactions = await this.horizon
        .transactions()
        .forAccount(walletAddress)
        .order('asc')
        .limit(1)
        .call();

      if (transactions.records.length > 0) {
        const firstTransaction = transactions.records[0];
        const firstTransactionDate = new Date(firstTransaction.created_at);
        const now = new Date();
        const monthsDiff =
          (now.getTime() - firstTransactionDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
        return Math.floor(monthsDiff);
      }

      return 0;
    } catch (error) {
      console.error('Error fetching wallet age:', error);
      return 0;
    }
  }

  private async getTotalTransactions(walletAddress: string): Promise<number> {
    try {
      const account = await this.horizon.accounts().accountId(walletAddress).call();
      return parseInt(account.sequence) || 0;
    } catch (error) {
      console.error('Error fetching total transactions:', error);
      return 0;
    }
  }

  private async getRepaymentHistory(walletAddress: string): Promise<RepaymentHistory> {
    try {
      // This would typically involve parsing smart contract events
      // For now, we'll return mock data based on transaction patterns
      const transactions = await this.horizon
        .transactions()
        .forAccount(walletAddress)
        .limit(200)
        .call();

      // Filter for Blend protocol transactions
      const blendTransactions = transactions.records.filter(
        (tx) => tx.memo && tx.memo.includes('blend') // Simplified filter
      );

      // Analyze repayment patterns
      const repaymentTransactions = blendTransactions.filter(
        (tx) => tx.operation_count > 0 // Simplified - would need to parse actual operations
      );

      const totalLoans = Math.floor(repaymentTransactions.length / 2); // Assume 2 transactions per loan cycle
      const onTimePayments = Math.floor(totalLoans * 0.8); // Mock data
      const latePayments = Math.floor(totalLoans * 0.15);
      const missedPayments = totalLoans - onTimePayments - latePayments;

      return {
        totalLoans,
        onTimePayments,
        latePayments,
        missedPayments,
        averageRepaymentTime: 28, // Mock average
        recentActivity: [], // Would be populated with actual data
      };
    } catch (error) {
      console.error('Error fetching repayment history:', error);
      return {
        totalLoans: 0,
        onTimePayments: 0,
        latePayments: 0,
        missedPayments: 0,
        averageRepaymentTime: 0,
        recentActivity: [],
      };
    }
  }

  private async getCollateralizationData(walletAddress: string): Promise<CollateralizationData> {
    try {
      // Mock implementation - would need to analyze Blend protocol positions
      const currentRatio = 1.8; // 180% collateralization
      const monthlyAverages = this.generateMockMonthlyRatios();
      const timeWeightedAverage =
        monthlyAverages.reduce((sum, month) => sum + month.averageRatio, 0) /
        monthlyAverages.length;

      return {
        currentRatio,
        averageRatio: timeWeightedAverage,
        timeWeightedAverage,
        monthlyAverages,
        riskEvents: [], // Would be populated with actual risk events
      };
    } catch (error) {
      console.error('Error fetching collateralization data:', error);
      return {
        currentRatio: 0,
        averageRatio: 0,
        timeWeightedAverage: 0,
        monthlyAverages: [],
        riskEvents: [],
      };
    }
  }

  private async getLiquidationHistory(walletAddress: string): Promise<LiquidationHistory> {
    try {
      // Mock implementation - would need to parse liquidation events
      return {
        totalLiquidations: 0,
        recentLiquidations: 0,
        totalLiquidatedValue: 0,
        averageLiquidationSize: 0,
        liquidationEvents: [],
      };
    } catch (error) {
      console.error('Error fetching liquidation history:', error);
      return {
        totalLiquidations: 0,
        recentLiquidations: 0,
        totalLiquidatedValue: 0,
        averageLiquidationSize: 0,
        liquidationEvents: [],
      };
    }
  }

  private async getAssetDiversity(walletAddress: string): Promise<AssetDiversityData> {
    try {
      const account = await this.horizon.accounts().accountId(walletAddress).call();
      const balances = account.balances;

      const uniqueAssets = balances.length;
      const uniqueProtocols = 1; // Simplified - would need to identify protocols

      const assetDistribution = balances.map((balance) => {
        let assetCode = 'Unknown';
        if (balance.asset_type === 'native') {
          assetCode = 'XLM';
        } else if ('asset_code' in balance) {
          assetCode = balance.asset_code;
        }

        return {
          asset: assetCode,
          percentage: 0, // Would need to calculate based on values
          value: parseFloat(balance.balance),
        };
      });

      // Calculate concentration risk (simplified)
      const concentrationRisk = Math.max(...assetDistribution.map((a) => a.percentage)) / 100;

      return {
        uniqueAssets,
        uniqueProtocols,
        assetDistribution,
        protocolUsage: [],
        concentrationRisk,
      };
    } catch (error) {
      console.error('Error fetching asset diversity:', error);
      return {
        uniqueAssets: 0,
        uniqueProtocols: 0,
        assetDistribution: [],
        protocolUsage: [],
        concentrationRisk: 0,
      };
    }
  }

  private async getLoanActivity(walletAddress: string): Promise<LoanActivityData> {
    try {
      // Mock implementation - would need to analyze loan transactions
      const transactions = await this.horizon
        .transactions()
        .forAccount(walletAddress)
        .limit(100)
        .call();

      const loanTransactions = transactions.records.filter(
        (tx) => tx.memo && (tx.memo.includes('borrow') || tx.memo.includes('loan'))
      );

      const totalLoans = loanTransactions.length;
      const averageLoanSize = 5000; // Mock data
      const loanFrequency = totalLoans / 12; // Per month over last year

      return {
        totalLoans,
        averageLoanSize,
        loanFrequency,
        last12MonthsActivity: this.generateMockMonthlyActivity(),
        preferredLoanSizes: [1000, 5000, 10000],
        seasonalPatterns: [],
      };
    } catch (error) {
      console.error('Error fetching loan activity:', error);
      return {
        totalLoans: 0,
        averageLoanSize: 0,
        loanFrequency: 0,
        last12MonthsActivity: [],
        preferredLoanSizes: [],
        seasonalPatterns: [],
      };
    }
  }

  private generateMockMonthlyRatios() {
    const months = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      months.push({
        month: date.toISOString().substring(0, 7),
        averageRatio: 1.5 + Math.random() * 0.8,
        minRatio: 1.2 + Math.random() * 0.3,
        maxRatio: 2.0 + Math.random() * 0.5,
      });
    }
    return months;
  }

  private generateMockMonthlyActivity() {
    const months = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      months.push({
        month: date.toISOString().substring(0, 7),
        loanCount: Math.floor(Math.random() * 5),
        totalAmount: Math.floor(Math.random() * 50000),
        averageSize: Math.floor(Math.random() * 10000) + 1000,
      });
    }
    return months;
  }
}

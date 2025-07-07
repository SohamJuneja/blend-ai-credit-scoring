import {
  CreditBenefits,
  CreditFactor,
  CreditGrade,
  CreditScoreData,
  OnChainData,
} from '../types/creditScore';

export class CreditScoringAlgorithm {
  private readonly MAX_SCORE = 1000;
  private readonly FACTOR_WEIGHTS = {
    WALLET_AGE: 120,
    TRANSACTION_HISTORY: 150,
    REPAYMENT_HISTORY: 200,
    COLLATERALIZATION: 150,
    LIQUIDATION_HISTORY: 100,
    ASSET_DIVERSITY: 100,
    LOAN_ACTIVITY: 80,
  };

  calculateCreditScore(data: OnChainData): CreditScoreData {
    const factors: CreditFactor[] = [
      this.calculateWalletAge(data.walletAge),
      this.calculateTransactionHistory(data.totalTransactions),
      this.calculateRepaymentHistory(data.blendRepaymentHistory),
      this.calculateCollateralizationScore(data.collateralizationRatios),
      this.calculateLiquidationScore(data.liquidationHistory),
      this.calculateAssetDiversityScore(data.assetDiversity),
      this.calculateLoanActivityScore(data.loanActivity),
    ];

    const totalScore = factors.reduce((sum, factor) => sum + factor.score, 0);
    const grade = this.determineGrade(totalScore);
    const benefits = this.calculateBenefits(totalScore, grade);
    const recommendations = this.generateRecommendations(factors);
    const riskLevel = this.assessRiskLevel(data, totalScore);

    return {
      totalScore: Math.round(totalScore),
      grade,
      factors,
      benefits,
      recommendations,
      riskLevel,
      lastUpdated: new Date(),
    };
  }

  private calculateWalletAge(ageInMonths: number): CreditFactor {
    const maxMonths = 60; // 5 years for max score
    const score = Math.min(ageInMonths / maxMonths, 1) * this.FACTOR_WEIGHTS.WALLET_AGE;

    return {
      id: 'wallet_age',
      name: 'Wallet Age',
      score,
      maxScore: this.FACTOR_WEIGHTS.WALLET_AGE,
      weight: 12,
      description: 'Length of time since your first on-chain transaction',
      status: this.getScoreStatus(score, this.FACTOR_WEIGHTS.WALLET_AGE),
      data: { months: ageInMonths },
      improvements: ageInMonths < 12 ? ['Continue using your wallet to build history'] : [],
    };
  }

  private calculateTransactionHistory(totalTransactions: number): CreditFactor {
    // Logarithmic scaling for transaction count
    const score =
      Math.min(Math.log10(totalTransactions + 1) / Math.log10(10000), 1) *
      this.FACTOR_WEIGHTS.TRANSACTION_HISTORY;

    return {
      id: 'transaction_history',
      name: 'Transaction History',
      score,
      maxScore: this.FACTOR_WEIGHTS.TRANSACTION_HISTORY,
      weight: 15,
      description: 'Total number of on-chain transactions with logarithmic scaling',
      status: this.getScoreStatus(score, this.FACTOR_WEIGHTS.TRANSACTION_HISTORY),
      data: { totalTransactions },
      improvements: totalTransactions < 100 ? ['Increase your on-chain activity'] : [],
    };
  }

  private calculateRepaymentHistory(repaymentData: any): CreditFactor {
    const { totalLoans, onTimePayments, latePayments, missedPayments } = repaymentData;

    if (totalLoans === 0) {
      return {
        id: 'repayment_history',
        name: 'Repayment History',
        score: 0,
        maxScore: this.FACTOR_WEIGHTS.REPAYMENT_HISTORY,
        weight: 20,
        description: 'Track record of loan repayments in Blend protocol',
        status: 'POOR',
        data: repaymentData,
        improvements: ['Start using Blend protocol to build repayment history'],
      };
    }

    const onTimeRate = onTimePayments / totalLoans;
    const lateRate = latePayments / totalLoans;
    const missedRate = missedPayments / totalLoans;

    // Base score from on-time payments
    let score = onTimeRate * this.FACTOR_WEIGHTS.REPAYMENT_HISTORY;

    // Penalties for late and missed payments
    score -= lateRate * 30; // 30 point penalty for each late payment rate
    score -= missedRate * 80; // 80 point penalty for each missed payment rate

    score = Math.max(0, score);

    const improvements = [];
    if (onTimeRate < 0.9) improvements.push('Improve on-time payment rate');
    if (latePayments > 0) improvements.push('Avoid late payments');
    if (missedPayments > 0) improvements.push('Never miss loan payments');

    return {
      id: 'repayment_history',
      name: 'Repayment History',
      score,
      maxScore: this.FACTOR_WEIGHTS.REPAYMENT_HISTORY,
      weight: 20,
      description: 'Track record of loan repayments in Blend protocol',
      status: this.getScoreStatus(score, this.FACTOR_WEIGHTS.REPAYMENT_HISTORY),
      data: repaymentData,
      improvements,
    };
  }

  private calculateCollateralizationScore(collateralizationData: any): CreditFactor {
    const { timeWeightedAverage, monthlyAverages, riskEvents } = collateralizationData;

    // Base score from time-weighted average ratio
    const idealRatio = 2.0; // 200% collateralization
    const ratioScore = Math.min(timeWeightedAverage / idealRatio, 1.5) * 0.8; // Max 1.2 for over-collateralization

    // Consistency bonus
    const consistency = this.calculateConsistency(monthlyAverages.map((m: any) => m.averageRatio));
    const consistencyBonus = (1 - consistency) * 0.2; // Lower variance = higher bonus

    // Risk event penalties
    const riskPenalty = riskEvents.length * 0.1;

    let score =
      (ratioScore + consistencyBonus - riskPenalty) * this.FACTOR_WEIGHTS.COLLATERALIZATION;
    score = Math.max(0, Math.min(score, this.FACTOR_WEIGHTS.COLLATERALIZATION));

    const improvements = [];
    if (timeWeightedAverage < 1.5) improvements.push('Maintain higher collateralization ratios');
    if (consistency > 0.3) improvements.push('Reduce volatility in collateral management');
    if (riskEvents.length > 0) improvements.push('Avoid near-liquidation events');

    return {
      id: 'collateralization',
      name: 'Collateralization Management',
      score,
      maxScore: this.FACTOR_WEIGHTS.COLLATERALIZATION,
      weight: 15,
      description: 'Time-weighted average collateralization ratios and consistency',
      status: this.getScoreStatus(score, this.FACTOR_WEIGHTS.COLLATERALIZATION),
      data: collateralizationData,
      improvements,
    };
  }

  private calculateLiquidationScore(liquidationData: any): CreditFactor {
    const { totalLiquidations, recentLiquidations, liquidationEvents } = liquidationData;

    let score = this.FACTOR_WEIGHTS.LIQUIDATION_HISTORY;

    // Penalties for liquidations
    score -= totalLiquidations * 20; // 20 point penalty per liquidation
    score -= recentLiquidations * 40; // 40 point penalty for recent liquidations

    // Additional penalties for large liquidations
    const largeLiquidations = liquidationEvents.filter((event: any) => event.amount > 10000).length;
    score -= largeLiquidations * 30;

    score = Math.max(0, score);

    const improvements = [];
    if (totalLiquidations > 0)
      improvements.push('Avoid liquidations by maintaining adequate collateral');
    if (recentLiquidations > 0)
      improvements.push('Recent liquidations significantly impact your score');

    return {
      id: 'liquidation_history',
      name: 'Liquidation History',
      score,
      maxScore: this.FACTOR_WEIGHTS.LIQUIDATION_HISTORY,
      weight: 10,
      description: 'History of liquidation events with severe penalties for recent occurrences',
      status: this.getScoreStatus(score, this.FACTOR_WEIGHTS.LIQUIDATION_HISTORY),
      data: liquidationData,
      improvements,
    };
  }

  private calculateAssetDiversityScore(assetData: any): CreditFactor {
    const { uniqueAssets, uniqueProtocols, concentrationRisk } = assetData;

    // Score based on asset diversity
    const assetScore = Math.min(uniqueAssets / 10, 1) * 0.6; // Max 0.6 for 10+ assets

    // Score based on protocol diversity
    const protocolScore = Math.min(uniqueProtocols / 5, 1) * 0.3; // Max 0.3 for 5+ protocols

    // Penalty for concentration risk
    const concentrationPenalty = concentrationRisk * 0.1;

    let score =
      (assetScore + protocolScore - concentrationPenalty) * this.FACTOR_WEIGHTS.ASSET_DIVERSITY;
    score = Math.max(0, Math.min(score, this.FACTOR_WEIGHTS.ASSET_DIVERSITY));

    const improvements = [];
    if (uniqueAssets < 5) improvements.push('Diversify across more assets');
    if (uniqueProtocols < 3) improvements.push('Use multiple DeFi protocols');
    if (concentrationRisk > 0.5) improvements.push('Reduce concentration risk');

    return {
      id: 'asset_diversity',
      name: 'Asset Diversity',
      score,
      maxScore: this.FACTOR_WEIGHTS.ASSET_DIVERSITY,
      weight: 10,
      description: 'Diversity of assets and protocols used',
      status: this.getScoreStatus(score, this.FACTOR_WEIGHTS.ASSET_DIVERSITY),
      data: assetData,
      improvements,
    };
  }

  private calculateLoanActivityScore(loanData: any): CreditFactor {
    const { totalLoans, averageLoanSize, loanFrequency, last12MonthsActivity } = loanData;

    // Logarithmic scoring for loan size
    const sizeScore = Math.min(Math.log10(averageLoanSize + 1) / Math.log10(100000), 1) * 0.6;

    // Frequency bonus (optimal frequency is 1-2 loans per month)
    const optimalFrequency = 1.5;
    const frequencyScore =
      Math.max(0, 1 - Math.abs(loanFrequency - optimalFrequency) / optimalFrequency) * 0.4;

    let score = (sizeScore + frequencyScore) * this.FACTOR_WEIGHTS.LOAN_ACTIVITY;
    score = Math.max(0, Math.min(score, this.FACTOR_WEIGHTS.LOAN_ACTIVITY));

    const improvements = [];
    if (totalLoans < 5) improvements.push('Increase loan activity to build history');
    if (loanFrequency < 0.5) improvements.push('More regular borrowing activity can improve score');

    return {
      id: 'loan_activity',
      name: 'Loan Activity Pattern',
      score,
      maxScore: this.FACTOR_WEIGHTS.LOAN_ACTIVITY,
      weight: 8,
      description: 'Loan size and frequency patterns with logarithmic scaling',
      status: this.getScoreStatus(score, this.FACTOR_WEIGHTS.LOAN_ACTIVITY),
      data: loanData,
      improvements,
    };
  }

  private determineGrade(score: number): CreditGrade {
    if (score >= 850) return 'EXCELLENT';
    if (score >= 700) return 'GOOD';
    if (score >= 550) return 'FAIR';
    if (score >= 400) return 'POOR';
    return 'VERY_POOR';
  }

  private calculateBenefits(score: number, grade: CreditGrade): CreditBenefits {
    const scoreRatio = score / this.MAX_SCORE;

    return {
      maxLTV: Math.min(50 + scoreRatio * 40, 90), // 50% to 90% LTV
      interestRateDiscount: scoreRatio * 3, // Up to 3% discount
      maxBorrowAmount: score * 100, // $100 per score point
      priorityAccess: score >= 700,
      liquidationBuffer: 10 + scoreRatio * 10, // 10% to 20% buffer
    };
  }

  private generateRecommendations(factors: CreditFactor[]): string[] {
    const recommendations: string[] = [];

    factors.forEach((factor) => {
      if (factor.improvements.length > 0) {
        recommendations.push(...factor.improvements);
      }
    });

    return recommendations;
  }

  private assessRiskLevel(data: OnChainData, score: number): 'LOW' | 'MEDIUM' | 'HIGH' {
    if (score >= 700) return 'LOW';
    if (score >= 550) return 'MEDIUM';
    return 'HIGH';
  }

  private getScoreStatus(
    score: number,
    maxScore: number
  ): 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'VERY_POOR' {
    const percentage = (score / maxScore) * 100;

    if (percentage >= 90) return 'EXCELLENT';
    if (percentage >= 75) return 'GOOD';
    if (percentage >= 60) return 'FAIR';
    if (percentage >= 40) return 'POOR';
    return 'VERY_POOR';
  }

  private calculateConsistency(values: number[]): number {
    if (values.length < 2) return 0;

    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;

    return Math.sqrt(variance) / mean; // Coefficient of variation
  }
}

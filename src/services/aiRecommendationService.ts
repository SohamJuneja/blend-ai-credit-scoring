import {
  AIRecommendation,
  CreditFactor,
  CreditScoreData,
  CreditSimulation,
} from '../types/creditScore';

export class AIRecommendationService {
  // In a real implementation, this would connect to OpenAI API
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.NEXT_PUBLIC_OPENAI_API_KEY || '';
  }

  async generateExplanation(creditData: CreditScoreData): Promise<string> {
    // Mock AI explanation - in production, this would call OpenAI API
    const { totalScore, grade, factors } = creditData;

    const weakestFactor = factors.reduce((min, factor) =>
      factor.score / factor.maxScore < min.score / min.maxScore ? factor : min
    );

    const strongestFactor = factors.reduce((max, factor) =>
      factor.score / factor.maxScore > max.score / max.maxScore ? factor : max
    );

    return `Your DeFi credit score of ${totalScore} places you in the ${grade} category. Your strongest area is ${
      strongestFactor.name
    } with ${Math.round(
      (strongestFactor.score / strongestFactor.maxScore) * 100
    )}% of maximum points, indicating ${this.getStrengthDescription(strongestFactor.name)}. 

Your area for improvement is ${weakestFactor.name} with ${Math.round(
      (weakestFactor.score / weakestFactor.maxScore) * 100
    )}% of maximum points. ${this.getImprovementDescription(weakestFactor.name)}

${this.getGradeDescription(grade, totalScore)}`;
  }

  async generateRecommendations(creditData: CreditScoreData): Promise<AIRecommendation[]> {
    const recommendations: AIRecommendation[] = [];

    for (const factor of creditData.factors) {
      const scorePercentage = (factor.score / factor.maxScore) * 100;

      if (scorePercentage < 80) {
        const recommendation = this.generateFactorRecommendation(factor, scorePercentage);
        recommendations.push(recommendation);
      }
    }

    return recommendations.sort((a, b) => b.impact - a.impact);
  }

  async generateSimulations(creditData: CreditScoreData): Promise<CreditSimulation[]> {
    const simulations: CreditSimulation[] = [];

    // Repayment improvement simulation
    const repaymentFactor = creditData.factors.find((f) => f.id === 'repayment_history');
    if (repaymentFactor && repaymentFactor.score / repaymentFactor.maxScore < 0.9) {
      simulations.push({
        scenario: 'Perfect Repayment Record',
        description: 'Maintain 100% on-time payments for the next 6 months',
        parameters: { onTimeRate: 1.0, timeframe: 6 },
        projectedScore: creditData.totalScore + 50,
        scoreDelta: 50,
        timeframe: '6 months',
        requirements: ['Make all loan payments on time', 'Set up automatic payments if possible'],
      });
    }

    // Collateralization improvement simulation
    const collateralFactor = creditData.factors.find((f) => f.id === 'collateralization');
    if (collateralFactor && collateralFactor.score / collateralFactor.maxScore < 0.8) {
      simulations.push({
        scenario: 'Improved Collateral Management',
        description: 'Maintain 200%+ collateralization ratio consistently',
        parameters: { targetRatio: 2.0, consistency: 0.1 },
        projectedScore: creditData.totalScore + 35,
        scoreDelta: 35,
        timeframe: '3 months',
        requirements: [
          'Increase collateral deposits',
          'Monitor positions daily',
          'Set up alerts for ratio drops',
        ],
      });
    }

    // Asset diversification simulation
    const diversityFactor = creditData.factors.find((f) => f.id === 'asset_diversity');
    if (diversityFactor && diversityFactor.score / diversityFactor.maxScore < 0.7) {
      simulations.push({
        scenario: 'Asset Diversification',
        description: 'Diversify across 5+ assets and 3+ protocols',
        parameters: { targetAssets: 5, targetProtocols: 3 },
        projectedScore: creditData.totalScore + 25,
        scoreDelta: 25,
        timeframe: '2 months',
        requirements: [
          'Use additional DeFi protocols',
          'Spread investments across more assets',
          'Reduce concentration risk',
        ],
      });
    }

    // Loan activity optimization
    const loanFactor = creditData.factors.find((f) => f.id === 'loan_activity');
    if (loanFactor && loanFactor.score / loanFactor.maxScore < 0.6) {
      simulations.push({
        scenario: 'Optimal Loan Activity',
        description: 'Maintain steady borrowing activity with larger average loan sizes',
        parameters: { targetFrequency: 1.5, targetSize: 10000 },
        projectedScore: creditData.totalScore + 20,
        scoreDelta: 20,
        timeframe: '4 months',
        requirements: [
          'Take 1-2 loans per month',
          'Gradually increase loan sizes',
          'Maintain consistent activity',
        ],
      });
    }

    return simulations;
  }

  private generateFactorRecommendation(
    factor: CreditFactor,
    scorePercentage: number
  ): AIRecommendation {
    const baseRecommendations = this.getBaseRecommendations(factor.id);
    const impact = this.calculateImpact(factor, scorePercentage);
    const priority = this.calculatePriority(factor, scorePercentage);
    const effort = this.calculateEffort(factor.id);

    return {
      id: `${factor.id}_recommendation`,
      factor: factor.name,
      priority,
      impact,
      effort,
      timeframe: this.getTimeframe(factor.id),
      description: baseRecommendations.description,
      actionItems: baseRecommendations.actionItems,
    };
  }

  private getBaseRecommendations(factorId: string): { description: string; actionItems: string[] } {
    const recommendations = {
      wallet_age: {
        description:
          'Your wallet age contributes to your credit score over time. Continue using your wallet regularly to build this factor.',
        actionItems: [
          'Keep your wallet active with regular transactions',
          "Don't switch to new wallets frequently",
        ],
      },
      transaction_history: {
        description: 'Increase your on-chain activity to improve your transaction history score.',
        actionItems: [
          'Make regular DeFi transactions',
          'Use various protocols and features',
          'Maintain consistent activity',
        ],
      },
      repayment_history: {
        description:
          'Your repayment history is the most important factor. Focus on always paying loans on time.',
        actionItems: [
          'Set up payment reminders',
          'Never miss loan payments',
          'Pay early when possible',
          'Use automatic repayment features',
        ],
      },
      collateralization: {
        description:
          'Maintain higher and more consistent collateralization ratios to improve this score.',
        actionItems: [
          'Keep collateral ratios above 150%',
          'Add collateral before ratios drop',
          'Monitor positions daily',
          'Set up liquidation alerts',
        ],
      },
      liquidation_history: {
        description: 'Avoid liquidations at all costs as they severely impact your credit score.',
        actionItems: [
          'Monitor collateral ratios closely',
          'Add collateral when ratios drop',
          'Use stop-loss strategies',
          'Maintain emergency reserves',
        ],
      },
      asset_diversity: {
        description:
          'Diversify your holdings across multiple assets and protocols to reduce concentration risk.',
        actionItems: [
          'Use 5+ different assets',
          'Interact with 3+ protocols',
          'Reduce single-asset concentration',
          'Explore new DeFi opportunities',
        ],
      },
      loan_activity: {
        description: 'Maintain regular borrowing activity with appropriate loan sizes.',
        actionItems: [
          'Take 1-2 loans per month',
          'Gradually increase loan sizes',
          'Maintain consistent borrowing patterns',
          'Use loans productively',
        ],
      },
    };

    return (
      recommendations[factorId as keyof typeof recommendations] || {
        description: 'Focus on improving this factor to boost your credit score.',
        actionItems: ['Follow best practices for this metric'],
      }
    );
  }

  private calculateImpact(factor: CreditFactor, scorePercentage: number): number {
    const maxPossibleGain = factor.maxScore - factor.score;
    const improvementPotential = Math.min(maxPossibleGain, factor.maxScore * 0.3); // Max 30% improvement
    return Math.round(improvementPotential);
  }

  private calculatePriority(
    factor: CreditFactor,
    scorePercentage: number
  ): 'HIGH' | 'MEDIUM' | 'LOW' {
    if (scorePercentage < 40) return 'HIGH';
    if (scorePercentage < 70) return 'MEDIUM';
    return 'LOW';
  }

  private calculateEffort(factorId: string): 'LOW' | 'MEDIUM' | 'HIGH' {
    const effortMap: Record<string, 'LOW' | 'MEDIUM' | 'HIGH'> = {
      wallet_age: 'HIGH', // Takes time
      transaction_history: 'MEDIUM',
      repayment_history: 'LOW', // Just pay on time
      collateralization: 'LOW', // Just add collateral
      liquidation_history: 'HIGH', // Hard to recover from
      asset_diversity: 'MEDIUM',
      loan_activity: 'MEDIUM',
    };

    return effortMap[factorId] || 'MEDIUM';
  }

  private getTimeframe(factorId: string): string {
    const timeframes = {
      wallet_age: '6-12 months',
      transaction_history: '2-3 months',
      repayment_history: '1-2 months',
      collateralization: '1 month',
      liquidation_history: '6+ months',
      asset_diversity: '2-4 weeks',
      loan_activity: '2-3 months',
    };

    return timeframes[factorId as keyof typeof timeframes] || '2-3 months';
  }

  private getStrengthDescription(factorName: string): string {
    const descriptions = {
      'Wallet Age': 'excellent account maturity and long-term DeFi engagement',
      'Transaction History': 'robust on-chain activity and protocol usage',
      'Repayment History': 'outstanding payment reliability and trustworthiness',
      'Collateralization Management': 'excellent risk management and position maintenance',
      'Liquidation History': 'strong risk avoidance and capital preservation',
      'Asset Diversity': 'well-diversified portfolio and protocol usage',
      'Loan Activity Pattern': 'healthy borrowing patterns and appropriate loan utilization',
    };

    return descriptions[factorName as keyof typeof descriptions] || 'good performance in this area';
  }

  private getImprovementDescription(factorName: string): string {
    const descriptions = {
      'Wallet Age': 'This improves naturally over time as you continue using DeFi.',
      'Transaction History': 'Increase your on-chain activity across different protocols.',
      'Repayment History': 'Focus on making all loan payments on time to build trust.',
      'Collateralization Management':
        'Maintain higher collateral ratios and avoid risky positions.',
      'Liquidation History': 'Avoid liquidations by monitoring positions closely.',
      'Asset Diversity': 'Diversify across more assets and protocols to reduce risk.',
      'Loan Activity Pattern': 'Maintain steady borrowing activity with appropriate sizes.',
    };

    return (
      descriptions[factorName as keyof typeof descriptions] || 'Focus on improving this metric.'
    );
  }

  private getGradeDescription(grade: string, score: number): string {
    const descriptions = {
      EXCELLENT: `With an excellent credit score, you qualify for the best lending terms including up to 90% LTV ratios and 3% interest rate discounts. You're in the top tier of DeFi borrowers.`,
      GOOD: `Your good credit score qualifies you for favorable lending terms with up to 80% LTV ratios and 2% interest rate discounts. You're a trusted borrower in the DeFi space.`,
      FAIR: `Your fair credit score allows access to standard lending terms with up to 70% LTV ratios and 1% interest rate discounts. There's room for improvement to unlock better rates.`,
      POOR: `Your poor credit score limits you to conservative lending terms with up to 60% LTV ratios and standard interest rates. Focus on improving your score for better access.`,
      VERY_POOR: `Your very poor credit score significantly restricts lending options with up to 50% LTV ratios and potentially higher interest rates. Significant improvement is needed.`,
    };

    return (
      descriptions[grade as keyof typeof descriptions] ||
      'Continue working on improving your credit score.'
    );
  }
}

import { Pool, Reserve } from '@blend-capital/blend-sdk';
import { CreditScoreData } from '../types/creditScore';

/**
 * Service for integrating credit scores with Blend Protocol lending parameters
 * This service calculates personalized lending terms based on credit scores
 */
export class BlendCreditIntegrationService {
  private pool: Pool;
  private creditScoreData: CreditScoreData;

  constructor(pool: Pool, creditScoreData: CreditScoreData) {
    this.pool = pool;
    this.creditScoreData = creditScoreData;
  }

  /**
   * Calculate personalized maximum LTV based on credit score
   * @param baseMaxLTV The pool's default maximum LTV
   * @returns Adjusted maximum LTV for this user
   */
  getPersonalizedMaxLTV(baseMaxLTV: number): number {
    const creditMultiplier = this.getCreditMultiplier();
    const adjustedLTV = baseMaxLTV * creditMultiplier;

    // Apply credit score-based adjustments
    switch (this.creditScoreData.grade) {
      case 'EXCELLENT':
        return Math.min(adjustedLTV * 1.25, 0.95); // Up to 95% LTV
      case 'GOOD':
        return Math.min(adjustedLTV * 1.15, 0.85); // Up to 85% LTV
      case 'FAIR':
        return Math.min(adjustedLTV * 1.05, 0.75); // Up to 75% LTV
      case 'POOR':
        return Math.min(adjustedLTV * 0.95, 0.65); // Up to 65% LTV
      case 'VERY_POOR':
        return Math.min(adjustedLTV * 0.85, 0.55); // Up to 55% LTV
      default:
        return baseMaxLTV;
    }
  }

  /**
   * Calculate personalized interest rate discount/premium based on credit score
   * @param baseInterestRate The pool's base interest rate
   * @returns Adjusted interest rate for this user
   */
  getPersonalizedInterestRate(baseInterestRate: number): number {
    const discountBasisPoints = this.creditScoreData.benefits.interestRateDiscount * 100;
    const discount = discountBasisPoints / 10000; // Convert basis points to decimal

    switch (this.creditScoreData.grade) {
      case 'EXCELLENT':
        return Math.max(baseInterestRate * (1 - discount - 0.03), baseInterestRate * 0.7, 0.01); // Never below 1%
      case 'GOOD':
        return Math.max(baseInterestRate * (1 - discount - 0.02), baseInterestRate * 0.8, 0.015); // Never below 1.5%
      case 'FAIR':
        return Math.max(baseInterestRate * (1 - discount - 0.01), baseInterestRate * 0.9, 0.02); // Never below 2%
      case 'POOR':
        return Math.max(baseInterestRate * (1 + 0.01), 0.04); // At least 4%
      case 'VERY_POOR':
        return Math.max(baseInterestRate * (1 + 0.025), 0.08); // At least 8%
      default:
        return baseInterestRate;
    }
  }

  /**
   * Calculate personalized liquidation threshold based on credit score
   * @param baseLiquidationThreshold The pool's base liquidation threshold
   * @returns Adjusted liquidation threshold for this user
   */
  getPersonalizedLiquidationThreshold(baseLiquidationThreshold: number): number {
    const buffer = this.creditScoreData.benefits.liquidationBuffer / 100;

    // Better credit scores get more buffer before liquidation
    switch (this.creditScoreData.grade) {
      case 'EXCELLENT':
        return Math.max(baseLiquidationThreshold - buffer - 0.05, baseLiquidationThreshold * 0.8); // 5% extra buffer
      case 'GOOD':
        return Math.max(baseLiquidationThreshold - buffer - 0.03, baseLiquidationThreshold * 0.85); // 3% extra buffer
      case 'FAIR':
        return Math.max(baseLiquidationThreshold - buffer - 0.01, baseLiquidationThreshold * 0.9); // 1% extra buffer
      case 'POOR':
        return baseLiquidationThreshold + 0.02; // 2% less buffer
      case 'VERY_POOR':
        return baseLiquidationThreshold + 0.05; // 5% less buffer
      default:
        return baseLiquidationThreshold;
    }
  }

  /**
   * Calculate personalized maximum borrow amount based on credit score
   * @param baseMaxBorrow The pool's base maximum borrow amount
   * @param collateralValue User's collateral value
   * @returns Adjusted maximum borrow amount for this user
   */
  getPersonalizedMaxBorrow(baseMaxBorrow: number, collateralValue: number): number {
    const creditMaxBorrow = this.creditScoreData.benefits.maxBorrowAmount;
    const personalizedLTV = this.getPersonalizedMaxLTV(0.8); // Assume 80% base LTV

    // Calculate max borrow based on credit score and collateral
    const collateralBasedMax = collateralValue * personalizedLTV;
    const creditBasedMax = Math.min(creditMaxBorrow, baseMaxBorrow * this.getCreditMultiplier());

    return Math.min(collateralBasedMax, creditBasedMax);
  }

  /**
   * Check if user has priority access to new lending opportunities
   * @returns Whether user has priority access
   */
  hasPriorityAccess(): boolean {
    return this.creditScoreData.benefits.priorityAccess;
  }

  /**
   * Calculate personalized lending terms for a specific reserve
   * @param reserve The reserve to calculate terms for
   * @param collateralValue User's collateral value
   * @returns Personalized lending terms
   */
  getPersonalizedLendingTerms(
    reserve: Reserve,
    collateralValue: number
  ): {
    maxLTV: number;
    interestRate: number;
    liquidationThreshold: number;
    maxBorrowAmount: number;
    creditAdjustment: number;
  } {
    // Get base values from reserve configuration
    const baseMaxLTV = reserve.config.max_util / 1e7; // Convert from fixed point
    const baseLiquidationThreshold = reserve.config.l_factor / 1e7; // Use l_factor as liquidation threshold
    const baseInterestRate = reserve.borrowApr;

    // Calculate personalized values
    const personalizedMaxLTV = this.getPersonalizedMaxLTV(baseMaxLTV);
    const personalizedInterestRate = this.getPersonalizedInterestRate(baseInterestRate);
    const personalizedLiquidationThreshold =
      this.getPersonalizedLiquidationThreshold(baseLiquidationThreshold);
    const maxBorrowAmount = this.getPersonalizedMaxBorrow(1000000, collateralValue); // $1M base limit

    return {
      maxLTV: personalizedMaxLTV,
      interestRate: personalizedInterestRate,
      liquidationThreshold: personalizedLiquidationThreshold,
      maxBorrowAmount,
      creditAdjustment: this.getCreditMultiplier(),
    };
  }

  /**
   * Calculate dynamic interest rate based on current market conditions and credit score
   * @param currentUtilization Current pool utilization
   * @param baseRate Base interest rate
   * @returns Dynamic interest rate for this user
   */
  calculateDynamicInterestRate(currentUtilization: number, baseRate: number): number {
    const personalizedRate = this.getPersonalizedInterestRate(baseRate);

    // Apply additional adjustments based on utilization and credit score
    if (currentUtilization > 0.9) {
      // High utilization - premium borrowers get better rates
      const utilizationDiscount = this.creditScoreData.grade === 'EXCELLENT' ? 0.01 : 0;
      return Math.max(personalizedRate - utilizationDiscount, personalizedRate * 0.95);
    }

    return personalizedRate;
  }

  /**
   * Get credit multiplier based on credit score
   * @returns Credit multiplier (1.0 = no change, >1.0 = better terms, <1.0 = worse terms)
   */
  private getCreditMultiplier(): number {
    const score = this.creditScoreData.totalScore;

    // Linear interpolation between score ranges
    if (score >= 850) return 1.3;
    if (score >= 700) return 1.0 + ((score - 700) * 0.3) / 150; // 1.0 to 1.3
    if (score >= 550) return 0.9 + ((score - 550) * 0.1) / 150; // 0.9 to 1.0
    if (score >= 400) return 0.8 + ((score - 400) * 0.1) / 150; // 0.8 to 0.9
    return 0.7 + ((score - 300) * 0.1) / 100; // 0.7 to 0.8
  }

  /**
   * Generate lending terms summary for UI display
   * @param reserve The specific reserve for lending terms
   * @param collateralValue User's collateral value
   * @returns Lending terms summary
   */
  getLendingTermsSummary(
    reserve?: Reserve,
    collateralValue: number = 1000000
  ): {
    maxLTV: number;
    interestRate: number;
    liquidationThreshold: number;
    maxBorrowAmount: number;
    priorityAccess: boolean;
    creditGrade: string;
    creditMultiplier: number;
  } {
    if (reserve) {
      const terms = this.getPersonalizedLendingTerms(reserve, collateralValue);
      return {
        maxLTV: terms.maxLTV,
        interestRate: terms.interestRate,
        liquidationThreshold: terms.liquidationThreshold,
        maxBorrowAmount: terms.maxBorrowAmount,
        priorityAccess: this.hasPriorityAccess(),
        creditGrade: this.creditScoreData.grade,
        creditMultiplier: terms.creditAdjustment,
      };
    }

    // Default values if no reserve provided
    const baseMaxLTV = 0.8; // 80% standard
    const baseInterestRate = 0.08; // 8% standard
    const baseLiquidationThreshold = 0.85; // 85% standard
    const baseMaxBorrow = 1000000; // $1M standard

    return {
      maxLTV: this.getPersonalizedMaxLTV(baseMaxLTV),
      interestRate: this.getPersonalizedInterestRate(baseInterestRate),
      liquidationThreshold: this.getPersonalizedLiquidationThreshold(baseLiquidationThreshold),
      maxBorrowAmount: this.getPersonalizedMaxBorrow(baseMaxBorrow, collateralValue),
      priorityAccess: this.hasPriorityAccess(),
      creditGrade: this.creditScoreData.grade,
      creditMultiplier: this.getCreditMultiplier(),
    };
  }

  /**
   * Calculate if user qualifies for under-collateralized lending
   * @param requestedAmount Amount user wants to borrow
   * @param collateralValue User's collateral value
   * @returns Whether user qualifies and terms
   */
  checkUnderCollateralizedLending(
    requestedAmount: number,
    collateralValue: number
  ): {
    qualifies: boolean;
    requiredCollateral: number;
    creditBasedLimit: number;
    terms: {
      interestRate: number;
      maxLTV: number;
      liquidationThreshold: number;
    };
  } {
    const maxLTV = this.getPersonalizedMaxLTV(0.8);
    const requiredCollateral = requestedAmount / maxLTV;
    const creditBasedLimit = this.creditScoreData.benefits.maxBorrowAmount;

    const qualifies =
      this.creditScoreData.grade === 'EXCELLENT' ||
      this.creditScoreData.grade === 'GOOD' ||
      (this.creditScoreData.grade === 'FAIR' && this.creditScoreData.totalScore > 600);

    return {
      qualifies,
      requiredCollateral,
      creditBasedLimit,
      terms: {
        interestRate: this.getPersonalizedInterestRate(0.08),
        maxLTV,
        liquidationThreshold: this.getPersonalizedLiquidationThreshold(0.85),
      },
    };
  }
}

/**
 * Factory function to create credit-integrated lending parameters
 * @param pool The Blend pool
 * @param creditScoreData User's credit score data
 * @returns BlendCreditIntegrationService instance
 */
export function createCreditIntegratedPool(
  pool: Pool,
  creditScoreData: CreditScoreData
): BlendCreditIntegrationService {
  return new BlendCreditIntegrationService(pool, creditScoreData);
}

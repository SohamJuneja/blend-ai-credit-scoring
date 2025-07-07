export interface CreditScoreData {
  totalScore: number;
  grade: CreditGrade;
  factors: CreditFactor[];
  benefits: CreditBenefits;
  recommendations: string[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  lastUpdated: Date;
}

export interface CreditFactor {
  id: string;
  name: string;
  score: number;
  maxScore: number;
  weight: number;
  description: string;
  status: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'VERY_POOR';
  data: any;
  improvements: string[];
}

export interface CreditBenefits {
  maxLTV: number;
  interestRateDiscount: number;
  maxBorrowAmount: number;
  priorityAccess: boolean;
  liquidationBuffer: number;
}

export type CreditGrade = 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'VERY_POOR';

export interface OnChainData {
  walletAddress: string;
  walletAge: number; // months
  totalTransactions: number;
  blendRepaymentHistory: RepaymentHistory;
  collateralizationRatios: CollateralizationData;
  liquidationHistory: LiquidationHistory;
  assetDiversity: AssetDiversityData;
  loanActivity: LoanActivityData;
}

export interface RepaymentHistory {
  totalLoans: number;
  onTimePayments: number;
  latePayments: number;
  missedPayments: number;
  averageRepaymentTime: number; // days
  recentActivity: RepaymentRecord[];
}

export interface RepaymentRecord {
  loanId: string;
  amount: number;
  dueDate: Date;
  paidDate: Date | null;
  status: 'ON_TIME' | 'LATE' | 'MISSED' | 'PENDING';
  daysDelta: number;
}

export interface CollateralizationData {
  currentRatio: number;
  averageRatio: number;
  timeWeightedAverage: number;
  monthlyAverages: MonthlyRatio[];
  riskEvents: RiskEvent[];
}

export interface MonthlyRatio {
  month: string;
  averageRatio: number;
  minRatio: number;
  maxRatio: number;
}

export interface RiskEvent {
  date: Date;
  type: 'NEAR_LIQUIDATION' | 'MARGIN_CALL' | 'FORCED_LIQUIDATION';
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  description: string;
}

export interface LiquidationHistory {
  totalLiquidations: number;
  recentLiquidations: number; // last 6 months
  totalLiquidatedValue: number;
  averageLiquidationSize: number;
  liquidationEvents: LiquidationEvent[];
}

export interface LiquidationEvent {
  date: Date;
  amount: number;
  asset: string;
  reason: string;
  recoveryTime: number; // days to rebuild position
}

export interface AssetDiversityData {
  uniqueAssets: number;
  uniqueProtocols: number;
  assetDistribution: AssetAllocation[];
  protocolUsage: ProtocolUsage[];
  concentrationRisk: number;
}

export interface AssetAllocation {
  asset: string;
  percentage: number;
  value: number;
}

export interface ProtocolUsage {
  protocol: string;
  transactionCount: number;
  totalVolume: number;
  lastUsed: Date;
}

export interface LoanActivityData {
  totalLoans: number;
  averageLoanSize: number;
  loanFrequency: number; // per month
  last12MonthsActivity: MonthlyActivity[];
  preferredLoanSizes: number[];
  seasonalPatterns: SeasonalPattern[];
}

export interface MonthlyActivity {
  month: string;
  loanCount: number;
  totalAmount: number;
  averageSize: number;
}

export interface SeasonalPattern {
  period: string;
  activityLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  averageSize: number;
  frequency: number;
}

export interface CreditSimulation {
  scenario: string;
  description: string;
  parameters: SimulationParameters;
  projectedScore: number;
  scoreDelta: number;
  timeframe: string;
  requirements: string[];
}

export interface SimulationParameters {
  [key: string]: any;
}

export interface AIRecommendation {
  id: string;
  factor: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  impact: number; // potential score improvement
  effort: 'LOW' | 'MEDIUM' | 'HIGH';
  timeframe: string;
  description: string;
  actionItems: string[];
}

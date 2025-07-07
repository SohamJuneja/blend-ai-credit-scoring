import {
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import {
  Box,
  Card,
  CardContent,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
} from '@mui/material';

interface Recommendation {
  id: string;
  title: string;
  description: string;
  impact: number;
  timeframe: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  actions: string[];
}

interface ImprovementSuggestionsProps {
  currentScore: number;
  factors: any[];
}

const ImprovementSuggestions: React.FC<ImprovementSuggestionsProps> = ({
  currentScore,
  factors,
}) => {
  const generateRecommendations = (): Recommendation[] => {
    const recommendations: Recommendation[] = [];

    // Find lowest scoring factors
    const sortedFactors = [...factors].sort((a, b) => a.score / a.maxScore - b.score / b.maxScore);

    // Generate recommendations for lowest scoring factors
    if (sortedFactors.length > 0) {
      const lowestFactor = sortedFactors[0];
      const percentage = (lowestFactor.score / lowestFactor.maxScore) * 100;

      if (percentage < 70) {
        recommendations.push({
          id: 'improve_lowest',
          title: `Improve ${lowestFactor.name}`,
          description: `Your ${lowestFactor.name} score is at ${percentage.toFixed(
            0
          )}%. Focus on this area for maximum impact.`,
          impact: Math.floor(((100 - percentage) * lowestFactor.maxScore) / 100),
          timeframe: '2-3 months',
          priority: 'HIGH',
          actions: getActionsForFactor(lowestFactor.name),
        });
      }
    }

    // Add general recommendations
    if (currentScore < 700) {
      recommendations.push({
        id: 'general_improvement',
        title: 'Build Payment History',
        description:
          'Consistent on-time payments are the most important factor for credit scoring.',
        impact: 50,
        timeframe: '3-6 months',
        priority: 'HIGH',
        actions: [
          'Set up automatic payments for all loans',
          'Pay loans early when possible',
          'Never miss a payment deadline',
          'Use calendar reminders for payment dates',
        ],
      });
    }

    if (currentScore < 600) {
      recommendations.push({
        id: 'diversify_portfolio',
        title: 'Diversify Your DeFi Portfolio',
        description: 'Use multiple protocols and assets to show sophisticated DeFi knowledge.',
        impact: 30,
        timeframe: '1-2 months',
        priority: 'MEDIUM',
        actions: [
          'Use at least 3 different DeFi protocols',
          'Hold 5+ different assets',
          'Reduce concentration in any single asset',
          'Explore new DeFi opportunities regularly',
        ],
      });
    }

    return recommendations;
  };

  const getActionsForFactor = (factorName: string): string[] => {
    const actionMap: { [key: string]: string[] } = {
      'Wallet Age': [
        'Continue using your wallet regularly',
        'Avoid switching to new wallets',
        'Maintain consistent activity',
      ],
      'Transaction History': [
        'Make regular DeFi transactions',
        'Use various protocols and features',
        'Maintain consistent on-chain activity',
      ],
      'Repayment History': [
        'Always pay loans on time',
        'Set up automatic payments',
        'Pay early when possible',
        'Never miss payment deadlines',
      ],
      'Collateralization Management': [
        'Maintain ratios above 150%',
        'Add collateral before ratios drop',
        'Monitor positions daily',
        'Set up liquidation alerts',
      ],
      'Liquidation History': [
        'Avoid liquidations at all costs',
        'Monitor positions closely',
        'Use stop-loss strategies',
        'Maintain emergency reserves',
      ],
      'Asset Diversity': [
        'Use 5+ different assets',
        'Interact with 3+ protocols',
        'Reduce concentration risk',
        'Explore new DeFi opportunities',
      ],
      'Loan Activity Pattern': [
        'Take 1-2 loans per month',
        'Maintain consistent patterns',
        'Use loans productively',
        'Gradually increase loan sizes',
      ],
    };

    return actionMap[factorName] || ['Focus on improving this metric'];
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'error';
      case 'MEDIUM':
        return 'warning';
      case 'LOW':
        return 'info';
      default:
        return 'default';
    }
  };

  const recommendations = generateRecommendations();

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          <TrendingUpIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Improvement Suggestions
        </Typography>

        {recommendations.length === 0 ? (
          <Typography color="text.secondary">
            Great job! Your credit score is in excellent condition. Keep maintaining your current
            practices.
          </Typography>
        ) : (
          <List>
            {recommendations.map((rec) => (
              <ListItem
                key={rec.id}
                sx={{ mb: 2, p: 2, border: 1, borderColor: 'divider', borderRadius: 2 }}
              >
                <Box width="100%">
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="h6">{rec.title}</Typography>
                    <Box display="flex" gap={1}>
                      <Chip
                        label={rec.priority}
                        size="small"
                        color={getPriorityColor(rec.priority)}
                      />
                      <Chip label={`+${rec.impact} points`} size="small" color="success" />
                    </Box>
                  </Box>

                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {rec.description}
                  </Typography>

                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <ScheduleIcon fontSize="small" color="action" />
                    <Typography variant="caption" color="text.secondary">
                      Expected timeframe: {rec.timeframe}
                    </Typography>
                  </Box>

                  <Typography variant="body2" fontWeight="medium" gutterBottom>
                    Action Steps:
                  </Typography>
                  <List dense>
                    {rec.actions.map((action, index) => (
                      <ListItem key={index} sx={{ py: 0.5, px: 0 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <CheckCircleIcon fontSize="small" color="primary" />
                        </ListItemIcon>
                        <ListItemText
                          primary={action}
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              </ListItem>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
};

export default ImprovementSuggestions;

import {
  useBackstop,
  useBackstopPool,
  usePool,
  usePoolMeta,
  usePoolOracle,
  useTokenMetadata,
} from '../hooks/api';
import {
  BackstopPoolEst,
  PoolEstimate,
  Reserve,
} from '@blend-capital/blend-sdk';
import { Box, Typography } from '@mui/material';
import { toBalance, toCompactAddress, toPercentage } from '../utils/formatter';
import { TokenIcon } from '../components/common/TokenIcon';

const SimpleMarketCard: React.FC = () => {
  const poolId = 'CCLBPEYS3XFK65MYYXSBMOGKUI4ODN5S7SUZBGD7NALUQF64QILLX5B5';

  const { data: poolMeta } = usePoolMeta(poolId);
  const { data: pool } = usePool(poolMeta);
  const { data: oracle } = usePoolOracle(pool);
  const { data: backstop } = useBackstop(poolMeta?.version);
  const { data: backstopPool } = useBackstopPool(poolMeta);

  if (!poolMeta || !pool || !oracle || !backstop || !backstopPool) {
    return (
      <Box sx={{ padding: 2, margin: 1, border: '1px solid #eee', borderRadius: '8px' }}>
        Loading pool data...
      </Box>
    );
  }

  const poolEst = PoolEstimate.build(pool.reserves, oracle);
  const backstopPoolEst = BackstopPoolEst.build(backstop.backstopToken, backstopPool.poolBalance);

  const estBackstopApr =
    poolEst && backstopPoolEst.totalSpotValue > 0
      ? ((pool.metadata.backstopRate / 1e7) * poolEst.avgBorrowApy * poolEst.totalBorrowed) /
        backstopPoolEst.totalSpotValue
      : 0;

  return (
    <Box
      sx={{
        border: '1px solid #ccc',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '16px',
      }}
    >
      <Typography variant="h6">{pool.metadata.name}</Typography>
      <Typography variant="body2">Pool ID: {toCompactAddress(pool.id)}</Typography>
      <Typography variant="body2">Oracle: {toCompactAddress(pool.metadata.oracle)}</Typography>
      <Typography variant="body2">Admin: {toCompactAddress(pool.metadata.admin)}</Typography>
      <Typography variant="body2">Max Positions: {pool.metadata.maxPositions}</Typography>
      <Typography variant="body2">
        Min Collateral: ${toBalance(pool.metadata.minCollateral, oracle.decimals)}
      </Typography>

      <Box mt={2}>
        <Typography variant="subtitle2">Stats:</Typography>
        <Typography>Supplied: ${toBalance(poolEst?.totalSupply)}</Typography>
        <Typography>Borrowed: ${toBalance(poolEst?.totalBorrowed)}</Typography>
        <Typography>Backstop Value: ${toBalance(backstopPoolEst?.totalSpotValue)}</Typography>
        <Typography>Backstop APR: {toPercentage(estBackstopApr)}</Typography>
        <Typography>Take Rate: {toPercentage(pool.metadata.backstopRate / 1e7)}</Typography>
        <Typography>Q4W %: {toPercentage(backstopPoolEst?.q4wPercentage)}</Typography>
      </Box>

      <Box mt={2}>
      <AssetListWithMetadata reserves={pool.reserves} />
      </Box>
    </Box>
  );
};

export default SimpleMarketCard;



interface AssetListWithMetadataProps {
  reserves: Map<string, Reserve>;
}

export const AssetListWithMetadata: React.FC<AssetListWithMetadataProps> = ({ reserves }) => {
  // const theme = useTheme();
  const reserveArray = Array.from(reserves.values());

  return (
    <Box mt={2}>
      <Typography variant="subtitle2" gutterBottom>
        Assets in Pool:
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {reserveArray.map((reserve) => {
          const { data: metadata } = useTokenMetadata(reserve.assetId);

          const collateralFactor = toPercentage(reserve.config.c_factor / 1e7);
          const liabilityFactor = toPercentage(1 / (reserve.config.l_factor / 1e7));
          const supplyApy = toPercentage(reserve.estSupplyApy);
          const borrowApy = toPercentage(reserve.estBorrowApy);

          const domain =
            metadata?.domain || toCompactAddress(metadata?.asset?.issuer ?? reserve.assetId);

          return (
            <Box
              key={reserve.assetId}
              sx={{
                border: '1px solid #ddd',
                borderRadius: 2,
                padding: 2,
                // background: theme.palette.background.paper,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <TokenIcon reserve={reserve} height="24px" width="24px" />
                <Box>
                  <Typography variant="body1">
                    {metadata?.symbol ?? reserve.symbol}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {domain}
                  </Typography>
                </Box>
              </Box>

              <Typography variant="body2">
                Asset ID: {toCompactAddress(reserve.assetId)}
              </Typography>
              <Typography variant="body2">
                Total Supplied: ${toBalance(reserve.totalSupplyFloat())}
              </Typography>
              <Typography variant="body2">
                Total Borrowed: ${toBalance(reserve.totalLiabilitiesFloat())}
              </Typography>
              <Typography variant="body2">
                Collateral Factor: {collateralFactor}
              </Typography>
              <Typography variant="body2">
                Liability Factor: {liabilityFactor}
              </Typography>
              <Typography variant="body2">
                Supply APY: {supplyApy}
              </Typography>
              <Typography variant="body2">
                Borrow APY: {borrowApy}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};
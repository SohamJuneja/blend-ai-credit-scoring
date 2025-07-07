import { FixedMath ,  PositionsEstimate} from '@blend-capital/blend-sdk';
import { Button, Typography, Box } from '@mui/material';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import {
  usePoolMeta,
  usePool,
  useTokenMetadata,
  useTokenBalance,
  useHorizonAccount,
  usePoolOracle,
  useBackstop,
  usePoolUser
} from '../hooks/api';
import { estimateEmissionsApr } from '../utils/math';
import { toBalance} from '../utils/formatter';
import { ReserveConfigV2 } from '@blend-capital/blend-sdk';

import {
  
  PoolUser
 
} from '@blend-capital/blend-sdk';


import { useState } from 'react';
import { useTheme } from '@mui/material';
import { useWallet } from '../contexts/wallet';

import { scaleInputToBigInt } from '../utils/scval';
import { getAssetReserve } from '../utils/horizon';
import { RequestType, SubmitArgs } from '@blend-capital/blend-sdk';



import {
  
 
  CircularProgress,
  Link,
} from '@mui/material';

import OpenInNewIcon from '@mui/icons-material/OpenInNew';


import { toCompactAddress } from '../utils/formatter';
import { getTokenLinkFromReserve } from '../utils/token';

import * as formatter from '../utils/formatter';






const MinimalSupply: NextPage = () => {
  const router = useRouter();
  // const { poolId, assetId } = router.query;
  const safePoolId = "CCLBPEYS3XFK65MYYXSBMOGKUI4ODN5S7SUZBGD7NALUQF64QILLX5B5";
  const safeAssetId = "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC";

  const { data: poolMeta } = usePoolMeta(safePoolId);
  const { data: pool } = usePool(poolMeta);
  const reserve = pool?.reserves.get(safeAssetId);
  const { data: tokenMetadata } = useTokenMetadata(safeAssetId);
  const { data: horizonAccount } = useHorizonAccount();
  const { data: tokenBalance } = useTokenBalance(
    reserve?.assetId,
    tokenMetadata?.asset,
    horizonAccount,
    Boolean(reserve)
  );
  const { data: poolOracle } = usePoolOracle(pool);
  const { data: backstop } = useBackstop(poolMeta?.version);

  const symbol = tokenMetadata?.symbol ?? 'Token';
  const decimals = reserve?.config.decimals ?? 6;
  const balance = toBalance(tokenBalance, decimals);

  const emissionsPerAsset =
    reserve?.supplyEmissions?.emissionsPerYearPerToken(
      reserve.totalSupply(),
      decimals
    ) ?? 0;

  const oraclePrice = reserve ? poolOracle?.getPriceFloat(reserve.assetId) ?? 0 : 0;

  const emissionApr =
    backstop && emissionsPerAsset > 0 && oraclePrice
      ? estimateEmissionsApr(emissionsPerAsset, backstop.backstopToken, oraclePrice)
      : 0;

  const supplySimulation = balance && emissionApr
    ? ((parseFloat(balance) * emissionApr) / 100).toFixed(4)
    : '0';


      const atSupplyLimit =
        reserve && reserve.config instanceof ReserveConfigV2
          ? FixedMath.toFloat(reserve.config.supply_cap, reserve.config.decimals) -
              reserve.totalSupplyFloat() <=
            0
          : false;

  return (
    <Box sx={{ padding: 4, maxWidth: 500, margin: '0 auto', border: '1px solid #ddd', borderRadius: 2 }}>
      <Typography variant="h5" gutterBottom>Supply {symbol}</Typography>

      <Typography variant="body1">Balance: {balance} {symbol}</Typography>
      <Typography variant="body1">Supply APY: {emissionApr?.toFixed(2)}%</Typography>
      <Typography variant="body2" sx={{ mt: 1, color: 'gray' }}>
        Est. Yield (1Y): {supplySimulation} {symbol}
      </Typography>

      <Button variant="contained" color="primary" sx={{ mt: 3, width: '100%' }}>
        Supply
      </Button>

      <LendAnvilMinimal 
        poolId={safePoolId}
        assetId={safeAssetId}
      />

      {atSupplyLimit && (
        <Typography variant="body2" color="error" sx={{ mt: 2 }}>
          You have reached the supply limit for this asset.
        </Typography>
      )}

      <MinimalBorrow
        poolId={safePoolId}
        assetId={safeAssetId}
      />
    </Box>
  );
};

export default MinimalSupply;




export const LendAnvilMinimal = ({ poolId, assetId }) => {
  const theme = useTheme();
  const { connected, walletAddress, poolSubmit } = useWallet();
  const { data: poolMeta } = usePoolMeta(poolId);
  const { data: pool } = usePool(poolMeta);
  const { data: tokenMetadata } = useTokenMetadata(assetId);
  const { data: horizonAccount } = useHorizonAccount();
  const { data: tokenBalance } = useTokenBalance(
    assetId,
    tokenMetadata?.asset,
    horizonAccount
  );

  const [toLend, setToLend] = useState('');
  const reserve = pool?.reserves.get(assetId);
  const decimals = reserve?.config.decimals ?? 7;

  const balanceFloat =
    (tokenBalance && reserve)
      ? Number(tokenBalance) / 10 ** decimals -
        getAssetReserve(horizonAccount, tokenMetadata?.asset)
      : 0;

  const handleMax = () => {
    if (balanceFloat > 0) {
      setToLend(balanceFloat.toFixed(decimals));
    }
  };

  const handleSupply = async () => {
    if (!connected || !walletAddress || !poolMeta || !reserve || !toLend) return;

    const submitArgs: SubmitArgs = {
      from: walletAddress,
      spender: walletAddress,
      to: walletAddress,
      requests: [
        {
          amount: scaleInputToBigInt(toLend, decimals),
          request_type: RequestType.SupplyCollateral,
          address: reserve.assetId,
        },
      ],
    };

    await poolSubmit(poolMeta, submitArgs, false); // false = real transaction
  };

  return (
    <Box sx={{ p: 3, border: '1px solid #ddd', borderRadius: 2, maxWidth: 500 }}>
      <Typography variant="h6" mb={2}>
        Supply {tokenMetadata?.symbol ?? 'Token'}
      </Typography>
      <Box display="flex" gap={1} mb={2}>
        <input
          type="number"
          placeholder="Amount"
          value={toLend}
          onChange={(e) => setToLend(e.target.value)}
          style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        <Button onClick={handleMax}>MAX</Button>
      </Box>
      <Button
        variant="contained"
        color="primary"
        fullWidth
        disabled={!connected || !toLend || parseFloat(toLend) <= 0}
        onClick={handleSupply}
      >
        Supply
      </Button>
    </Box>
  );
};





const MinimalBorrow: NextPage = ({ poolId, assetId }) => {
  const theme = useTheme();
  const router = useRouter();
  // const { poolId, assetId } = router.query;

  const safePoolId = typeof poolId === 'string' ? poolId : '';
  const safeAssetId = typeof assetId === 'string' ? assetId : '';

  const { data: poolMeta } = usePoolMeta(safePoolId);
  const { data: pool } = usePool(poolMeta);
  const { data: tokenMetadata } = useTokenMetadata(safeAssetId);
  const { data: poolOracle } = usePoolOracle(pool);
  const { connected, walletAddress, poolSubmit, isLoading } = useWallet();

   const { data: poolUser } = usePoolUser(pool);

  const reserve = pool?.reserves.get(safeAssetId);
  const decimals = reserve?.config.decimals ?? 7;
  const tokenSymbol = tokenMetadata?.symbol ?? toCompactAddress(safeAssetId);

  const maxUtilFloat = reserve ? FixedMath.toFloat(BigInt(reserve.config.max_util), 7) : 1;
  const totalSupplied = reserve ? reserve.totalSupplyFloat() : 0;
  const availableToBorrow = reserve
    ? Math.max(totalSupplied * maxUtilFloat - reserve.totalLiabilitiesFloat(), 0)
    : 0;

  const emissionsPerAsset =
    reserve && reserve.borrowEmissions
      ? reserve.borrowEmissions.emissionsPerYearPerToken(
          reserve.totalLiabilities(),
          decimals
        )
      : 0;
  const oraclePrice = reserve ? poolOracle?.getPriceFloat(reserve.assetId) : 0;

  const emissionApr =
    reserve && oraclePrice && emissionsPerAsset > 0 && poolMeta
      ? estimateEmissionsApr(emissionsPerAsset, poolMeta.backstopToken, oraclePrice)
      : 0;

  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

    const curPositionEstimate =
      pool && poolUser && poolOracle
        ? PositionsEstimate.build(pool, poolOracle, poolUser.positions)
        : undefined;
 
  
    const assetToBase = poolOracle?.getPriceFloat(assetId);

  const handleMax = () => {
    setAmount(availableToBorrow.toFixed(decimals));

     if (reserve && assetToBase && curPositionEstimate) {
          let to_bounded_hf =
            (curPositionEstimate.totalEffectiveCollateral -
              curPositionEstimate.totalEffectiveLiabilities * 1.02) /
            1.02;
          let to_borrow = Math.min(
            to_bounded_hf / (assetToBase * reserve.getLiabilityFactor()),
            reserve.totalSupplyFloat() *
              (FixedMath.toFloat(BigInt(reserve.config.max_util), 7) - 0.01) -
              reserve.totalLiabilitiesFloat()
          );
          setAmount(Math.max(to_borrow, 0).toFixed(7));
          // setLoadingEstimate(true);
        }
  };

  const handleBorrow = async () => {
    if (!connected || !poolMeta || !walletAddress || !reserve || !amount) return;

    setSubmitting(true);
    const submitArgs: SubmitArgs = {
      from: walletAddress,
      to: walletAddress,
      spender: walletAddress,
      requests: [
        {
          amount: BigInt(Math.floor(parseFloat(amount) * 10 ** decimals)),
          address: reserve.assetId,
          request_type: RequestType.Borrow,
        },
      ],
    };

    await poolSubmit(poolMeta, submitArgs, false);
    setSubmitting(false);
    setAmount('');
  };

  if (!pool || !reserve) return <CircularProgress />;

  return (
    <Box sx={{ p: 3, maxWidth: 500, margin: '0 auto', border: '1px solid #ddd', borderRadius: 2 }}>
      <Typography variant="h6" gutterBottom>Borrow {tokenSymbol}</Typography>

      <Box display="flex" justifyContent="space-between" mb={1}>
        <Typography>Available: {toBalance(availableToBorrow, decimals)}</Typography>
        <Link
          href={getTokenLinkFromReserve(reserve)}
          target="_blank"
          rel="noopener"
          sx={{ display: 'flex', alignItems: 'center', fontSize: 14 }}
        >
          {tokenSymbol}
          <OpenInNewIcon fontSize="inherit" sx={{ ml: 0.5 }} />
        </Link>
      </Box>

      <Typography variant="body2" mb={1}>
        Borrow APY: {formatter.toPercentage(reserve.estBorrowApy)}% + Emission: {formatter.toPercentage(emissionApr)}%

        
      </Typography>

      <Box display="flex" gap={1} mb={2}>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount"
          style={{ flex: 1, padding: '8px', border: '1px solid #ccc', borderRadius: 4 }}
        />
        <Button variant="outlined" onClick={handleMax}>
          MAX
        </Button>
      </Box>

      <Button
        variant="contained"
        color="primary"
        fullWidth
        onClick={handleBorrow}
        disabled={!connected || submitting || parseFloat(amount || '0') <= 0}
      >
        {submitting ? 'Borrowing...' : 'Borrow'}
      </Button>
    </Box>
  );
};

// export default MinimalBorrow;

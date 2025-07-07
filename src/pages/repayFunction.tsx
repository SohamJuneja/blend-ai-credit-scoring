import { useState } from 'react';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import {
  Box,
  Typography,
  Button,
  useTheme,
  Link,
  CircularProgress,
} from '@mui/material';
import { FixedMath, RequestType, SubmitArgs,PositionsEstimate } from '@blend-capital/blend-sdk';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import {
  usePoolMeta,
  usePool,
  useTokenMetadata,
  useHorizonAccount,
  usePoolUser,
  useTokenBalance,
  usePoolOracle
} from '../hooks/api';
import { toBalance, toCompactAddress } from '../utils/formatter';
import { getTokenLinkFromReserve } from '../utils/token';
import { useWallet } from '../contexts/wallet';

import { scaleInputToBigInt } from '../utils/scval';
import { OpaqueButton } from '../components/common/OpaqueButton';
import { InputBar } from '../components/common/InputBar';
import { InputButton } from '../components/common/InputButton';

const MinimalRepay: NextPage = () => {
  const theme = useTheme();
  const router = useRouter();
  const { poolId, assetId } = router.query;

  const safePoolId = "CCLBPEYS3XFK65MYYXSBMOGKUI4ODN5S7SUZBGD7NALUQF64QILLX5B5";
  const safeAssetId = "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC";

  const { data: poolMeta } = usePoolMeta(safePoolId);
  const { data: pool } = usePool(poolMeta);
  const { data: tokenMetadata } = useTokenMetadata(safeAssetId);
  const { data: horizonAccount } = useHorizonAccount();
  const { data: poolUser } = usePoolUser(pool);
  const { data: tokenBalance } = useTokenBalance(
    safeAssetId,
    tokenMetadata?.asset,
    horizonAccount
  );

  const { connected, walletAddress, poolSubmit } = useWallet();

  const reserve = pool?.reserves.get(safeAssetId);
  const decimals = reserve?.config.decimals ?? 7;
  const symbol = tokenMetadata?.symbol ?? toCompactAddress(safeAssetId);

  const balanceFloat =
    tokenBalance && reserve
      ? Number(tokenBalance) / 10 ** decimals
      : 0;

  const currentDebt =
    poolUser && reserve ? poolUser.getLiabilitiesFloat(reserve) : 0;

  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleMax = () => {
    const max = Math.min(balanceFloat, currentDebt * 1.005); // add a small buffer to cover all debt
    setAmount(max.toFixed(decimals));
  };

  const handleRepay = async () => {
    if (!connected || !walletAddress || !poolMeta || !reserve || !amount) return;

    setLoading(true);
    const submitArgs: SubmitArgs = {
      from: walletAddress,
      to: walletAddress,
      spender: walletAddress,
      requests: [
        {
          amount: BigInt(Math.floor(parseFloat(amount) * 10 ** decimals)),
          address: reserve.assetId,
          request_type: RequestType.Repay,
        },
      ],
    };

    await poolSubmit(poolMeta, submitArgs, false);
    setAmount('');
    setLoading(false);
  };

  if (!pool || !reserve) return <CircularProgress />;

  return (<>
    <Box sx={{ p: 3, maxWidth: 500, margin: '0 auto', border: '1px solid #ddd', borderRadius: 2 }}>
      <Typography variant="h6" gutterBottom>Repay {symbol}</Typography>

      <Box display="flex" justifyContent="space-between" mb={1}>
        <Typography>Debt: {toBalance(currentDebt, decimals)}</Typography>
        <Link
          href={getTokenLinkFromReserve(reserve)}
          target="_blank"
          rel="noopener"
          sx={{ display: 'flex', alignItems: 'center', fontSize: 14 }}
        >
          {symbol}
          <OpenInNewIcon fontSize="inherit" sx={{ ml: 0.5 }} />
        </Link>
      </Box>

      <Typography variant="body2" mb={1}>
        Wallet Balance: {toBalance(balanceFloat, decimals)} {symbol}
      </Typography>

      <Box display="flex" gap={1} mb={2}>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount to repay"
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
        onClick={handleRepay}
        disabled={!connected || loading || parseFloat(amount || '0') <= 0}
      >
        {loading ? 'Repaying...' : 'Repay'}
      </Button>
    </Box>

  <MinimalWithdraw
    poolId={safePoolId}
    assetId={safeAssetId}
    isCollateral={ true}
  />
    
 </> );
};

export default MinimalRepay;






export const MinimalWithdraw = ({ poolId, assetId, isCollateral }: {
  poolId: string;
  assetId: string;
  isCollateral: boolean;
}) => {
  const theme = useTheme();
  const { connected, walletAddress, poolSubmit } = useWallet();
  const { data: poolMeta } = usePoolMeta(poolId);
  const { data: pool } = usePool(poolMeta);
  const { data: poolUser } = usePoolUser(pool);
  const { data: tokenMetadata } = useTokenMetadata(assetId);
  const { data: horizonAccount } = useHorizonAccount();
 const { data: poolOracle } = usePoolOracle(pool);
  const reserve = pool?.reserves.get(assetId);
  const symbol = tokenMetadata?.symbol ?? toCompactAddress(assetId);
  const decimals = reserve?.config.decimals ?? 7;

  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);


    const curPositionsEstimate =
      pool && poolOracle && poolUser
        ? PositionsEstimate.build(pool, poolOracle, poolUser.positions)
        : undefined;

  
    const assetToBase = poolOracle?.getPriceFloat(assetId);
  
 

  
    const handleWithdrawMax = () => {
      if (reserve && poolUser) {
        let curSupplied = isCollateral
          ? poolUser.getCollateralFloat(reserve)
          : poolUser.getSupplyFloat(reserve);
        if (poolUser.positions.liabilities.size === 0 || isCollateral === false) {
          setAmount((curSupplied * 1.005).toFixed(decimals));
        } else if (curPositionsEstimate && assetToBase) {
          let to_bounded_hf =
            (curPositionsEstimate.totalEffectiveCollateral -
              curPositionsEstimate.totalEffectiveLiabilities * 1.02) /
            1.02;
          let to_wd = to_bounded_hf / (assetToBase * reserve.getCollateralFactor());
          let withdrawAmount = Math.min(to_wd, curSupplied) + 1 / 10 ** decimals;
          setAmount(Math.max(withdrawAmount, 0).toFixed(decimals));
        }
      }
    };
  
  

  const handleWithdraw = async () => {
    if (!connected || !poolMeta || !reserve || !walletAddress) return;
    setSubmitting(true);
    const submitArgs: SubmitArgs = {
      from: walletAddress,
      to: walletAddress,
      spender: walletAddress,
      requests: [{
        amount: scaleInputToBigInt(amount, decimals),
        request_type: isCollateral ? RequestType.WithdrawCollateral : RequestType.Withdraw,
        address: reserve.assetId,
      }],
    };
    try {
      await poolSubmit(poolMeta, submitArgs, false);
    } finally {
      setSubmitting(false);
    }
  };

  if (!pool || !poolUser || !reserve) return null;

  return (
    <Box
      sx={{
        background: theme.palette.lend.opaque,
        padding: '16px',
        borderRadius: '8px',
        maxWidth: '420px',
        margin: '0 auto',
      }}
    >
      <Typography variant="h6" gutterBottom>
        Withdraw {symbol}
      </Typography>
      <InputBar
        symbol={symbol}
        value={amount}
        onValueChange={setAmount}
        palette={theme.palette.lend}
      >
        <InputButton
          text="MAX"
          onClick={handleWithdrawMax}
          palette={theme.palette.lend}
        />
      </InputBar>
      <OpaqueButton
        onClick={handleWithdraw}
        disabled={submitting || !amount}
        palette={theme.palette.lend}
        sx={{ marginTop: '16px', width: '100%' }}
      >
        {submitting ? 'Withdrawing...' : 'Withdraw'}
      </OpaqueButton>
    </Box>
  );
};


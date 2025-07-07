import React, { useState } from 'react';
import {
  FixedMath,
  PoolEstimate,
  PositionsEstimate,
  PoolContractV1,
  PoolClaimArgs,
  ContractErrorType,
  parseError,
} from '@blend-capital/blend-sdk';
import { rpc } from '@stellar/stellar-sdk';
import { usePool, usePoolMeta, usePoolOracle, usePoolUser, useHorizonAccount, useSimulateOperation } from '../hooks/api';
import { useWallet } from '../contexts/wallet';
import { requiresTrustline } from '../utils/horizon';
import { BLND_ASSET } from '../utils/token_display';
import { toBalance, toPercentage } from '../utils/formatter';


// import React from 'react';
import { Reserve } from '@blend-capital/blend-sdk';
import { useRouter } from 'next/router';
import { Box, Typography, Button } from '@mui/material';
import {

  useBackstop,
  useTokenMetadata,
} from '../hooks/api';
import { PoolComponentProps } from '../components/common/PoolComponentProps';
import * as formatter from '../utils/formatter';
import { estimateEmissionsApr } from '../utils/math';

const safePoolId = 'CCLBPEYS3XFK65MYYXSBMOGKUI4ODN5S7SUZBGD7NALUQF64QILLX5B5';

const UserInfo = () => {
  const { connected, walletAddress, poolClaim, createTrustlines, restore } = useWallet();
  const { data: poolMeta } = usePoolMeta(safePoolId);
  const { data: pool } = usePool(poolMeta);
  const { data: poolOracle } = usePoolOracle(pool);
  const { data: userPoolData, refetch: refetchUserData } = usePoolUser(pool);
  const { data: account, refetch: refetchAccount } = useHorizonAccount();

  const [loading, setLoading] = useState(false);

  const emissions = userPoolData && pool
    ? userPoolData.estimateEmissions(Array.from(pool.reserves.values())).emissions
    : 0;

  const claimedTokens = userPoolData && pool
    ? userPoolData.estimateEmissions(Array.from(pool.reserves.values())).claimedTokens
    : [];

  const hasBLNDTrustline = account ? !requiresTrustline(account, BLND_ASSET) : false;

  const poolContract = new PoolContractV1(safePoolId);
  const claimArgs: PoolClaimArgs = {
    from: walletAddress,
    to: walletAddress,
    reserve_token_ids: claimedTokens,
  };

  const sim_op = claimedTokens.length > 0 && walletAddress ? poolContract.claim(claimArgs) : '';
  const { data: simResult, refetch: refetchSim } = useSimulateOperation(sim_op, claimedTokens.length > 0 && connected);

  const isRestore = simResult && rpc.Api.isSimulationRestore(simResult);
  const isError = simResult && rpc.Api.isSimulationError(simResult);

  const handleClaim = async () => {
    setLoading(true);
    try {
      await poolClaim(poolMeta!, claimArgs, false);
      await refetchUserData();
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTrustline = async () => {
    await createTrustlines([BLND_ASSET]);
    await refetchAccount();
  };

  const handleRestore = async () => {
    if (simResult && isRestore) {
      await restore(simResult);
      await refetchSim();
    }
  };

  // Guard until all required data is loaded
  if (!pool || !poolOracle || !userPoolData || !account) {
    return <div>Loading user data...</div>;
  }

  const userEst = PositionsEstimate.build(pool, poolOracle, userPoolData.positions);

  let buttonText = `Claim ${toBalance(emissions)} BLND`;
  let buttonAction = handleClaim;
  let disabled = false;

  if (!hasBLNDTrustline) {
    buttonText = 'Add BLND Trustline';
    buttonAction = handleCreateTrustline;
  } else if (isRestore) {
    buttonText = 'Restore Data';
    buttonAction = handleRestore;
  } else if (isError) {
    const errorType = parseError(simResult).type;
    buttonText = `Error: ${ContractErrorType[errorType]}`;
    disabled = true;
  }


    const poolUserEst =
      poolOracle !== undefined
        ? PositionsEstimate.build(pool, poolOracle, userPoolData.positions)
        : undefined;

  return (
    <div>
      <h2>User Info</h2>

      <p>
        <strong>Positions:</strong>{' '}
        {`${userPoolData.positions.collateral.size + userPoolData.positions.liabilities.size}/${pool.metadata.maxPositions}`}
      </p>

      <ul>
        <li><strong>Net APY:</strong> {toPercentage(userEst.netApy)}</li>
        <li><strong>Borrow Capacity:</strong> ${toBalance(userEst.borrowCap)}</li>
        <li><strong>Claimable BLND:</strong> {toBalance(emissions)} BLND</li>
      </ul>

      <ul>
        <li><strong>total supplied  pool :</strong> {poolUserEst?.totalSupplied ?? 0}</li>
        {Array.from(pool.reserves.values())
                      .filter((reserve) => {
                        const bTokens =
                        userPoolData.getSupplyBTokens(reserve) +
                        userPoolData.getCollateralBTokens(reserve);
                        return bTokens > BigInt(0);
                      })
                      .map((reserve) => {
                        const bTokens =
                        userPoolData.getSupplyBTokens(reserve) +
                        userPoolData.getCollateralBTokens(reserve);
                        return (
                          <LendPositionCard
                            key={reserve.assetId}
                            poolId={safePoolId}
                            reserve={reserve}
                            bTokens={bTokens}
                          />
                        );
                      })}


            {Array.from(pool.reserves.values())
                          .filter((reserve) => userPoolData.getLiabilities(reserve) > BigInt(0))
                          .map((reserve) => {
                            const dTokens = userPoolData.getLiabilityDTokens(reserve);
                            return (
                              <BorrowCard
                                key={reserve.assetId}
                                poolId={safePoolId}
                                reserve={reserve}
                                dTokens={dTokens}
                              />
                            );
                          })}
      </ul>

      <button onClick={buttonAction} disabled={disabled || loading || claimedTokens.length === 0}>
        {loading ? 'Processing...' : buttonText}
      </button>
    </div>
  );
};

export default UserInfo;



interface LendPositionCardMinimalProps extends PoolComponentProps {
  reserve: Reserve;
  bTokens: bigint;
}

export const LendPositionCard: React.FC<LendPositionCardMinimalProps> = ({
  poolId,
  reserve,
  bTokens,
}) => {
  const router = useRouter();
  const { data: poolMeta } = usePoolMeta(poolId);
  const { data: pool } = usePool(poolMeta);
  const { data: poolOracle } = usePoolOracle(pool);
  const { data: backstop } = useBackstop(poolMeta?.version);
  const { data: tokenMetadata } = useTokenMetadata(reserve.assetId);

  if (!pool || !poolOracle) return null;

  const assetFloat = reserve.toAssetFromBTokenFloat(bTokens);
  const symbol = tokenMetadata?.symbol ?? formatter.toCompactAddress(reserve.assetId);
  const oraclePrice = poolOracle.getPriceFloat(reserve.assetId);

  const emissionsPerAsset = reserve.supplyEmissions?.emissionsPerYearPerToken?.(
    reserve.totalSupply(),
    reserve.config.decimals
  ) ?? 0;

  const blndApr =
    backstop && emissionsPerAsset > 0 && oraclePrice
      ? formatter.toPercentage(
          estimateEmissionsApr(emissionsPerAsset, backstop.backstopToken, oraclePrice)
        )
      : '—';

  const apy = formatter.toPercentage(reserve.estSupplyApy);

  return (
    <Box sx={{ borderBottom: '1px solid #ccc', py: 2 }}>
      <Typography variant="subtitle1">{symbol}</Typography>
      <Typography variant="body2">Balance: {formatter.toBalance(assetFloat)}</Typography>
      <Typography variant="body2">Supply APY: {apy}</Typography>
      <Typography variant="body2">BLND APR: {blndApr}</Typography>

      <Button
        variant="outlined"
        size="small"
        sx={{ mt: 1 }}
        onClick={() =>
          router.push({
            pathname: '/withdraw',
            query: { poolId, assetId: reserve.assetId },
          })
        }
      >
        Withdraw
      </Button>
    </Box>
  );
};

interface MinimalBorrowCardProps extends PoolComponentProps {
  reserve: Reserve;
  dTokens: bigint;
}

export const BorrowCard: React.FC<MinimalBorrowCardProps> = ({
  poolId,
  reserve,
  dTokens,
}) => {
  const router = useRouter();
  const { data: poolMeta } = usePoolMeta(poolId);
  // const { data: poolOracle } = usePoolOracle(poolMeta);
  const { data: tokenMetadata } = useTokenMetadata(reserve.assetId);

  const symbol = tokenMetadata?.symbol ?? formatter.toCompactAddress(reserve.assetId);
  const borrowedAmount = reserve.toAssetFromDTokenFloat(dTokens);
  const borrowApy = formatter.toPercentage(reserve.estBorrowApy);

  return (
    <Box
      sx={{
        border: '1px solid #444',
        borderRadius: '8px',
        padding: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
      }}
    >
      <Typography variant="subtitle1">{symbol}</Typography>
      <Typography variant="body2">Borrowed: {formatter.toBalance(borrowedAmount)}</Typography>
      <Typography variant="body2">Borrow APY: {borrowApy}</Typography>

      <Button
        variant="contained"
        color="secondary"
        onClick={() =>
          router.push({ pathname: '/repay', query: { poolId, assetId: reserve.assetId } })
        }
      >
        Repay
      </Button>
    </Box>
  );
};


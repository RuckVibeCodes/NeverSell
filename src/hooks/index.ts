// GMX Integration Hooks
// Export all GMX-related hooks for NeverSell yield strategy

export {
  useGMXDeposit,
  type UseGMXDepositParams,
  type UseGMXDepositResult,
} from './useGMXDeposit';

export {
  useGMXWithdraw,
  type UseGMXWithdrawParams,
  type UseGMXWithdrawResult,
} from './useGMXWithdraw';

export {
  useGMXPosition,
  useGMXPoolPosition,
  useGMXPositionWithValue,
  type GMPosition,
  type UseGMXPositionParams,
  type UseGMXPositionResult,
} from './useGMXPosition';

export {
  useGMXApy,
  useGMXPoolApy,
  useGMXBlendedApy,
  formatAPY,
  getAPYColorClass,
  type PoolAPY,
  type UseGMXApyResult,
} from './useGMXApy';

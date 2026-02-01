/**
 * NeverSell Hooks
 * 
 * User-facing hooks (use these in components):
 * - useUserPosition: Aggregated position data
 * - useUnifiedAPY: Single blended APY
 * 
 * Protocol hooks (internal use):
 * - useAave*: Aave V3 integration
 * - useGMX*: GMX V2 integration
 * 
 * @example
 * ```tsx
 * import { useUserPosition, useUnifiedAPY } from "@/hooks";
 * ```
 */

// User-facing hooks (THESE ARE THE ONES TO USE IN UI)
export { useUserPosition, formatUSD, formatPercent } from "./useUserPosition";
export { useUnifiedAPY, formatAPY, formatEarnings } from "./useUnifiedAPY";

// Aave hooks (internal - don't expose protocol details to users)
export { useAaveDeposit } from "./useAaveDeposit";
export { useAaveWithdraw } from "./useAaveWithdraw";
export { useAaveBorrow } from "./useAaveBorrow";
export { useAaveRepay } from "./useAaveRepay";
export { useAavePosition } from "./useAavePosition";
export { useAaveSupplyRates, useAaveSupplyRate, FALLBACK_AAVE_SUPPLY_APY } from "./useAaveSupplyRate";

// GMX hooks (internal - don't expose protocol details to users)
export { useGMXApy, useGMXPoolApy, useGMXBlendedApy } from "./useGMXApy";
export { useGMXPosition, useGMXPoolPosition } from "./useGMXPosition";
export { useGMXDeposit } from "./useGMXDeposit";
export { useGMXWithdraw } from "./useGMXWithdraw";

// Bridge hook
export { useLiFiBridge } from "./useLiFiBridge";

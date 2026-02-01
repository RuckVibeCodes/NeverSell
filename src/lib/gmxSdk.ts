// GMX SDK Singleton for NeverSell
// Provides access to GMX markets, tokens, and pricing data

import { GmxSdk } from '@gmx-io/sdk';
import { GMX_SDK_CONFIG } from './gmxConfig';

// Singleton instance
let sdkInstance: GmxSdk | null = null;

/**
 * Get the GMX SDK singleton instance
 * Initializes on first call
 */
export function getGmxSdk(): GmxSdk {
  if (!sdkInstance) {
    sdkInstance = new GmxSdk({
      chainId: GMX_SDK_CONFIG.chainId,
      rpcUrl: GMX_SDK_CONFIG.rpcUrl,
      oracleUrl: GMX_SDK_CONFIG.oracleUrl,
      subsquidUrl: GMX_SDK_CONFIG.subsquidUrl,
    });
  }
  return sdkInstance;
}

/**
 * Reset the SDK instance (useful for testing or re-initialization)
 */
export function resetGmxSdk(): void {
  sdkInstance = null;
}

/**
 * Set the account address for the SDK (for position tracking)
 */
export function setGmxSdkAccount(account: string): void {
  const sdk = getGmxSdk();
  sdk.setAccount(account as `0x${string}`);
}

// Note: For GmxSdk type, import directly from '@gmx-io/sdk'

/**
 * Arbiscan URL helpers for NeverSell
 */

const ARBISCAN_BASE = 'https://arbiscan.io';

/**
 * Get the Arbiscan URL for a transaction
 */
export function getArbiscanTxUrl(hash: string): string {
  return `${ARBISCAN_BASE}/tx/${hash}`;
}

/**
 * Get the Arbiscan URL for an address
 */
export function getArbiscanAddressUrl(address: string): string {
  return `${ARBISCAN_BASE}/address/${address}`;
}

/**
 * Get the Arbiscan URL for a token
 */
export function getArbiscanTokenUrl(address: string): string {
  return `${ARBISCAN_BASE}/token/${address}`;
}

/**
 * Parse common transaction errors into user-friendly messages
 */
export function parseTransactionError(error: Error | null): string | null {
  if (!error) return null;
  
  const message = error.message.toLowerCase();
  
  // User rejected
  if (message.includes('user rejected') || message.includes('user denied')) {
    return 'Transaction cancelled';
  }
  
  // Insufficient balance
  if (message.includes('insufficient balance') || message.includes('exceeds balance')) {
    return 'Insufficient balance for this transaction';
  }
  
  // Insufficient allowance
  if (message.includes('insufficient allowance') || message.includes('allowance')) {
    return 'Token approval required';
  }
  
  // Gas estimation failed
  if (message.includes('gas') && message.includes('estimate')) {
    return 'Transaction would fail - check your inputs';
  }
  
  // Health factor / liquidation
  if (message.includes('health factor') || message.includes('collateral')) {
    return 'Would put position at risk of liquidation';
  }
  
  // Network issues
  if (message.includes('network') || message.includes('connection')) {
    return 'Network error - please try again';
  }
  
  // Generic fallback - extract first sentence or use default
  const firstSentence = error.message.split('.')[0];
  if (firstSentence && firstSentence.length < 100) {
    return firstSentence;
  }
  
  return 'Transaction failed - please try again';
}

/**
 * Transaction status types for UI state management
 */
export type TransactionStatus = 
  | 'idle'
  | 'approving'
  | 'approved'
  | 'pending'
  | 'confirming'
  | 'success'
  | 'error';

/**
 * Derive transaction status from hook states
 */
export function getTransactionStatus(states: {
  needsApproval?: boolean;
  isApproving?: boolean;
  isApprovalPending?: boolean;
  isApprovalSuccess?: boolean;
  isPending?: boolean;
  isSuccess?: boolean;
  error?: Error | null;
}): TransactionStatus {
  const { needsApproval, isApproving, isApprovalPending, isApprovalSuccess, isPending, isSuccess, error } = states;
  
  if (error) return 'error';
  if (isSuccess) return 'success';
  if (isPending) return 'confirming';
  if (isApprovalSuccess && needsApproval === false) return 'approved';
  if (isApprovalPending) return 'approving';
  if (isApproving) return 'approving';
  
  return 'idle';
}

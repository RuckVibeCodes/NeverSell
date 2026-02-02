# NeverSell Portfolio Smart Contract Architecture

**Version:** 1.1 (Security Reviewed)  
**Date:** February 1, 2026  
**Author:** Technical Architect Agent  
**Reviewed By:** Senior Code Reviewer  
**Status:** ✅ SECURITY REVIEWED - See PORTFOLIO_FINAL_SPEC.md for implementation

> ⚠️ **IMPORTANT:** This spec has been updated with critical security fixes.
> For the complete implementation-ready specification, see `PORTFOLIO_FINAL_SPEC.md`

---

## Executive Summary

This document outlines the smart contract architecture for NeverSell's **Social Trading Portfolio** feature. Portfolios allow users to deposit into multi-pool strategies (up to 10 GMX v2 pools), earn a blended APY, and optionally copy creator strategies with automatic rebalancing.

### Key Features
- **Multi-Pool Deposits:** Single deposit distributes across up to 10 GMX v2 GM pools
- **Blended APY:** Unified yield calculation across all pool allocations
- **Creator Earnings:** 20% of copier yield goes to strategy creators
- **Rebalance Guardrails:** Time-delayed rebalances with user notification/approval
- **Gas Efficient:** Batch operations and minimal proxy pattern

---

## 1. Contract Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                                  USER LAYER                                        │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                    │
│  deposit() / withdraw() / copyPortfolio() / stopCopying()                         │
│                                                                                    │
│                                    │                                               │
│                                    ▼                                               │
│  ┌────────────────────────────────────────────────────────────────────────────┐   │
│  │                        PortfolioRouter.sol                                  │   │
│  │  • Single entry point for all portfolio operations                         │   │
│  │  • Validates inputs, handles permits                                        │   │
│  │  • Routes to appropriate portfolio contracts                                │   │
│  └────────────────────────────────────────────────────────────────────────────┘   │
│                                    │                                               │
├──────────────────────────────────────────────────────────────────────────────────┤
│                              PORTFOLIO LAYER                                       │
├──────────────────────────────────────────────────────────────────────────────────┤
│      ┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────┐   │
│      │ PortfolioFactory    │    │ PortfolioRegistry   │    │ PortfolioAPY    │   │
│      │                     │    │                     │    │ Calculator      │   │
│      │ • Deploy portfolios │    │ • Track all         │    │                 │   │
│      │ • Manage creators   │    │   portfolios        │    │ • Blended APY   │   │
│      │ • Upgrade templates │    │ • Copier mappings   │    │ • Weight-avg    │   │
│      └──────────┬──────────┘    │ • Discovery/search  │    │ • Fee-adjusted  │   │
│                 │               └─────────────────────┘    └─────────────────┘   │
│                 │                                                                  │
│                 ▼                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────┐   │
│  │                       Portfolio.sol (per strategy)                          │   │
│  │                                                                              │   │
│  │  ┌───────────────────┐  ┌───────────────────┐  ┌───────────────────────┐   │   │
│  │  │  PoolAllocator    │  │  RebalanceEngine  │  │  ShareAccounting      │   │   │
│  │  │                   │  │                   │  │                       │   │   │
│  │  │  • Up to 10 pools │  │  • Timelock queue │  │  • ERC4626-like       │   │   │
│  │  │  • Weight config  │  │  • Anti-frontrun  │  │  • User shares        │   │   │
│  │  │  • Batch deposits │  │  • User prefs     │  │  • GM token tracking  │   │   │
│  │  └───────────────────┘  └───────────────────┘  └───────────────────────┘   │   │
│  │                                                                              │   │
│  └────────────────────────────────────────────────────────────────────────────┘   │
│                                    │                                               │
├──────────────────────────────────────────────────────────────────────────────────┤
│                              INTEGRATION LAYER                                     │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                    │                                               │
│  ┌─────────────────────────────────┴─────────────────────────────────┐            │
│  │                     GMXMultiPoolAdapter.sol                         │            │
│  │                                                                      │            │
│  │  • Batch deposit to multiple GM pools in single tx                  │            │
│  │  • Batch withdraw from multiple GM pools                            │            │
│  │  • Track GM token balances per pool per portfolio                   │            │
│  │  • Handle GMX execution fees                                        │            │
│  └──────────────────────────────────────────────────────────────────────┘            │
│                                    │                                               │
│          ┌─────────────────────────┴─────────────────────────┐                     │
│          ▼                         ▼                         ▼                     │
│  ┌──────────────┐        ┌──────────────┐          ┌──────────────┐               │
│  │ GM-ETH/USDC  │        │ GM-BTC/USDC  │          │ GM-ARB/USDC  │               │
│  │    Pool      │        │    Pool      │    ...   │    Pool      │               │
│  └──────────────┘        └──────────────┘          └──────────────┘               │
│                                                                                    │
├──────────────────────────────────────────────────────────────────────────────────┤
│                               FEE LAYER                                            │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                    │
│  ┌────────────────────────────────────────────────────────────────────────────┐   │
│  │                     PortfolioFeeDistributor.sol                             │   │
│  │                                                                              │   │
│  │  Extends existing FeeDistributor with Portfolio-specific logic:             │   │
│  │  • Creator: 20% of copier yield (configurable per portfolio)               │   │
│  │  • Platform: 10% of all yield                                              │   │
│  │  • User: 70% net yield                                                     │   │
│  │                                                                              │   │
│  │  • Track copier → creator relationships                                    │   │
│  │  • Accumulate creator earnings across all copiers                          │   │
│  └────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                    │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Contract Specifications

### 2.1 PortfolioFactory.sol

**Purpose:** Deploy and manage Portfolio instances using minimal proxy pattern (EIP-1167).

**State Variables:**
```solidity
// Core references
address public implementation;                    // Portfolio template
address public portfolioRouter;                   // Router address
address public feeDistributor;                    // Fee handler
address public gmxAdapter;                        // GMX integration

// Creator management
mapping(address => bool) public verifiedCreators; // Verified badge
mapping(address => address[]) public creatorPortfolios; // Creator → portfolios

// Portfolio registry
mapping(address => PortfolioInfo) public portfolioInfo;
address[] public allPortfolios;

// Config limits
uint256 public maxPoolsPerPortfolio;             // Default: 10
uint256 public minCreatorStake;                  // Min stake to create
```

**Key Functions:**

| Function | Description | Access |
|----------|-------------|--------|
| `createPortfolio(CreateParams)` | Deploy new portfolio via minimal proxy | Verified creators |
| `setImplementation(address)` | Update template for new portfolios | Owner |
| `verifyCreator(address)` | Grant verified status | Owner |
| `revokeCreator(address)` | Remove verified status | Owner |
| `getPortfoliosByCreator(address)` | List creator's portfolios | View |
| `getAllPortfolios()` | List all portfolios | View |

**CreateParams Struct:**
```solidity
struct CreateParams {
    string name;                        // "ETH Bull Strategy"
    string symbol;                      // "ETHBULL"
    address[] gmxPools;                 // Up to 10 GM pool addresses
    uint256[] poolWeights;              // Weight per pool (bps, sum = 10000)
    uint256 creatorFeeOverride;         // 0 = default 20%, else custom (max 25%)
    uint256 rebalanceThreshold;         // Deviation % to trigger rebalance
    uint256 rebalanceTimelock;          // Hours before rebalance executes
    bool allowCopiers;                  // Enable social trading
}
```

---

### 2.2 Portfolio.sol

**Purpose:** Individual portfolio contract implementing the strategy. ERC4626-like share accounting for user positions.

**State Variables:**
```solidity
// ========== Identity ==========
string public name;
string public symbol;
address public creator;
address public factory;

// ========== Pool Configuration ==========
struct PoolAllocation {
    address gmPool;          // GM token address
    uint256 targetWeight;    // Target weight in bps (basis points)
    uint256 actualWeight;    // Current actual weight
    uint256 gmBalance;       // GM tokens held for this pool
}
mapping(uint256 => PoolAllocation) public pools;  // index → allocation
uint256 public poolCount;
uint256 public constant MAX_POOLS = 10;

// ========== Share Accounting ==========
uint256 public totalShares;
mapping(address => uint256) public userShares;
mapping(address => uint256) public userDepositTime;  // For time-weighted avg

// ========== Copier Tracking ==========
mapping(address => bool) public isCopier;
mapping(address => CopierPreference) public copierPrefs;
address[] public copiers;
uint256 public copierCount;

struct CopierPreference {
    bool autoFollow;         // Auto-apply rebalances
    uint256 maxSlippage;     // Max slippage tolerance (bps)
    bool notifyOnRebalance;  // Push notification preference
}

// ========== Rebalance State ==========
struct PendingRebalance {
    uint256 queuedAt;
    uint256 executeAfter;
    uint256[] newWeights;
    address[] affectedPools;
    bool executed;
    bool cancelled;
}
PendingRebalance public pendingRebalance;
uint256 public rebalanceTimelock;          // e.g., 24 hours
uint256 public rebalanceThreshold;         // e.g., 500 = 5%

// ========== Circuit Breakers ==========
uint256 public highWaterMark;
uint256 public maxDrawdown;                // e.g., 2000 = 20%
bool public emergencyMode;
```

**Key Functions:**

| Function | Description | Access |
|----------|-------------|--------|
| `deposit(uint256 amount, address asset)` | Deposit and mint shares | Anyone |
| `requestWithdrawal(uint256 shares, uint256 minAssets)` | Queue withdrawal (FIFO) | Share holder |
| `processWithdrawals(uint256 max)` | Process withdrawal queue | Keeper |
| `cancelWithdrawal(uint256 index)` | Cancel pending withdrawal | Request owner |
| `copyPortfolio()` | Register as copier | Anyone |
| `stopCopying()` | Unregister as copier | Copier |
| `setCopierPreference(CopierPreference)` | Update copier settings | Copier |
| `commitRebalance(bytes32 hash)` | Commit to rebalance (weights hidden) | Creator |
| `revealAndExecute(uint256[], bytes32, uint256)` | Reveal weights and execute | Anyone (after timelock) |
| `cancelRebalance()` | Cancel pending commit | Creator |
| `emergencyWithdraw()` | Withdraw with penalty | Anyone (emergency mode) |
| `harvestYield()` | Collect and distribute yield | Keeper/anyone |

**Share Calculation (SECURITY FIX C-1: Virtual Shares):**
```solidity
// ⚠️ CRITICAL: Use virtual offset to prevent first-depositor inflation attack
uint256 public constant SHARE_DECIMALS_OFFSET = 3; // Virtual shares = 10^3

function previewDeposit(uint256 assets) public view returns (uint256 shares) {
    return _convertToShares(assets, Math.Rounding.Down);
}

function previewWithdraw(uint256 shares) public view returns (uint256 assets) {
    return _convertToAssets(shares, Math.Rounding.Down);
}

function _convertToShares(uint256 assets, Math.Rounding rounding) internal view returns (uint256) {
    // Virtual offset prevents inflation attack
    uint256 virtualShares = 10 ** SHARE_DECIMALS_OFFSET;
    uint256 virtualAssets = 1;
    
    return assets.mulDiv(
        totalShares + virtualShares,
        _totalAssets() + virtualAssets,
        rounding
    );
}

function _convertToAssets(uint256 shares, Math.Rounding rounding) internal view returns (uint256) {
    uint256 virtualShares = 10 ** SHARE_DECIMALS_OFFSET;
    uint256 virtualAssets = 1;
    
    return shares.mulDiv(
        _totalAssets() + virtualAssets,
        totalShares + virtualShares,
        rounding
    );
}

// SECURITY FIX C-2: Include pending GMX operations in total value
function _totalAssets() internal view returns (uint256) {
    uint256 confirmedValue = _getConfirmedGMValue();
    uint256 pendingValue = totalPendingDepositValue; // Track async operations
    return confirmedValue + pendingValue;
}
```

---

### 2.3 GMXMultiPoolAdapter.sol

**Purpose:** Batch operations for depositing/withdrawing across multiple GMX v2 GM pools.

**State Variables:**
```solidity
// GMX contract references
address public exchangeRouter;
address public depositVault;
address public withdrawalVault;
address public router;

// Execution fee buffer
uint256 public executionFeeBuffer;  // e.g., 110% of estimated

// Pool whitelist
mapping(address => bool) public approvedPools;
address[] public allPools;

// Pending operations (GMX is async)
mapping(bytes32 => PendingDeposit) public pendingDeposits;
mapping(bytes32 => PendingWithdrawal) public pendingWithdrawals;
```

**Key Functions:**

| Function | Description | Access |
|----------|-------------|--------|
| `batchDeposit(BatchDepositParams)` | Deposit to multiple pools | Portfolio contracts |
| `batchWithdraw(BatchWithdrawParams)` | Withdraw from multiple pools | Portfolio contracts |
| `getPoolValue(address pool, uint256 gmAmount)` | Value of GM tokens | View |
| `getTotalValue(PoolBalance[])` | Sum value across pools | View |
| `estimateExecutionFee(uint256 numPools)` | Total execution fee | View |
| `handleCallback(...)` | GMX callback handler | GMX Router |

**BatchDepositParams:**
```solidity
struct BatchDepositParams {
    address portfolio;            // Calling portfolio
    address[] pools;              // GM pool addresses
    uint256[] amounts;            // Amount per pool (in USDC)
    uint256[] minGmAmounts;       // Min GM tokens expected
    address receiver;             // Where GM tokens go (portfolio)
}
```

**GMX v2 Async Flow:**
```
1. Portfolio calls batchDeposit()
2. Adapter sends multicall to GMX ExchangeRouter
3. GMX creates deposit orders (1 per pool)
4. Keepers execute orders (async, ~1-5 blocks)
5. GMX calls back with GM tokens minted
6. Adapter updates pending → confirmed
7. Portfolio's GM balance updated
```

---

### 2.4 PortfolioRegistry.sol

**Purpose:** Track all portfolios, copiers, and provide discovery/search functionality.

**State Variables:**
```solidity
// Portfolio tracking
mapping(address => PortfolioMeta) public portfolioMeta;
address[] public portfolioList;

struct PortfolioMeta {
    address creator;
    uint256 createdAt;
    uint256 tvl;                  // Cached, updated periodically
    uint256 copierCount;
    uint256 blendedApy;           // Cached, updated periodically
    bool isActive;
    string[] tags;                // "BTC", "Conservative", etc.
}

// Copier tracking
mapping(address => address[]) public userCopying;   // user → portfolios
mapping(address => address[]) public portfolioCopiers; // portfolio → copiers

// Leaderboard caches (updated by keeper)
address[] public topByTVL;
address[] public topByAPY;
address[] public topByCopiers;
```

**Key Functions:**

| Function | Description | Access |
|----------|-------------|--------|
| `registerPortfolio(address, PortfolioMeta)` | Add new portfolio | Factory only |
| `updatePortfolioStats(address)` | Refresh TVL, APY, etc. | Keeper |
| `registerCopier(address portfolio, address user)` | Track copier | Portfolio only |
| `removeCopier(address portfolio, address user)` | Remove copier | Portfolio only |
| `getTopPortfolios(SortBy, uint256 limit)` | Leaderboard query | View |
| `getPortfoliosByTag(string)` | Filter by tag | View |
| `getUserCopying(address)` | User's copied portfolios | View |

---

### 2.5 PortfolioAPYCalculator.sol

**Purpose:** Calculate blended APY across multiple pools, accounting for fees.

**Key Functions:**

| Function | Description |
|----------|-------------|
| `calculateBlendedAPY(PoolAllocation[])` | Weighted average APY |
| `calculateNetAPY(PoolAllocation[], uint256 creatorFee)` | After fees |
| `getPoolAPY(address gmPool)` | Single pool APY (calls GMX) |
| `estimateEarnings(uint256 principal, uint256 apy, uint256 duration)` | Project earnings |

**Blended APY Formula:**
```
BlendedAPY = Σ (PoolAPY[i] × Weight[i]) for i = 1 to n

Where:
- PoolAPY[i] = GMX GM pool APY (from GMX stats)
- Weight[i] = Pool weight (e.g., 0.30 for 30%)

NetAPY = BlendedAPY × (1 - CreatorFee - PlatformFee)
       = BlendedAPY × 0.70 (for 20% creator + 10% platform)
```

---

### 2.6 RebalanceGuardian.sol

**Purpose:** Enforce rebalance guardrails, manage timelock queue, handle user preferences.

**State Variables:**
```solidity
// Timelock configuration
uint256 public minTimelock;       // 1 hour minimum
uint256 public maxTimelock;       // 72 hours maximum
uint256 public defaultTimelock;   // 24 hours default

// Anti-frontrunning
uint256 public minRebalanceInterval;  // e.g., 6 hours between rebalances
mapping(address => uint256) public lastRebalanceTime;

// Notification tracking
mapping(address => mapping(address => bool)) public userNotified;  // portfolio → user → notified
```

**Key Functions:**

| Function | Description | Access |
|----------|-------------|--------|
| `validateRebalance(RebalanceParams)` | Check guardrails | Portfolio |
| `queueRebalance(address, uint256[])` | Add to timelock queue | Portfolio |
| `canExecute(address)` | Check if timelock passed | View |
| `executeForUser(address portfolio, address user)` | Apply for specific user | Keeper |
| `notifyUsers(address portfolio)` | Send notifications | Keeper |
| `getUserRebalanceStatus(address, address)` | User's pending state | View |

**Rebalance Flow (SECURITY FIX C-4: Commit-Reveal):**
```
⚠️ CRITICAL: Original design exposed rebalance intent, enabling front-running.
   New commit-reveal scheme hides weights until execution.

1. Creator calls commitRebalance(keccak256(newWeights, salt, maxSlippage))
   - Only hash stored on-chain
   - Weights remain hidden
2. System validates:
   - No pending commit exists
   - minRebalanceInterval (6h) passed since last
3. Timelock period (24-72h):
   - Copiers notified of PENDING rebalance (weights unknown)
   - Copiers can opt-out (stopCopying) if risk-averse
   - Creator can cancel
   - NO ONE can front-run because weights are hidden
4. After timelock, ANYONE calls revealAndExecute(newWeights, salt, maxSlippage):
   - Hash verified against commit
   - Weights validated
   - Slippage checked against current portfolio value
   - Rebalance executes immediately (no time to front-run)
5. Post-execution:
   - Creator enters 7-day cooldown (cannot withdraw)
   - High water mark updated if needed
```

---

### 2.7 PortfolioFeeDistributor.sol

**Purpose:** Extend existing FeeDistributor for portfolio-specific creator earnings.

**Additional State:**
```solidity
// Copier → Creator mapping
mapping(address => mapping(address => address)) public copierCreator;
// portfolio → copier → creator who earns from this copier

// Creator earnings from copiers
mapping(address => mapping(address => uint256)) public creatorEarningsFromCopier;
// creator → copier → accumulated earnings

// Portfolio-specific fee overrides
mapping(address => uint256) public portfolioCreatorFee;  // bps
```

**Fee Flow for Copiers (Updated):**
```
Copier deposits $10,000 into Portfolio
Portfolio generates $1,000 yield (10%)

Distribution:
├── Creator (portfolio owner): $200 (20% of copier yield)
├── Platform: $100 (10% of all yield)
└── Copier: $700 (70% net)

If user is using their OWN portfolio (not copying):
├── Creator Fee: $0 (not applicable)
├── Platform: $100 (10%)
└── User: $900 (90% net)
```

---

## 3. Data Structures

### 3.1 Core Types

```solidity
// Portfolio creation parameters
struct CreateParams {
    string name;
    string symbol;
    address[] gmxPools;           // Max 10
    uint256[] poolWeights;        // Sum = 10000 bps
    uint256 creatorFeeOverride;   // 0 = default, else custom
    uint256 rebalanceThreshold;   // Deviation trigger (bps)
    uint256 rebalanceTimelock;    // Hours
    bool allowCopiers;            // Social trading enabled
}

// Pool allocation within portfolio
struct PoolAllocation {
    address gmPool;
    uint256 targetWeight;         // Target in bps
    uint256 actualWeight;         // Current in bps
    uint256 gmBalance;            // GM tokens held
    uint256 valueUSD;             // Cached USD value
}

// Copier preferences
struct CopierPreference {
    bool autoFollow;              // Auto-apply rebalances
    uint256 maxSlippage;          // Max slippage (bps)
    bool notifyOnRebalance;       // Push notifications
    uint256 maxSinglePoolExposure; // Risk limit per pool
}

// Pending rebalance
struct PendingRebalance {
    uint256 queuedAt;
    uint256 executeAfter;
    uint256[] newWeights;
    address[] affectedPools;
    string reason;                // "Market rotation", etc.
    bool executed;
    bool cancelled;
}

// User position in portfolio
struct UserPosition {
    uint256 shares;
    uint256 depositedValue;       // Original deposit USD
    uint256 currentValue;         // Current USD value
    uint256 earnedYield;          // Accumulated yield
    uint256 paidCreatorFees;      // Fees paid to creator
    uint256 depositTime;          // First deposit timestamp
}
```

---

## 4. Security Considerations

### 4.1 Access Control Matrix

| Function | Creator | Copier | Anyone | Owner | Keeper |
|----------|---------|--------|--------|-------|--------|
| createPortfolio | ✅ | ❌ | ❌ | ✅ | ❌ |
| deposit | ✅ | ✅ | ✅ | ✅ | ❌ |
| withdraw | ✅ | ✅ | ✅ | ✅ | ❌ |
| queueRebalance | ✅ | ❌ | ❌ | ❌ | ❌ |
| executeRebalance | ✅ | ✅ | ✅ | ✅ | ✅ |
| cancelRebalance | ✅ | ❌ | ❌ | ✅ | ❌ |
| copyPortfolio | ❌ | ✅ | ✅ | ✅ | ❌ |
| emergencyPause | ❌ | ❌ | ❌ | ✅ | ❌ |
| harvestYield | ❌ | ❌ | ✅ | ✅ | ✅ |

### 4.2 Risk Mitigations (Updated with Security Fixes)

| Risk | Mitigation | Fix ID |
|------|------------|--------|
| **First depositor attack** | Virtual shares offset (10^3) prevents inflation | C-1 ✅ |
| **GMX async race condition** | Track pending ops in totalAssets | C-2 ✅ |
| **Reentrancy** | ReentrancyGuard on ALL state-changing functions | C-3 ✅ |
| **Front-running rebalances** | **Commit-reveal scheme** - weights hidden until execution | C-4 ✅ |
| **Bank run / withdrawal panic** | FIFO withdrawal queue with 1h min delay | C-5 ✅ |
| **Creator self-dealing** | 10% min stake, 7-day cooldown after rebalance | C-6 ✅ |
| **Over-concentration** | Max 50% per single pool, creator can't exceed 10 pools | - |
| **Creator fee manipulation** | Fee locked at creation, can only decrease | - |
| **GMX execution failures** | Retry logic, partial fills tracked, timeout refunds | M-5 |
| **Price manipulation** | GMX oracle + Chainlink cross-check + 5% bounds | M-2 |
| **Smart contract bugs** | External audit required before mainnet | - |

### 4.3 Circuit Breakers

```solidity
// Drawdown circuit breaker
if (currentValue < highWaterMark * (10000 - maxDrawdown) / 10000) {
    emergencyMode = true;
    emit EmergencyModeActivated(portfolioAddress, currentValue, highWaterMark);
}

// Max single-day rebalance size
require(
    rebalanceValueUSD <= totalPortfolioValue * MAX_DAILY_REBALANCE_BPS / 10000,
    "Rebalance too large"
);

// Pause on anomalous APY
if (calculatedAPY > MAX_REASONABLE_APY) {
    emit AnomalousAPYDetected(portfolioAddress, calculatedAPY);
    // Flag for manual review, don't auto-compound
}
```

---

## 5. Integration with Next.js Frontend

### 5.1 New Hooks Required

```typescript
// src/hooks/portfolio/
├── usePortfolioList.ts        // List all portfolios with filters
├── usePortfolio.ts            // Single portfolio details
├── usePortfolioDeposit.ts     // Deposit into portfolio
├── usePortfolioWithdraw.ts    // Withdraw from portfolio
├── useCopyPortfolio.ts        // Register as copier
├── useStopCopying.ts          // Unregister as copier
├── usePendingRebalance.ts     // Track pending rebalances
├── useBlendedAPY.ts           // Calculate portfolio APY
├── useCopierPreferences.ts    // Get/set copier preferences
├── useCreatorEarnings.ts      // Creator's accumulated fees
└── usePortfolioPerformance.ts // Historical performance data
```

### 5.2 Affected Components

```typescript
// New components needed
src/components/portfolio/
├── PortfolioCard.tsx              // Discovery card
├── PortfolioDetail.tsx            // Full portfolio view
├── PoolAllocationChart.tsx        // Pie/bar of allocations
├── BlendedAPYDisplay.tsx          // Show unified APY
├── CopyButton.tsx                 // Copy/stop copying
├── CopierPreferencesModal.tsx     // Auto-follow settings
├── RebalanceNotification.tsx      // Pending rebalance alert
├── RebalanceApprovalModal.tsx     // Manual approval UI
├── CreatorDashboard.tsx           // Creator's earnings view
└── PortfolioCreateWizard.tsx      // Multi-step creation flow

// Existing components to modify
src/components/dashboard/
├── PositionSummary.tsx           // Show portfolio positions
└── AllocationBreakdown.tsx       // Show multi-pool allocations

src/components/vaults/
├── VaultCard.tsx                 // Rename/extend for portfolios
└── VaultLeaderboard.tsx          // Add portfolio tab
```

### 5.3 API Integration Points

```typescript
// Contract read calls
const { data: portfolios } = useContractRead({
  address: PORTFOLIO_REGISTRY,
  abi: PortfolioRegistryABI,
  functionName: 'getTopPortfolios',
  args: ['TVL', 10],
});

// Contract write calls
const { write: deposit } = useContractWrite({
  address: portfolioAddress,
  abi: PortfolioABI,
  functionName: 'deposit',
});

// Event subscriptions
useContractEvent({
  address: portfolioAddress,
  abi: PortfolioABI,
  eventName: 'RebalanceQueued',
  listener: (creator, newWeights, executeAfter) => {
    // Show notification to copiers
  },
});
```

---

## 6. Gas Optimization Strategies

### 6.1 Batch Operations

| Operation | Without Batching | With Batching | Savings |
|-----------|------------------|---------------|---------|
| Deposit to 5 pools | 5 × 150k = 750k gas | 1 × 350k gas | ~53% |
| Withdraw from 5 pools | 5 × 180k = 900k gas | 1 × 400k gas | ~56% |
| Harvest from 10 pools | 10 × 80k = 800k gas | 1 × 250k gas | ~69% |

### 6.2 Storage Optimization

```solidity
// Pack related variables into single slots
struct PoolAllocation {
    address gmPool;           // 20 bytes
    uint96 targetWeight;      // 12 bytes (fits in same slot)
    uint128 gmBalance;        // 16 bytes
    uint128 valueUSD;         // 16 bytes (fits in same slot)
}

// Use mappings with index instead of arrays where possible
mapping(uint256 => PoolAllocation) pools;
uint256 poolCount;
// vs
PoolAllocation[] pools;  // Avoid - expensive enumeration
```

### 6.3 Minimal Proxy Pattern

```solidity
// Deploy portfolio using EIP-1167 clone
function createPortfolio(CreateParams memory params) external returns (address) {
    address clone = Clones.clone(implementation);
    Portfolio(clone).initialize(params);
    return clone;
}

// Gas cost: ~$2-5 vs ~$50+ for full deployment
```

### 6.4 Lazy Evaluation

```solidity
// Don't calculate values on every read
mapping(address => CachedValue) public cachedValues;

struct CachedValue {
    uint256 value;
    uint256 timestamp;
}

function getPortfolioValue(address portfolio) public view returns (uint256) {
    CachedValue memory cached = cachedValues[portfolio];
    if (block.timestamp - cached.timestamp < CACHE_DURATION) {
        return cached.value;
    }
    // Recalculate only if stale
    return _calculatePortfolioValue(portfolio);
}
```

---

## 7. Upgrade Path

### 7.1 Proxy Strategy

**Chosen Approach:** Minimal Proxy (EIP-1167) for portfolios + UUPS for core contracts.

| Contract | Upgrade Strategy | Rationale |
|----------|------------------|-----------|
| PortfolioFactory | UUPS Proxy | Needs upgrades for new features |
| Portfolio (template) | Minimal Proxy | Cheap deployment, new template for new portfolios |
| GMXMultiPoolAdapter | UUPS Proxy | May need GMX version updates |
| PortfolioRegistry | UUPS Proxy | Add new query functions |
| RebalanceGuardian | UUPS Proxy | Tune guardrail parameters |
| PortfolioFeeDistributor | UUPS Proxy | Fee structure changes |

### 7.2 Migration Path

```
Phase 1: Deploy new template
├── Deploy Portfolio v2 implementation
├── Set as new template in Factory
├── Existing portfolios unchanged

Phase 2: Optional migration
├── Users can migrate to v2 portfolio
├── Old portfolios continue working
├── No forced migration

Phase 3: Deprecation (if needed)
├── Disable new deposits to v1
├── v1 withdrawals always allowed
├── Gradual sunset
```

---

## 8. Implementation Checklist

### Phase 1: Core Contracts (Week 1-2)
- [ ] 1.1 Implement `PoolAllocation` struct and storage
- [ ] 1.2 Implement `Portfolio.sol` base with ERC4626-like shares
- [ ] 1.3 Implement `PortfolioFactory.sol` with minimal proxy
- [ ] 1.4 Implement `GMXMultiPoolAdapter.sol` batch deposits
- [ ] 1.5 Unit tests for core deposit/withdraw flows
- [ ] 1.6 Gas benchmarking for batch operations

### Phase 2: Social Trading (Week 2-3)
- [ ] 2.1 Implement copier registration/tracking
- [ ] 2.2 Implement `CopierPreference` storage and logic
- [ ] 2.3 Implement `PortfolioRegistry.sol` discovery
- [ ] 2.4 Implement creator fee distribution
- [ ] 2.5 Unit tests for copier flows
- [ ] 2.6 Integration tests for fee distribution

### Phase 3: Rebalance Guardrails (Week 3-4)
- [ ] 3.1 Implement `RebalanceGuardian.sol` timelock
- [ ] 3.2 Implement anti-frontrunning delays
- [ ] 3.3 Implement user notification system (events)
- [ ] 3.4 Implement manual approval flow
- [ ] 3.5 Implement auto-follow execution
- [ ] 3.6 Unit tests for all rebalance scenarios

### Phase 4: APY & Analytics (Week 4)
- [ ] 4.1 Implement `PortfolioAPYCalculator.sol`
- [ ] 4.2 Integrate GMX pool APY fetching
- [ ] 4.3 Implement blended APY calculation
- [ ] 4.4 Implement fee-adjusted net APY
- [ ] 4.5 Add performance tracking storage
- [ ] 4.6 Unit tests for APY calculations

### Phase 5: Frontend Integration (Week 5-6)
- [ ] 5.1 Create portfolio hooks (`usePortfolioList`, etc.)
- [ ] 5.2 Build `PortfolioCard` and `PortfolioDetail` components
- [ ] 5.3 Build `PortfolioCreateWizard`
- [ ] 5.4 Build `CopierPreferencesModal`
- [ ] 5.5 Build `RebalanceNotification` system
- [ ] 5.6 Add portfolio tab to vault discovery page
- [ ] 5.7 Integration tests for full user flows

### Phase 6: Security & Launch (Week 6-7)
- [ ] 6.1 Internal security review
- [ ] 6.2 External audit (recommended)
- [ ] 6.3 Testnet deployment (Arbitrum Sepolia)
- [ ] 6.4 Bug bounty program setup
- [ ] 6.5 Mainnet deployment
- [ ] 6.6 Monitoring and alerting setup

---

## 9. Appendix: Contract Addresses (Arbitrum)

### Existing NeverSell Contracts
| Contract | Address | Notes |
|----------|---------|-------|
| FeeDistributor | TBD | From existing deployment |
| VaultFactory | TBD | From existing deployment |

### GMX v2 Contracts (Reference)
| Contract | Address |
|----------|---------|
| ExchangeRouter | `0x7C68C7866A64FA2160F78EEaE12217FFbf871fa8` |
| DepositVault | `0xF89e77e8Dc11691C9e8757e84aaFbCD8A67d7A55` |
| WithdrawalVault | `0x0628D46b5D145f183AdB6Ef1f2c97eD1C4701C55` |
| Router | `0x7452c558d45f8afC8c83dAe62C3f8A5BE19c71f6` |
| Reader | `0x38d91ED96283d62182Fc6d990C24097A918a4d9b` |

### GM Pool Addresses
| Pool | Address |
|------|---------|
| GM-ETH/USDC | `0x70d95587d40A2caf56bd97485aB3Eec10Bee6336` |
| GM-BTC/USDC | `0x47c031236e19d024b42f8AE6780E44A573170703` |
| GM-ARB/USDC | `0xC25cEf6061Cf5dE5eb761b50E4743c1F5D7E5407` |
| GM-LINK/USDC | `0x7f1fa204bb700853D36994DA19F830b6Ad18455C` |
| GM-SOL/USDC | `0x09400D9DB990D5ed3f35D7be61DfAEB900Af03C9` |

---

## 10. Outstanding TODOs (Medium/Low Priority)

> These issues should be addressed before mainnet but are not blocking implementation.

### Medium Priority (Before Mainnet)

- [ ] **M-1: Dust Accumulation** - Aggregate sub-minimum amounts to largest pool allocation
- [ ] **M-2: GM Token Oracle Risk** - Add 5% sanity bounds when cross-checking GMX vs Chainlink
- [ ] **M-3: Copier Preference DoS** - Wrap per-user rebalance in try-catch, skip failures
- [ ] **M-4: Emergency Mode Attack** - Use 1-hour TWAP + require 3 confirmations before triggering
- [ ] **M-5: Partial GMX Execution** - Track per-pool status, allow manual resolution after 3 retries
- [ ] **M-6: Creator Abandonment** - After 90 days inactivity, zero creator fee, allow governance takeover
- [ ] **M-8: Fee Stacking Warning** - Frontend should warn users copying overlapping portfolios
- [ ] **M-9: Leaderboard Gaming** - Use time-weighted metrics, require 30-day minimum track record

### Low Priority (Can Ship Later)

- [ ] **L-3: Zero Amount Validation** - Add `require(amount > 0)` to all entry points
- [ ] **L-4: Cache Staleness** - Reduce cache duration during high volatility periods
- [ ] **L-6: Copier Count Gas** - Off-chain event indexing for large copier lists
- [ ] **L-7: Pool Deprecation** - Add health check, force rebalance away from paused pools
- [ ] **L-8: Execution Fee Drift** - Dynamic fee estimation with refund mechanism

---

## 11. Open Questions - RESOLVED

| Question | Resolution | Status |
|----------|------------|--------|
| Copier exit during rebalance | Current allocation (don't force wait) | ✅ Decided |
| Partial GMX execution | Retry failed, don't rollback successful | ✅ Decided |
| Creator stake requirement | Yes, 10% minimum enforced in contract | ✅ Implemented |
| Max copiers per portfolio | No hard limit, gas warning at 1000+ | ✅ Decided |
| Cross-portfolio copying | Yes, tracked separately | ✅ Decided |
| Who pays keepers? | Protocol treasury initially | ✅ Decided |
| Upgrade authority | 3/5 multisig with 48h timelock | ✅ Decided |

---

## 12. Related Documents

- **PORTFOLIO_DEBUG_REPORT.md** - Full security analysis with 6 critical, 9 medium, 8 low issues
- **PORTFOLIO_FINAL_SPEC.md** - Implementation-ready specification with all fixes incorporated

---

*This spec has been security reviewed. See PORTFOLIO_FINAL_SPEC.md for the complete implementation guide.*

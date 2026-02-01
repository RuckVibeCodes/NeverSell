# NeverSell Implementation Plan

**Version:** 1.0  
**Date:** February 1, 2026  
**Status:** Ready for Implementation  

---

## Core Philosophy

> "The user should never see or think about the complexity."

Every design decision must pass this test:
- Does the user need to know this? → If no, hide it.
- Does this mention Aave/GMX/protocols? → Remove those words.
- Is this adding friction? → Simplify or remove.

---

## 1. App Navigation Structure

### Primary Navigation (Bottom Tab Bar on Mobile, Side/Top on Desktop)

| Tab | User-Facing Label | What User Sees | What Backend Does |
|-----|-------------------|----------------|-------------------|
| **Dashboard** | Dashboard | Total Value, Earnings, APY, Borrow capacity | Aggregates Aave + GMX positions |
| **Deposit** | Deposit | Amount input, allocation sliders, estimated earnings | Routes to Aave (60%) + GMX (40%) |
| **Borrow** | Borrow | Capacity, amount input, repay | Interfaces with Aave lending |
| **Vaults** | Vaults | Creator leaderboard, vault cards | Fetches vault strategies + performance |
| **Settings** | Settings | Notifications, connected wallet | User preferences |

### URL Structure

```
/                       → Landing page (marketing)
/app                    → Dashboard (authenticated)
/app/deposit            → Deposit flow
/app/borrow             → Borrow flow
/app/vaults             → Vault discovery
/app/vaults/[id]        → Individual vault detail
/app/vaults/create      → Create vault (for creators)
/app/settings           → User settings
```

### Navigation Component Requirements

```
<AppShell>
  ├── <Navbar>              // Top bar with logo + wallet connection
  ├── <Sidebar>             // Desktop: left nav. Mobile: bottom tabs
  └── <main>                // Page content
</AppShell>
```

---

## 2. Dashboard Page Spec

### State: Empty (No Deposits)

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│            [Illustration: Growing plant/investment]             │
│                                                                 │
│              Start earning on your crypto                       │
│       Deposit USDC and watch your wealth grow without selling   │
│                                                                 │
│                    [ Deposit Now ]                              │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│   🔥 Popular Vaults                                             │
│   [Vault Card 1]  [Vault Card 2]  [Vault Card 3]               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Components:**
- `<EmptyState />` - Illustration + CTA
- `<FeaturedVaults />` - Horizontal scroll of top vaults

---

### State: Has Position

```
┌─────────────────────────────────────────────────────────────────┐
│                      YOUR POSITION                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │                                                         │  │
│   │   Total Value         $10,450            ↑ 4.5%        │  │
│   │   ───────────────────────────────────────────────────  │  │
│   │   Deposited           $10,000                          │  │
│   │   Earnings            $450               +$3.90/day    │  │
│   │                                                         │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │                                                         │  │
│   │   Current APY                                          │  │
│   │   ████████████████████░░░░░░░░░░  14.2%               │  │
│   │                                                         │  │
│   │   Earning $3.90/day • $118/month • $1,420/year        │  │
│   │                                                         │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │                                                         │  │
│   │   Borrow Capacity     $6,000                           │  │
│   │   Currently Borrowed  $2,000                           │  │
│   │   Available           $4,000                           │  │
│   │                                                         │  │
│   │   [ Borrow ]    [ Repay ]                              │  │
│   │                                                         │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │   Your Allocation                                       │  │
│   │   BTC ████████████░░░░░░  60%   $6,270                 │  │
│   │   ETH ████████░░░░░░░░░░  30%   $3,135                 │  │
│   │   SOL ████░░░░░░░░░░░░░░  10%   $1,045                 │  │
│   │                                                         │  │
│   │   [ Rebalance ]  [ Withdraw ]  [ + Deposit More ]      │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**CRITICAL: What NOT to show:**
- ❌ Health Factor (Aave concept)
- ❌ Liquidation threshold
- ❌ "Aave collateral" / "GMX position"
- ❌ aToken balances
- ❌ GM token balances  
- ❌ 60/40 split details
- ❌ Protocol names anywhere

**Components Required:**

```tsx
// Dashboard-specific components
<PositionSummaryCard>      // Total value, deposited, earnings
<UnifiedAPYDisplay>        // Single APY number with earnings projections
<BorrowCapacityCard>       // Available credit, borrowed amount
<AllocationBreakdown>      // Asset allocation visualization
<ActionButtons>            // Deposit/Withdraw/Borrow/Repay
```

### Data Requirements

```typescript
interface DashboardData {
  // Position summary
  totalValueUSD: number;
  depositedUSD: number;
  earningsUSD: number;
  earningsPercent: number;
  
  // Unified APY (calculated, not shown as components)
  currentAPY: number;           // Single blended number
  dailyEarnings: number;
  monthlyEarnings: number;
  yearlyEarnings: number;
  
  // Borrow info
  borrowCapacityUSD: number;    // Derived from Aave collateral
  currentBorrowedUSD: number;
  availableToBorrowUSD: number;
  borrowAPR: number;            // Cost to borrow (shown when borrowed > 0)
  
  // Allocation
  allocations: Array<{
    asset: 'BTC' | 'ETH' | 'SOL' | 'ARB';
    percent: number;
    valueUSD: number;
    earnings24h: number;
  }>;
}
```

---

## 3. Deposit Flow Spec

### Step 1: Amount Entry

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   How much would you like to deposit?                          │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  $  [ 10,000                                    ] USDC  │  │
│   │      Balance: $25,430.00 USDC                   [MAX]   │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│   Quick amounts:                                                │
│   [ $100 ]  [ $500 ]  [ $1,000 ]  [ $5,000 ]  [ $10,000 ]     │
│                                                                 │
│                        [ Continue ]                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Cross-chain Detection:**
- If user is on Ethereum/Base/Optimism → Show: "We'll bridge to Arbitrum automatically"
- If user is on Arbitrum → No notice needed

### Step 2: Strategy Selection

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   Choose Your Strategy                                          │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  🛡️ CONSERVATIVE                              SELECTED   │  │
│   │  100% BTC                                                │  │
│   │  Lower volatility, steady growth                         │  │
│   │  ~12% APY                                                │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  ⚖️ BALANCED                                             │  │
│   │  50% BTC / 30% ETH / 20% SOL                            │  │
│   │  Diversified exposure                                    │  │
│   │  ~14% APY                                                │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  🔥 GROWTH                                               │  │
│   │  30% ETH / 40% SOL / 30% ARB                            │  │
│   │  Higher upside potential                                 │  │
│   │  ~18% APY                                                │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│   ─────────── or ───────────                                   │
│                                                                 │
│   [ Custom Allocation → ]                                      │
│                                                                 │
│                      [ Continue ]                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Step 2b: Custom Allocation (if selected)

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   Build Your Allocation                                         │
│                                                                 │
│   BTC  [████████████░░░░░░░░]  60%       $6,000               │
│   ETH  [████████░░░░░░░░░░░░]  30%       $3,000               │
│   SOL  [████░░░░░░░░░░░░░░░░]  10%       $1,000               │
│   ARB  [░░░░░░░░░░░░░░░░░░░░]  0%        $0                   │
│                                                                 │
│   ────────────────────────────────────────                     │
│   Total: 100%     $10,000 USDC                                 │
│                                                                 │
│   Estimated APY: 14.2%                                         │
│   Borrow Capacity: $6,000                                      │
│                                                                 │
│                      [ Continue ]                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Step 3: Review & Confirm

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   Review Your Deposit                                          │
│                                                                 │
│   Depositing:           $10,000 USDC                           │
│                                                                 │
│   Allocation:                                                   │
│   • 60% BTC ($6,000)                                           │
│   • 30% ETH ($3,000)                                           │
│   • 10% SOL ($1,000)                                           │
│                                                                 │
│   ─────────────────────────────────────────────                │
│                                                                 │
│   Estimated APY:        14.2%                                   │
│   Monthly Earnings:     ~$118                                   │
│   Borrow Capacity:      $6,000                                  │
│                                                                 │
│   Network Fee:          ~$2.50                                  │
│   [i] One transaction, no further approvals needed             │
│                                                                 │
│           [ Confirm Deposit ]                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### What Backend Does (Hidden From User)

```
User clicks "Confirm Deposit"
            ↓
┌─────────────────────────────────────────────────────────────────┐
│  Backend Orchestration (all batched/hidden)                     │
├─────────────────────────────────────────────────────────────────┤
│  1. Detect source chain                                         │
│  2. If not Arbitrum → Bridge via Li.Fi                         │
│  3. Swap USDC to target assets (DEX aggregator)                │
│     - $6,000 USDC → WBTC                                       │
│     - $3,000 USDC → WETH                                       │
│     - $1,000 USDC → SOL                                        │
│  4. For each asset, split 60/40:                               │
│     - 60% → Deposit to Aave as collateral                      │
│     - 40% → Deposit to GMX GM pool                             │
│  5. Update accounting contract with position data              │
│  6. Return success to frontend                                  │
└─────────────────────────────────────────────────────────────────┘
            ↓
User sees: "Success! Your position is earning 14.2% APY"
```

### Components Required for Deposit Flow

```tsx
// Step components
<DepositAmountStep>
<StrategySelectionStep>
<CustomAllocationStep>
<DepositReviewStep>
<DepositSuccessStep>

// Shared components
<AllocationSlider asset="BTC" value={60} onChange={...} />
<StrategyCard preset="conservative" selected={true} />
<APYEstimate amount={10000} allocation={...} />
<BorrowCapacityPreview amount={10000} />
<CrossChainNotice sourceChain="ethereum" />
```

---

## 4. Borrow Flow Spec

### User Experience

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   Borrow                                                        │
│                                                                 │
│   Access liquidity without selling your assets                 │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │                                                         │  │
│   │   Available to Borrow                                   │  │
│   │   $4,000 USDC                                          │  │
│   │                                                         │  │
│   │   [████████████████░░░░░░░░]  67% used                 │  │
│   │   $2,000 borrowed of $6,000 capacity                   │  │
│   │                                                         │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│   How much would you like to borrow?                           │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  $  [ 1,000                                      ] USDC │  │
│   │      [ 25% ]  [ 50% ]  [ 75% ]  [ MAX ]                │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│   ─────────────────────────────────────────────                │
│                                                                 │
│   Borrow APR:           5.2%                                    │
│   Daily interest:       ~$0.14                                  │
│   Net APY after borrow: 9.0%                                   │
│                                                                 │
│   [i] Interest accrues continuously. Repay anytime.            │
│                                                                 │
│                    [ Borrow $1,000 ]                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Repay View (Tab or Toggle)

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   [ Borrow ]     [ Repay ]                                      │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │                                                         │  │
│   │   Current Debt                                          │  │
│   │   $2,014.32 USDC                                       │  │
│   │   (includes $14.32 accrued interest)                   │  │
│   │                                                         │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│   How much would you like to repay?                            │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  $  [ 500                                        ] USDC │  │
│   │      Balance: $1,234 USDC                      [MAX]   │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│   After repayment:                                              │
│   Remaining debt:       $1,514.32                              │
│   Available to borrow:  $4,485.68                              │
│                                                                 │
│                    [ Repay $500 ]                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### What Backend Does

**Borrow:**
```
1. Validate user has sufficient collateral (60% portion in Aave)
2. Call Aave borrow function
3. USDC sent directly to user's wallet
4. Update position tracking
```

**Repay:**
```
1. Transfer USDC from user
2. Call Aave repay function
3. Update position tracking
```

### Components Required

```tsx
<BorrowCapacityMeter>      // Visual bar showing used/available
<BorrowAmountInput>        // Amount input with quick percentages
<BorrowCostPreview>        // APR and interest projection
<RepayAmountInput>         // Amount input with balance
<DebtSummary>              // Current debt + accrued interest
```

---

## 5. Creator Vaults Spec

### Vault Discovery Page (`/app/vaults`)

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   Vaults                                                        │
│                                                                 │
│   Follow top creators and earn with their strategies           │
│                                                                 │
│   [ 🔥 Trending ]  [ 📈 Top APY ]  [ 💰 Highest TVL ]          │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  [Avatar]  CryptoMaxi                           FOLLOW   │  │
│   │            "BTC Maximalist Strategy"                     │  │
│   │                                                          │  │
│   │  APY: 16.2%    TVL: $2.4M    Depositors: 847           │  │
│   │                                                          │  │
│   │  Allocation: BTC 70% / ETH 30%                          │  │
│   │  [██████████████████████████░░░░] +12.4% (30d)         │  │
│   │                                                          │  │
│   │  [ View Vault ]                                          │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  [Avatar]  DeFiDegen                                     │  │
│   │            "Altcoin Alpha"                               │  │
│   │                                                          │  │
│   │  APY: 24.8%    TVL: $890K    Depositors: 312           │  │
│   │                                                          │  │
│   │  Allocation: ETH 40% / SOL 35% / ARB 25%               │  │
│   │  [██████████████████████████░░░░] +18.2% (30d)         │  │
│   │                                                          │  │
│   │  [ View Vault ]                                          │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Vault Detail Page (`/app/vaults/[id]`)

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   [Avatar]  CryptoMaxi                              [ FOLLOW ]  │
│   "BTC Maximalist Strategy"                                    │
│                                                                 │
│   "I believe in BTC long-term. This vault maintains heavy     │
│   BTC exposure with some ETH for diversification."             │
│                                                                 │
│   ═════════════════════════════════════════════════════════    │
│                                                                 │
│   ┌────────────────┐  ┌────────────────┐  ┌────────────────┐  │
│   │    16.2%       │  │    $2.4M       │  │     847        │  │
│   │    APY         │  │    TVL         │  │  Depositors    │  │
│   └────────────────┘  └────────────────┘  └────────────────┘  │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  Performance                                             │  │
│   │  [Chart: 30-day performance line chart]                 │  │
│   │                                                          │  │
│   │  +12.4% (30d)  |  +45.2% (90d)  |  +124% (1y)          │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  Current Allocation                                      │  │
│   │                                                          │  │
│   │  BTC [██████████████████████████████░░░░░░░░] 70%       │  │
│   │  ETH [████████████████░░░░░░░░░░░░░░░░░░░░░░] 30%       │  │
│   │                                                          │  │
│   │  Last rebalanced: 3 days ago                            │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  Deposit into this Vault                                 │  │
│   │                                                          │  │
│   │  Amount: [ $5,000 USDC                          ]       │  │
│   │                                                          │  │
│   │  Estimated APY:      16.2%                              │  │
│   │  Creator Fee:        15% of earnings                    │  │
│   │  Net APY:            ~13.8%                             │  │
│   │                                                          │  │
│   │              [ Deposit into Vault ]                      │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  ⚠️ Risk Notice                                          │  │
│   │  Past performance is not indicative of future results.  │  │
│   │  Creator can adjust allocation with 24hr timelock.      │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Components Required

```tsx
// Discovery
<VaultCard>                // Summary card for list view
<VaultLeaderboard>         // Sorted list with filters
<VaultFilter>              // Trending/APY/TVL tabs

// Detail
<CreatorHeader>            // Avatar, name, bio, follow button
<VaultStats>               // APY, TVL, depositors
<PerformanceChart>         // 30d/90d/1y line chart
<AllocationDisplay>        // Current allocation bars
<VaultDepositForm>         // Deposit into specific vault
<CreatorFeeNotice>         // Fee disclosure
<RiskDisclaimer>           // Required risk notice

// For creators
<VaultCreationForm>        // Create new vault
<VaultManagement>          // Adjust allocation (with timelock)
<VaultAnalytics>           // Creator's earnings dashboard
```

### Data Model

```typescript
interface Vault {
  id: string;
  creator: {
    address: string;
    name: string;
    avatar: string;
    bio: string;
    followerCount: number;
  };
  name: string;
  description: string;
  
  // Performance
  currentAPY: number;
  tvlUSD: number;
  depositorCount: number;
  performance30d: number;
  performance90d: number;
  performance1y: number;
  
  // Strategy
  allocation: Array<{
    asset: string;
    percent: number;
  }>;
  lastRebalanced: Date;
  
  // Fees
  creatorFeePercent: number;  // % of earnings
  
  // Settings
  timelockHours: number;      // Time before allocation changes take effect
  
  // Metadata
  createdAt: Date;
  isVerified: boolean;
}
```

---

## 6. Unified APY Calculation

### The Formula

```
Unified APY = (Aave APY × 0.6) + (GMX APY × 0.4) - Borrow Interest - Platform Fee
```

**Breakdown:**
- `Aave APY`: Supply rate for deposited collateral assets
- `GMX APY`: GM pool yield for the 40% buffer portion
- `Borrow Interest`: Only if user has borrowed (variable APR × borrowed %)
- `Platform Fee`: NeverSell's cut (e.g., 10% of yield)

### Implementation

```typescript
// hooks/useUnifiedAPY.ts

interface UnifiedAPYParams {
  allocations: Array<{
    asset: 'BTC' | 'ETH' | 'SOL' | 'ARB';
    percent: number;      // User's allocation to this asset
  }>;
  borrowedUSD: number;    // Current borrowed amount
  collateralUSD: number;  // Total position value
}

interface UnifiedAPYResult {
  grossAPY: number;       // Before fees and interest
  netAPY: number;         // What user actually earns
  
  // Breakdown (for debugging, NOT shown to user)
  _debug: {
    aaveComponent: number;
    gmxComponent: number;
    borrowCost: number;
    platformFee: number;
  };
}

function useUnifiedAPY(params: UnifiedAPYParams): UnifiedAPYResult {
  // 1. Fetch Aave supply rates for each asset
  const aaveRates = useAaveSupplyRates();
  
  // 2. Fetch GMX GM pool APYs
  const gmxRates = useGMXPoolAPYs();
  
  // 3. Calculate weighted Aave contribution (60% of deposit)
  let aaveComponent = 0;
  for (const allocation of params.allocations) {
    const assetRate = aaveRates[allocation.asset];
    aaveComponent += assetRate * allocation.percent * 0.6;
  }
  
  // 4. Calculate weighted GMX contribution (40% of deposit)
  let gmxComponent = 0;
  for (const allocation of params.allocations) {
    const poolRate = gmxRates[allocation.asset];
    gmxComponent += poolRate * allocation.percent * 0.4;
  }
  
  // 5. Calculate borrow cost (if any)
  const borrowAPR = useBorrowAPR('USDC');
  const borrowPercent = params.borrowedUSD / params.collateralUSD;
  const borrowCost = borrowAPR * borrowPercent;
  
  // 6. Calculate platform fee (10% of gross yield)
  const grossAPY = aaveComponent + gmxComponent;
  const platformFee = grossAPY * 0.10;
  
  // 7. Final net APY
  const netAPY = grossAPY - borrowCost - platformFee;
  
  return {
    grossAPY,
    netAPY,
    _debug: { aaveComponent, gmxComponent, borrowCost, platformFee }
  };
}
```

### Data Sources

| Component | Source | Update Frequency |
|-----------|--------|------------------|
| Aave Supply APY | Aave V3 contracts (`getReserveData`) | Every 15s |
| GMX GM Pool APY | GMX Stats API | Every 5 min |
| Borrow APR | Aave V3 contracts | Every 15s |
| Platform Fee | Hardcoded constant | On deploy |

### Display Rules

1. **Always show ONE number** - the net APY
2. **Never show breakdown** - user doesn't need to know components
3. **Format consistently**: `14.2%` (one decimal place)
4. **Color coding**: Green for positive, red if somehow negative

---

## 7. Component Architecture

### Directory Structure

```
src/
├── app/
│   ├── page.tsx                    # Landing page
│   └── app/
│       ├── layout.tsx              # App shell with nav
│       ├── page.tsx                # Dashboard
│       ├── deposit/
│       │   └── page.tsx            # Multi-step deposit flow
│       ├── borrow/
│       │   └── page.tsx            # Borrow/repay
│       ├── vaults/
│       │   ├── page.tsx            # Vault discovery
│       │   ├── [id]/
│       │   │   └── page.tsx        # Vault detail
│       │   └── create/
│       │       └── page.tsx        # Create vault (creators)
│       └── settings/
│           └── page.tsx            # User settings
│
├── components/
│   ├── ui/                         # Primitives (button, input, card, etc.)
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   ├── slider.tsx
│   │   ├── progress.tsx
│   │   └── tabs.tsx
│   │
│   ├── layout/                     # App structure
│   │   ├── AppShell.tsx
│   │   ├── Navbar.tsx
│   │   ├── Sidebar.tsx
│   │   └── MobileNav.tsx
│   │
│   ├── dashboard/                  # Dashboard-specific
│   │   ├── PositionSummary.tsx
│   │   ├── UnifiedAPYDisplay.tsx
│   │   ├── BorrowCapacityCard.tsx
│   │   ├── AllocationBreakdown.tsx
│   │   └── EmptyState.tsx
│   │
│   ├── deposit/                    # Deposit flow
│   │   ├── DepositWizard.tsx       # Multi-step container
│   │   ├── AmountStep.tsx
│   │   ├── StrategyStep.tsx
│   │   ├── CustomAllocationStep.tsx
│   │   ├── ReviewStep.tsx
│   │   ├── SuccessStep.tsx
│   │   ├── AllocationSlider.tsx
│   │   └── StrategyCard.tsx
│   │
│   ├── borrow/                     # Borrow flow
│   │   ├── BorrowCapacityMeter.tsx
│   │   ├── BorrowForm.tsx
│   │   ├── RepayForm.tsx
│   │   └── DebtSummary.tsx
│   │
│   ├── vaults/                     # Creator vaults
│   │   ├── VaultCard.tsx
│   │   ├── VaultLeaderboard.tsx
│   │   ├── VaultDetail.tsx
│   │   ├── CreatorHeader.tsx
│   │   ├── PerformanceChart.tsx
│   │   └── VaultDepositForm.tsx
│   │
│   └── shared/                     # Cross-cutting
│       ├── WalletButton.tsx
│       ├── ChainBadge.tsx
│       ├── APYBadge.tsx
│       ├── CurrencyInput.tsx
│       ├── AssetIcon.tsx
│       └── LoadingSpinner.tsx
│
├── hooks/
│   ├── useUnifiedPosition.ts       # Aggregated position data
│   ├── useUnifiedAPY.ts            # Blended APY calculation
│   ├── useBorrowCapacity.ts        # Available to borrow
│   ├── useDeposit.ts               # Deposit transaction
│   ├── useWithdraw.ts              # Withdraw transaction
│   ├── useBorrow.ts                # Borrow transaction
│   ├── useRepay.ts                 # Repay transaction
│   ├── useVaults.ts                # Vault listing
│   ├── useVault.ts                 # Single vault detail
│   │
│   │  # Lower-level (internal use)
│   ├── useAavePosition.ts          # Raw Aave data
│   ├── useAaveDeposit.ts
│   ├── useAaveBorrow.ts
│   ├── useGMXPosition.ts           # Raw GMX data
│   ├── useGMXDeposit.ts
│   ├── useGMXApy.ts
│   └── useLiFiBridge.ts            # Cross-chain bridging
│
├── lib/
│   ├── constants.ts                # Contract addresses, ABIs
│   ├── aave.ts                     # Aave helpers
│   ├── gmx.ts                      # GMX helpers
│   ├── formatting.ts               # Number formatting
│   └── calculations.ts             # APY math
│
├── stores/                         # State management
│   ├── depositStore.ts             # Deposit wizard state
│   └── positionStore.ts            # Cached position data
│
└── types/
    ├── position.ts
    ├── vault.ts
    └── transaction.ts
```

### State Management Approach

**Use Zustand for:**
- Multi-step deposit wizard state
- Cached position data (to avoid re-fetching)
- User preferences

**Use React Query (via wagmi) for:**
- Contract reads (with automatic caching/refetching)
- API calls (vault data, GMX APY)

**Example: Deposit Store**

```typescript
// stores/depositStore.ts
import { create } from 'zustand';

interface DepositState {
  step: 'amount' | 'strategy' | 'custom' | 'review' | 'success';
  amount: string;
  strategy: 'conservative' | 'balanced' | 'growth' | 'custom' | null;
  allocation: Record<string, number>;  // asset -> percent
  
  setAmount: (amount: string) => void;
  setStrategy: (strategy: DepositState['strategy']) => void;
  setAllocation: (allocation: Record<string, number>) => void;
  nextStep: () => void;
  prevStep: () => void;
  reset: () => void;
}

export const useDepositStore = create<DepositState>((set) => ({
  step: 'amount',
  amount: '',
  strategy: null,
  allocation: {},
  
  setAmount: (amount) => set({ amount }),
  setStrategy: (strategy) => set({ strategy }),
  setAllocation: (allocation) => set({ allocation }),
  
  nextStep: () => set((state) => {
    const steps: DepositState['step'][] = ['amount', 'strategy', 'custom', 'review', 'success'];
    const currentIndex = steps.indexOf(state.step);
    // Skip 'custom' if not using custom strategy
    if (state.step === 'strategy' && state.strategy !== 'custom') {
      return { step: 'review' };
    }
    return { step: steps[Math.min(currentIndex + 1, steps.length - 1)] };
  }),
  
  prevStep: () => set((state) => {
    const steps: DepositState['step'][] = ['amount', 'strategy', 'custom', 'review', 'success'];
    const currentIndex = steps.indexOf(state.step);
    // Skip 'custom' if not using custom strategy
    if (state.step === 'review' && state.strategy !== 'custom') {
      return { step: 'strategy' };
    }
    return { step: steps[Math.max(currentIndex - 1, 0)] };
  }),
  
  reset: () => set({
    step: 'amount',
    amount: '',
    strategy: null,
    allocation: {},
  }),
}));
```

### Hook Hierarchy

```
User-Facing Hooks (use these in components)
┌─────────────────────────────────────────┐
│  useUnifiedPosition()                   │  ← Dashboard uses this
│  useUnifiedAPY()                        │  ← APY display uses this
│  useBorrowCapacity()                    │  ← Borrow page uses this
│  useDeposit()                           │  ← Deposit wizard uses this
│  useWithdraw()                          │  ← Withdraw modal uses this
└─────────────────────────────────────────┘
              │
              │ internally calls
              ▼
Protocol-Specific Hooks (don't use directly in UI)
┌─────────────────────────────────────────┐
│  useAavePosition()                      │
│  useAaveDeposit()                       │
│  useAaveBorrow()                        │
│  useGMXPosition()                       │
│  useGMXDeposit()                        │
│  useGMXApy()                            │
│  useLiFiBridge()                        │
└─────────────────────────────────────────┘
```

---

## 8. Implementation Order

### Phase 1: Core Dashboard (Week 1)
1. [ ] Create `useUnifiedPosition` hook that aggregates Aave + GMX
2. [ ] Create `useUnifiedAPY` hook with formula implementation
3. [ ] Build `PositionSummary` component
4. [ ] Build `UnifiedAPYDisplay` component
5. [ ] Build `BorrowCapacityCard` component
6. [ ] Build `AllocationBreakdown` component
7. [ ] Build `EmptyState` component
8. [ ] Assemble Dashboard page

### Phase 2: Deposit Flow (Week 2)
1. [ ] Create `useDepositStore` for wizard state
2. [ ] Build `AmountStep` component
3. [ ] Build `StrategyCard` and `StrategyStep` component
4. [ ] Build `AllocationSlider` and `CustomAllocationStep`
5. [ ] Build `ReviewStep` with APY preview
6. [ ] Build `SuccessStep`
7. [ ] Create `useDeposit` hook (orchestrates Aave + GMX)
8. [ ] Wire up deposit transaction flow

### Phase 3: Borrow Flow (Week 3)
1. [ ] Build `BorrowCapacityMeter` component
2. [ ] Build `BorrowForm` component
3. [ ] Build `RepayForm` component
4. [ ] Build `DebtSummary` component
5. [ ] Create `useBorrow` hook
6. [ ] Create `useRepay` hook
7. [ ] Assemble Borrow page with tab switching

### Phase 4: Creator Vaults (Week 4)
1. [ ] Design vault data schema
2. [ ] Build `VaultCard` component
3. [ ] Build `VaultLeaderboard` with filters
4. [ ] Build `VaultDetail` page components
5. [ ] Build `VaultDepositForm`
6. [ ] Create `useVaults` and `useVault` hooks
7. [ ] Assemble Vaults discovery and detail pages

### Phase 5: Polish & Testing (Week 5)
1. [ ] Mobile responsiveness pass
2. [ ] Loading states and skeletons
3. [ ] Error handling and edge cases
4. [ ] Testnet integration testing
5. [ ] APY accuracy verification
6. [ ] Cross-chain deposit testing

---

## 9. Key Design Decisions

### Decision 1: Single-Page vs Multi-Page Deposit
**Choice:** Multi-step wizard on single page  
**Reasoning:** Maintains context, shows progress, allows back navigation

### Decision 2: Strategy Presets
**Choice:** 3 presets (Conservative/Balanced/Growth) + Custom  
**Reasoning:** Reduces decision fatigue while allowing power users to customize

### Decision 3: Hide Health Factor
**Choice:** Never show health factor to users  
**Reasoning:** It's Aave jargon. Instead, show "borrow capacity" which is intuitive.

### Decision 4: Net APY Display
**Choice:** Show net APY (after fees) as the primary number  
**Reasoning:** Honesty and simplicity. User knows exactly what they earn.

### Decision 5: Vault Creator Fees
**Choice:** Percentage of earnings (not TVL)  
**Reasoning:** Aligns incentives - creator only earns if depositors earn

---

## 10. Risk Mitigations

### Technical Risks

| Risk | Mitigation |
|------|------------|
| Bridge failure | Retry logic, clear error messaging, option to deposit on Arbitrum directly |
| Swap slippage | Aggregator finds best route, slippage protection, preview before confirm |
| APY calculation inaccuracy | Multiple data sources, fallback values, "estimated" language |
| Transaction failure | Clear error handling, retry option, position state preserved |

### UX Risks

| Risk | Mitigation |
|------|------------|
| User confused by allocation | Presets as default, education tooltips |
| User doesn't understand borrowing | Clear capacity visualization, warning on high utilization |
| Creator vault trust | Performance history, fee disclosure, timelock on changes |

---

## Appendix A: Preset Strategy Definitions

```typescript
const STRATEGY_PRESETS = {
  conservative: {
    name: 'Conservative',
    icon: '🛡️',
    description: 'Lower volatility, steady growth',
    allocation: { BTC: 100 },
    targetAPY: 12,
    riskLevel: 'low',
  },
  balanced: {
    name: 'Balanced',
    icon: '⚖️',
    description: 'Diversified exposure',
    allocation: { BTC: 50, ETH: 30, SOL: 20 },
    targetAPY: 14,
    riskLevel: 'medium',
  },
  growth: {
    name: 'Growth',
    icon: '🔥',
    description: 'Higher upside potential',
    allocation: { ETH: 30, SOL: 40, ARB: 30 },
    targetAPY: 18,
    riskLevel: 'high',
  },
};
```

---

## Appendix B: API Endpoints Needed

```
GET  /api/position/:address         → Unified position data
GET  /api/apy                       → Current unified APY by asset
GET  /api/vaults                    → List all vaults
GET  /api/vaults/:id                → Single vault detail
POST /api/deposit/quote             → Get deposit quote (amounts, routes)
POST /api/borrow/simulate           → Preview borrow impact
```

---

**Document End**

*This plan is ready for implementation. Proceed component by component, following the order in Section 8.*

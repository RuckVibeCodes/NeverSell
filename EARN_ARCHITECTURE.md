# NeverSell Earn Page — Architecture Spec

**Version:** 1.0  
**Date:** February 7, 2026  
**Status:** APPROVED FOR DEVELOPMENT

---

## Executive Summary

A unified yield aggregation layer combining:
- **Beefy Finance** vaults (auto-compound)
- **GMX GM pools** (existing integration)
- **Cross-chain routing** via LiFi
- **Social trading** (copy yield strategies)

**Core Value Prop:** "Best yields across all chains. One click. Set and forget."

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           NeverSell Earn                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │
│  │   Discover  │    │  My Vaults  │    │   Create    │    │ Leaderboard │  │
│  │   (Browse)  │    │ (Portfolio) │    │  (Creators) │    │  (Social)   │  │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘    └──────┬──────┘  │
│         │                  │                  │                  │          │
│         └──────────────────┴──────────────────┴──────────────────┘          │
│                                    │                                         │
│                        ┌───────────▼───────────┐                            │
│                        │   Yield Router        │                            │
│                        │   (Auto-allocate)     │                            │
│                        └───────────┬───────────┘                            │
│                                    │                                         │
│         ┌──────────────────────────┼──────────────────────────┐             │
│         │                          │                          │             │
│  ┌──────▼──────┐           ┌───────▼───────┐          ┌──────▼──────┐      │
│  │   Beefy     │           │     GMX       │          │    Aave     │      │
│  │   Adapter   │           │   Adapter     │          │   Adapter   │      │
│  └──────┬──────┘           └───────┬───────┘          └──────┬──────┘      │
│         │                          │                          │             │
│  ┌──────▼──────────────────────────▼──────────────────────────▼──────┐     │
│  │                         LiFi Bridge Layer                          │     │
│  │              Arbitrum ←→ Base ←→ Optimism ←→ Polygon              │     │
│  └────────────────────────────────────────────────────────────────────┘     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Page Structure

### URL: `/app/earn`

```
/app/earn                    → Discover (default)
/app/earn/my-vaults          → User's positions
/app/earn/create             → Create strategy (creators)
/app/earn/leaderboard        → Top performers
/app/earn/vault/[id]         → Individual vault detail
```

---

## 1. Discover Tab (Browse Vaults)

### 1.1 Hero Section
```tsx
<HeroSection>
  <h1>Earn the Best Yields</h1>
  <subtitle>Auto-routed across Arbitrum, Base, Optimism & Polygon</subtitle>
  
  <StatsRow>
    <Stat label="Total TVL" value="$12.4M" />
    <Stat label="Avg APY" value="24.6%" />
    <Stat label="Active Vaults" value="47" />
    <Stat label="Chains" value="4" />
  </StatsRow>
</HeroSection>
```

### 1.2 Quick Actions (For New Users)
```tsx
<QuickStart>
  <Card onClick={depositToRecommended}>
    <icon>🚀</icon>
    <title>Quick Start</title>
    <desc>Auto-deposit to top vault</desc>
    <apy>~28% APY</apy>
  </Card>
  
  <Card onClick={depositStable}>
    <icon>🛡️</icon>
    <title>Safe Yield</title>
    <desc>Stablecoin vaults only</desc>
    <apy>~8% APY</apy>
  </Card>
  
  <Card onClick={exploreSocial}>
    <icon>👥</icon>
    <title>Copy a Pro</title>
    <desc>Follow top creators</desc>
    <apy>Variable</apy>
  </Card>
</QuickStart>
```

### 1.3 Vault Grid

#### Filter Bar
```tsx
<FilterBar>
  <ChainFilter options={['All', 'Arbitrum', 'Base', 'Optimism', 'Polygon']} />
  <TypeFilter options={['All', 'Beefy', 'GMX', 'Social']} />
  <AssetFilter options={['All', 'BTC', 'ETH', 'Stables', 'Altcoins']} />
  <SortBy options={['APY', 'TVL', 'New', 'Trending']} />
  <RiskFilter options={['All', 'Low', 'Medium', 'High']} />
</FilterBar>
```

#### Vault Card
```tsx
<VaultCard>
  <Header>
    <ChainBadge chain="base" />
    <TypeBadge type="beefy" /> {/* or "gmx" or "social" */}
  </Header>
  
  <Title>
    <TokenPair tokens={['ETH', 'USDC']} />
    <Name>ETH-USDC Yield</Name>
  </Title>
  
  <Stats>
    <APY value="24.5%" trend="+2.1%" />
    <TVL value="$2.4M" />
    <Chain value="Base" />
  </Stats>
  
  <Footer>
    {type === 'social' && (
      <Creator name="CryptoKing" followers={15200} />
    )}
    <DepositButton />
  </Footer>
</VaultCard>
```

---

## 2. Vault Types

### 2.1 Beefy Vaults (Auto-Compound)

```typescript
interface BeefyVault {
  id: string;                    // "beefy-arb-eth-usdc"
  chain: Chain;                  // 'arbitrum' | 'base' | 'optimism' | 'polygon'
  beefyVaultAddress: Address;    // mooToken vault contract
  underlyingTokens: Token[];     // [ETH, USDC]
  apy: number;                   // 24.5 (%)
  tvl: number;                   // in USD
  platform: string;              // "Uniswap", "Camelot", "Aerodrome"
  riskScore: 1 | 2 | 3;          // 1=low, 3=high
  depositToken: Token;           // What user deposits (usually one of underlying or LP)
  
  // NeverSell wrapper
  wrapperAddress?: Address;      // Our fee wrapper contract (optional)
  platformFee: number;           // 0.3% (our cut)
}
```

### 2.2 GMX Pools (Existing)

```typescript
interface GMXPool {
  id: string;                    // "gmx-arb-btc-usd"
  chain: 'arbitrum';             // GMX is Arbitrum only
  gmPoolAddress: Address;
  pair: string;                  // "BTC/USD"
  apy: {
    base: number;                // Base fee APY
    performance: number;         // Performance fee APY
    total: number;
  };
  tvl: number;
  riskScore: 1 | 2 | 3;
}
```

### 2.3 Social Portfolios (Creator Strategies)

```typescript
interface SocialPortfolio {
  id: string;                    // UUID
  creator: {
    address: Address;
    name: string;
    handle: string;
    avatar: string;
    verified: boolean;
    followers: number;
  };
  
  // Strategy composition (can mix Beefy + GMX)
  allocations: {
    vaultId: string;             // References BeefyVault or GMXPool
    vaultType: 'beefy' | 'gmx';
    weight: number;              // 0-100 (percentage)
    chain: Chain;
  }[];
  
  // Performance
  performance: {
    day7: number;
    day30: number;
    day90: number;
    allTime: number;
  };
  
  // Fees
  creatorFee: number;            // 0-25% (of copier yield)
  platformFee: number;           // 10% (fixed)
  
  // Metadata
  name: string;
  description: string;
  tags: string[];
  tvl: number;
  copiers: number;
  trending: boolean;
}
```

---

## 3. Yield Router (Auto-Allocation)

The smart routing layer that finds optimal yields.

### 3.1 Router Logic

```typescript
interface YieldRoute {
  sourceChain: Chain;
  sourceToken: Token;
  amount: bigint;
  
  // Optimal destination
  destChain: Chain;
  destVault: BeefyVault | GMXPool;
  expectedApy: number;
  
  // Execution path
  steps: RouteStep[];
  estimatedGas: string;
  estimatedTime: number;
  bridgeFee: number;
  platformFee: number;
  netApy: number;  // After all fees
}

interface RouteStep {
  type: 'swap' | 'bridge' | 'deposit';
  chain: Chain;
  protocol: string;
  fromToken: Token;
  toToken: Token;
  estimatedOutput: bigint;
}
```

### 3.2 Routing Algorithm

```typescript
async function findBestYield(
  amount: bigint,
  riskTolerance: 'low' | 'medium' | 'high',
  preferredChains?: Chain[]
): Promise<YieldRoute[]> {
  
  // 1. Fetch all active vaults
  const beefyVaults = await fetchBeefyVaults(['arbitrum', 'base', 'optimism', 'polygon']);
  const gmxPools = await fetchGMXPools();
  
  // 2. Filter by risk tolerance
  const eligible = [...beefyVaults, ...gmxPools].filter(v => 
    v.riskScore <= riskToleranceMap[riskTolerance]
  );
  
  // 3. Calculate net APY (after bridge fees, gas, platform fees)
  const withNetApy = eligible.map(vault => ({
    vault,
    netApy: calculateNetApy(vault, amount, userChain),
    route: buildRoute(vault, amount, userChain),
  }));
  
  // 4. Sort by net APY descending
  withNetApy.sort((a, b) => b.netApy - a.netApy);
  
  // 5. Return top options (user picks or auto-selects best)
  return withNetApy.slice(0, 5);
}

function calculateNetApy(vault, amount, sourceChain): number {
  const grossApy = vault.apy;
  
  // Deduct bridge cost (amortized over 1 year)
  const bridgeCost = sourceChain !== vault.chain 
    ? estimateBridgeCost(amount) / amount * 100 
    : 0;
  
  // Deduct platform fees
  const platformFee = 0.3; // 0.3% entry + exit = ~0.6% annual impact if hold 1 year
  
  // Deduct gas (rough estimate)
  const gasCost = estimateGasCost(vault.chain) / amount * 100;
  
  return grossApy - bridgeCost - platformFee - gasCost;
}
```

### 3.3 Auto-Rebalance (Optional Feature)

```typescript
interface RebalanceConfig {
  enabled: boolean;
  threshold: number;      // Rebalance if APY diff > X%
  frequency: 'daily' | 'weekly' | 'monthly';
  maxSlippage: number;    // 0.5%
  preferSameChain: boolean;
}

// Cron job checks if rebalance is profitable
async function checkRebalance(position: UserPosition): Promise<RebalanceAction | null> {
  const currentApy = position.vault.apy;
  const bestAlternative = await findBestYield(position.value, position.riskTolerance);
  
  const apyImprovement = bestAlternative.netApy - currentApy;
  
  if (apyImprovement > position.rebalanceConfig.threshold) {
    return {
      from: position.vault,
      to: bestAlternative.vault,
      improvement: apyImprovement,
      estimatedCost: bestAlternative.route.bridgeFee + bestAlternative.route.estimatedGas,
    };
  }
  
  return null;
}
```

---

## 4. Social Trading Integration

### 4.1 Creator Flow

```
1. Creator connects wallet
2. Creator builds portfolio:
   - Add vaults (Beefy + GMX mix)
   - Set weights (must sum to 100%)
   - Set creator fee (0-25%)
   - Add name, description, tags
3. Creator stakes minimum (10% of target TVL or $1k)
4. Portfolio goes live on leaderboard
5. Copiers deposit → funds auto-allocated per weights
6. Creator earns 20% of copier yield
```

### 4.2 Copier Flow

```
1. Browse leaderboard or search creators
2. View portfolio detail:
   - Composition (which vaults, which chains)
   - Historical performance
   - Creator track record
   - Fee breakdown
3. Click "Copy"
4. Enter USDC amount
5. Funds route to underlying vaults (may cross chains)
6. Copier sees single position in "My Vaults"
```

### 4.3 Fee Distribution

```
Copier deposits $10,000 USDC
  ↓
Yield generated: $2,400/year (24% APY)
  ↓
Distribution:
  - Creator (20%): $480
  - Platform (10%): $240
  - Copier (70%): $1,680

Copier net APY: 16.8%
```

### 4.4 Database Schema

```sql
-- Creators
CREATE TABLE creators (
  id UUID PRIMARY KEY,
  wallet_address TEXT UNIQUE NOT NULL,
  name TEXT,
  handle TEXT UNIQUE,
  avatar_url TEXT,
  bio TEXT,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Social Portfolios
CREATE TABLE social_portfolios (
  id UUID PRIMARY KEY,
  creator_id UUID REFERENCES creators(id),
  name TEXT NOT NULL,
  description TEXT,
  tags TEXT[],
  creator_fee_bps INTEGER DEFAULT 2000, -- 20%
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Portfolio Allocations
CREATE TABLE portfolio_allocations (
  id UUID PRIMARY KEY,
  portfolio_id UUID REFERENCES social_portfolios(id),
  vault_type TEXT NOT NULL, -- 'beefy' | 'gmx'
  vault_id TEXT NOT NULL,   -- External vault identifier
  chain TEXT NOT NULL,
  weight_bps INTEGER NOT NULL, -- Basis points (10000 = 100%)
  CHECK (weight_bps > 0 AND weight_bps <= 10000)
);

-- Copier Positions
CREATE TABLE copier_positions (
  id UUID PRIMARY KEY,
  portfolio_id UUID REFERENCES social_portfolios(id),
  copier_address TEXT NOT NULL,
  deposited_usdc NUMERIC NOT NULL,
  shares NUMERIC NOT NULL, -- Internal share accounting
  entry_price NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Position History (for performance tracking)
CREATE TABLE position_snapshots (
  id UUID PRIMARY KEY,
  portfolio_id UUID REFERENCES social_portfolios(id),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  tvl_usdc NUMERIC NOT NULL,
  share_price NUMERIC NOT NULL,
  apy_trailing_30d NUMERIC
);
```

---

## 5. Cross-Chain Position Tracking

### 5.1 Position Storage

```typescript
interface UserPosition {
  id: string;
  userAddress: Address;
  
  // Position details
  vaultType: 'beefy' | 'gmx' | 'social';
  vaultId: string;
  chain: Chain;
  
  // Amounts
  depositedUsdc: bigint;       // Original deposit
  currentShares: bigint;       // mooTokens or GM tokens or internal shares
  currentValueUsdc: bigint;    // Live value
  
  // Tracking
  entryTimestamp: number;
  lastUpdated: number;
  
  // For social portfolios
  portfolioId?: string;
  creatorAddress?: Address;
}
```

### 5.2 Multi-Chain Balance Fetching

```typescript
const CHAIN_RPCS = {
  arbitrum: process.env.ARBITRUM_RPC,
  base: process.env.BASE_RPC,
  optimism: process.env.OPTIMISM_RPC,
  polygon: process.env.POLYGON_RPC,
};

async function fetchUserPositions(userAddress: Address): Promise<UserPosition[]> {
  // 1. Get positions from database (source of truth for what user deposited)
  const dbPositions = await db.query('SELECT * FROM user_positions WHERE user_address = $1', [userAddress]);
  
  // 2. Fetch live balances from each chain in parallel
  const liveBalances = await Promise.all(
    dbPositions.map(async (pos) => {
      const rpc = CHAIN_RPCS[pos.chain];
      const vaultContract = getVaultContract(pos.vault_address, rpc);
      
      const shares = await vaultContract.balanceOf(userAddress);
      const pricePerShare = await vaultContract.getPricePerFullShare();
      const currentValue = (shares * pricePerShare) / 1e18;
      
      return {
        ...pos,
        currentShares: shares,
        currentValueUsdc: currentValue,
        lastUpdated: Date.now(),
      };
    })
  );
  
  return liveBalances;
}
```

---

## 6. API Endpoints

```typescript
// Vault Discovery
GET  /api/earn/vaults                    // List all vaults (filterable)
GET  /api/earn/vaults/:id                // Single vault detail
GET  /api/earn/vaults/trending           // Trending vaults
GET  /api/earn/vaults/top-apy            // Highest APY vaults

// Yield Router
POST /api/earn/route                     // Find best yield route
POST /api/earn/route/quote               // Get deposit quote with fees

// User Positions
GET  /api/earn/positions                 // User's positions (requires auth)
POST /api/earn/deposit                   // Deposit to vault
POST /api/earn/withdraw                  // Withdraw from vault

// Social Trading
GET  /api/earn/portfolios                // List social portfolios
GET  /api/earn/portfolios/:id            // Portfolio detail
POST /api/earn/portfolios                // Create portfolio (creators)
PUT  /api/earn/portfolios/:id            // Update portfolio
POST /api/earn/portfolios/:id/copy       // Copy a portfolio
DELETE /api/earn/portfolios/:id/copy     // Stop copying

// Leaderboard
GET  /api/earn/leaderboard               // Top creators
GET  /api/earn/creators/:address         // Creator profile
```

---

## 7. Smart Contracts Required

### 7.1 NeverSellRouter.sol
Entry point for all deposits/withdrawals.

```solidity
contract NeverSellRouter {
    function depositToVault(
        address vault,
        uint256 amount,
        uint256 minShares
    ) external returns (uint256 shares);
    
    function depositCrossChain(
        uint256 destChainId,
        address destVault,
        uint256 amount,
        bytes calldata lifiData
    ) external returns (bytes32 bridgeTxId);
    
    function withdraw(
        address vault,
        uint256 shares,
        uint256 minAmount
    ) external returns (uint256 amount);
}
```

### 7.2 BeefyAdapter.sol
Wraps Beefy vault interactions with fee collection.

```solidity
contract BeefyAdapter {
    uint256 public depositFeeBps = 30;  // 0.3%
    address public feeCollector;
    
    function deposit(
        address beefyVault,
        uint256 amount
    ) external returns (uint256 shares) {
        uint256 fee = (amount * depositFeeBps) / 10000;
        IERC20(asset).transferFrom(msg.sender, feeCollector, fee);
        
        uint256 netAmount = amount - fee;
        IERC20(asset).approve(beefyVault, netAmount);
        shares = IBeefyVault(beefyVault).deposit(netAmount);
        
        IERC20(beefyVault).transfer(msg.sender, shares);
    }
}
```

### 7.3 SocialPortfolio.sol
Manages copier positions in social portfolios.

```solidity
contract SocialPortfolio {
    struct Allocation {
        address adapter;      // BeefyAdapter or GMXAdapter
        address vault;
        uint256 weightBps;
        uint256 chainId;
    }
    
    Allocation[] public allocations;
    address public creator;
    uint256 public creatorFeeBps;
    
    mapping(address => uint256) public copierShares;
    uint256 public totalShares;
    
    function deposit(uint256 usdcAmount) external returns (uint256 shares);
    function withdraw(uint256 shares) external returns (uint256 usdcAmount);
    function rebalance(Allocation[] calldata newAllocations) external onlyCreator;
}
```

---

## 8. Implementation Phases

### Phase 1: Beefy Vaults (Week 1)
- [ ] Beefy API integration (`/api/earn/vaults`)
- [ ] Vault discovery UI
- [ ] Single-chain deposits (Arbitrum only)
- [ ] Position tracking

### Phase 2: Cross-Chain (Week 2)
- [ ] LiFi integration for deposits
- [ ] Multi-chain balance fetching
- [ ] Cross-chain withdrawal routing
- [ ] Yield router algorithm

### Phase 3: Social Trading (Week 3-4)
- [ ] Creator portfolio builder UI
- [ ] Copier flow
- [ ] Fee distribution logic
- [ ] Leaderboard

### Phase 4: Smart Contracts (Week 4-5)
- [ ] NeverSellRouter.sol
- [ ] BeefyAdapter.sol
- [ ] SocialPortfolio.sol
- [ ] Testing + testnet deployment

### Phase 5: Polish (Week 5-6)
- [ ] Performance optimization
- [ ] Mobile responsiveness
- [ ] Analytics dashboard
- [ ] Documentation

---

## 9. Revenue Projections

```
Assumptions:
- $500k TVL after 3 months
- Average deposit: $2,000
- 60% cross-chain deposits
- Users hold 6 months average

Revenue Streams:
┌─────────────────────────────────────┬──────────────┐
│ Source                              │ Annual Rev   │
├─────────────────────────────────────┼──────────────┤
│ Deposit fee (0.3%)                  │ $1,500       │
│ Withdrawal fee (0.2%)               │ $1,000       │
│ LiFi bridge fee (0.1% × 60%)        │ $600         │
│ Platform fee (10% of yield)         │ $12,000      │
│ Social creator fee share (2%)       │ $2,400       │
├─────────────────────────────────────┼──────────────┤
│ TOTAL                               │ $17,500/year │
└─────────────────────────────────────┴──────────────┘

At $5M TVL: ~$175,000/year
```

---

## 10. Risk Considerations

| Risk | Mitigation |
|------|------------|
| Bridge exploit | Cap cross-chain TVL at 30%, whitelist bridges |
| Beefy vault exploit | Only use vaults with Safety Score > 8 |
| Smart contract bug | Audit before mainnet, start with low caps |
| Creator rug (social) | Require creator stake, timelock withdrawals |
| Oracle manipulation | Use Chainlink where available |

---

**Ready to build. Start with Phase 1?**

— Geoffrey 🎩

# NeverSell DeFi - Integration Requirements

**Last Updated:** February 1, 2026  
**Status:** Audit Complete

---

## 📊 Current Integration Status

### ✅ Implemented

| Component | Status | Notes |
|-----------|--------|-------|
| RainbowKit | ✅ Complete | Custom dark theme, compact modal |
| wagmi | ✅ Complete | React Query integration |
| LiFi SDK | ✅ Functional | Basic bridge/swap working |
| GMX V2 Deposits | ✅ Functional | BTC/USD, ETH/USD, ARB/USD pools |
| Coinbase Onramp | 🟡 Partial | URL redirect only, no API key |

### ❌ Missing / Needs Work

| Component | Status | Required Action |
|-----------|--------|----------------|
| Platform Fee | ❌ Not implemented | Add LiFi integrator fee |
| Fee Wallet | ❌ Not configured | Create/designate wallet |
| LiFi Portal Setup | ❌ Not registered | Register at portal.li.fi |
| WalletConnect | 🟡 Demo key | Need production project ID |

---

## 🔧 Component Details

### 1. Web3Provider (`/src/components/providers/Web3Provider.tsx`)

**Status:** ✅ Working

```typescript
// Current config
const config = getDefaultConfig({
  appName: "NeverSell",
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || "demo",
  chains: [arbitrum],
  ssr: true,
});
```

**Issues:**
- Uses "demo" fallback for WalletConnect - will break in production
- Only Arbitrum chain configured (correct for destination, but users need source chains)

**Required:**
- [ ] Get WalletConnect Project ID from cloud.walletconnect.com
- [ ] Add to `.env.local`: `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=<actual_id>`

---

### 2. LiFi Bridge (`/src/lib/lifi.ts` + `/src/hooks/useLiFiBridge.ts`)

**Status:** 🟡 Functional but missing fee collection

**Current Implementation:**
```typescript
// LiFi config - NO FEES CONFIGURED
createConfig({
  integrator: 'neversell',  // ✅ Good - integrator name set
  // ❌ Missing: routeOptions.fee
});
```

**Capabilities:**
- ✅ Cross-chain bridging (ETH, Base, Optimism, Polygon, BSC, Avalanche → Arbitrum)
- ✅ Token swaps (any token to ETH/WBTC/USDC/ARB on Arbitrum)
- ✅ Quote fetching with gas estimates
- ❌ Bridging OUT of Arbitrum (destination locked to Arbitrum)
- ❌ Fee collection not configured

**Required for Fee Collection:**
1. Register at https://portal.li.fi/ with integrator name "neversell"
2. Set up fee collection wallet
3. Update `initLiFiConfig()` with fee parameter (see FEE_IMPLEMENTATION.md)

---

### 3. Coinbase Onramp (`/src/app/app/fund/page.tsx`)

**Status:** 🟡 Partial - URL redirect only

**Current Implementation:**
```typescript
const onrampUrl = new URL('https://pay.coinbase.com/buy/select-asset');
onrampUrl.searchParams.set('appId', 'neversell'); // ❌ Placeholder, not real
onrampUrl.searchParams.set('destinationWallets', JSON.stringify([{
  address: address,
  assets: ['USDC'],
  supportedNetworks: ['arbitrum'],
}]));
window.open(onrampUrl.toString(), '_blank');
```

**Issues:**
- `appId: 'neversell'` is a placeholder - needs real Coinbase Developer App ID
- Opens in new tab (could use embedded widget instead)
- No callback/webhook for completion tracking

**Required:**
1. Register at https://www.coinbase.com/cloud/products/onramp
2. Get Onramp App ID
3. Configure callback URLs for completion tracking
4. Consider switching to embedded widget for better UX

**Alternative Providers (if Coinbase is complex):**
- **MoonPay** - simpler integration, higher fees
- **Transak** - good global coverage
- **Wyre** (deprecated but some use Stripe)

---

### 4. GMX V2 Deposits (`/src/hooks/useGMXDeposit.ts` + `/src/lib/gmx.ts`)

**Status:** ✅ Working

**Supported GM Pools:**
| Pool | Market Token | Long | Short |
|------|--------------|------|-------|
| BTC/USD | 0x47c031... | WBTC | USDC |
| ETH/USD | 0x70d955... | WETH | USDC |
| ARB/USD | 0xC25cEf... | ARB | USDC |

**Flow:**
1. User deposits USDC (short token) or ETH/BTC/ARB (long token)
2. Hook checks allowances, requests approval if needed
3. Creates deposit via GMX ExchangeRouter.multicall()
4. User receives GM tokens representing LP position

**Note on `uiFeeReceiver`:**
```typescript
const depositParams: DepositParams = {
  // ...
  uiFeeReceiver: ZERO_ADDRESS,  // ❌ Currently set to zero - could collect UI fees!
  // ...
};
```

GMX has a built-in UI fee mechanism. Setting `uiFeeReceiver` to a platform wallet would collect GMX UI fees automatically. **This is separate from the LiFi bridge fee.**

---

## 💰 Fee Architecture Overview

### Fee Collection Points

| Action | Fee Mechanism | Status |
|--------|---------------|--------|
| Bridge/Swap via LiFi | LiFi integrator fee | ❌ Not configured |
| GMX Deposit | GMX UI fee | ❌ Not configured |
| GMX Withdrawal | GMX UI fee | ❌ Not configured |
| Fiat Onramp | Provider fee (no cut) | N/A |

### Recommended Fee Structure
- **LiFi Bridge/Swap:** 0.1% (subtle, competitive)
- **GMX UI Fee:** Up to 0.1% (optional, adds on top of GMX's existing fees)

---

## 🎯 Action Items for Matt

### Priority 1: Fee Collection Setup
1. [ ] **Create Platform Fee Wallet**
   - Generate new EOA or use multisig
   - This wallet will receive all collected fees
   - Document address in `.env.local` as `NEXT_PUBLIC_FEE_WALLET`

2. [ ] **Register at LiFi Portal**
   - Go to https://portal.li.fi/
   - Register with integrator name: `neversell`
   - Set fee collection wallet
   - This enables fee tracking dashboard

### Priority 2: API Keys/Config
3. [ ] **WalletConnect Project ID**
   - Go to https://cloud.walletconnect.com/
   - Create project for NeverSell
   - Add to `.env.local`

4. [ ] **Coinbase Onramp App ID** (optional if using redirect)
   - Go to https://www.coinbase.com/cloud
   - Register developer account
   - Create Onramp integration

### Priority 3: Optional Enhancements
5. [ ] **Alchemy API Key** (for better RPC reliability)
6. [ ] **GMX UI Fee** (additional revenue stream from deposits)

---

## 📁 Environment Variables Template

```bash
# .env.local

# Required
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_walletconnect_project_id

# Fee Collection
NEXT_PUBLIC_FEE_WALLET=0x...your_fee_collection_wallet

# Optional - Onramp
NEXT_PUBLIC_COINBASE_ONRAMP_APP_ID=your_coinbase_app_id

# Optional - Better RPC
NEXT_PUBLIC_ALCHEMY_API_KEY=your_alchemy_key
NEXT_PUBLIC_ARBITRUM_RPC_URL=https://arb-mainnet.g.alchemy.com/v2/your_key
```

---

## 🔄 USDC Flow Analysis

### Current Flow (Verified ✅)

```
User's Wallet (Any Chain)
    │
    ▼ LiFi Bridge/Swap
USDC on Arbitrum (in user's wallet)
    │
    ▼ GMX ExchangeRouter.createDeposit()
GM Token (e.g., GM BTC/USD)
    │
    ▼ Yield accrues from trading fees
User can withdraw anytime
```

### Gap Analysis

| Step | Status | Notes |
|------|--------|-------|
| Onramp → USDC | ✅ Works | Coinbase sends directly to wallet |
| Bridge → Arbitrum USDC | ✅ Works | LiFi handles routing |
| USDC → GM Pool | ✅ Works | Deposited as short token |
| ETH/BTC → GM Pool | ✅ Works | Deposited as long token |
| GM → Withdraw | ⚠️ Not tested | Hook exists but needs UI |

**Potential Gap:** No automatic "deposit all" flow. User must:
1. Fund wallet (onramp or bridge)
2. Manually navigate to pools
3. Select pool and deposit

Consider: Auto-deposit flow where bridged funds go directly into selected GM pool.

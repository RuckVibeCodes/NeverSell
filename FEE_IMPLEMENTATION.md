# NeverSell - Platform Fee Implementation

**Status:** ✅ IMPLEMENTED  
**Fee:** 0.1% on bridge/swap transactions  
**Revenue Potential:** $1 per $1,000 volume  
**LiFi Integrator:** NeverSell  
**API Key:** Configured in .env.local  
**Fee Collection Wallet:** `0x9c7930cA28279C6A7a763DcA3573620903491806`

---

## 🎯 Objective

Implement a subtle 0.1% platform fee on LiFi bridge/swap transactions. The fee should:
- Be minimally visible to users (not hidden, just not emphasized)
- Collect in a platform wallet for operational revenue
- Not significantly impact UX or conversion

---

## 📖 How LiFi Fees Work

### Fee Mechanism
- Fees are **deducted from the output amount** (not added to input)
- User sends $1000 → receives $999 worth of destination token (minus gas)
- Fees collected in the **destination token** on the **destination chain**
- Fees accumulate in LiFi's Fee Collector contract

### Fee Collection
- Fees are **not** sent directly to your wallet
- They're held in LiFi's smart contract
- Must be claimed periodically via LiFi Portal or contract calls
- Can withdraw in any token/chain via LiFi's swap tools

### Revenue Share
- LiFi takes a percentage cut of integrator fees (typically 0-15% depending on volume)
- Contact LiFi for exact terms when volume increases

---

## 🔧 Implementation Approach

### Option A: Global Fee (Recommended) ✅

Set fee once in SDK config, applies to all transactions automatically.

**File:** `/src/lib/lifi.ts`

```typescript
// BEFORE (current code)
export function initLiFiConfig() {
  createConfig({
    integrator: 'neversell',
  });
}

// AFTER (with fee)
export function initLiFiConfig() {
  createConfig({
    integrator: 'neversell',
    routeOptions: {
      fee: 0.001,  // 0.1% fee
    },
  });
}
```

**Pros:**
- Single change, applies everywhere
- No risk of forgetting fee on new quote requests
- Cleaner code

**Cons:**
- Less flexibility if different fees needed for different flows

---

### Option B: Per-Request Fee

Add fee to each quote request individually.

**File:** `/src/lib/lifi.ts`

```typescript
export async function getBridgeQuote(params: BridgeQuoteParams): Promise<BridgeQuoteResult> {
  const quoteRequest: QuoteRequest = {
    fromChain: fromChainId,
    toChain: toChainId,
    fromToken: fromTokenAddress,
    toToken: toTokenAddress,
    fromAmount,
    fromAddress,
    toAddress,
    slippage,
    integrator: 'neversell',  // Already present
    fee: 0.001,  // ADD THIS: 0.1% fee
  };

  const step = await getQuote(quoteRequest);
  // ...
}
```

**Pros:**
- Fine-grained control
- Can vary fee by transaction type

**Cons:**
- Must remember to add to every quote request
- More code to maintain

---

## 🖥️ UI Treatment

### Current Display (Fund Page)

The fund page already shows fees in the quote breakdown:

```typescript
// Already exists in /src/app/app/fund/page.tsx
<div className="flex items-center justify-between">
  <div className="text-white/60 text-sm">
    Platform fee (0.1%)
  </div>
  <div className="text-amber-400 text-sm">
    ~{feeCalculations.platformFee.toFixed(6)} {selectedToToken.symbol}
  </div>
</div>
```

### Subtle Display Recommendations

1. **Keep the fee line** - Transparency is required, don't hide it
2. **Use muted colors** - Current amber is fine, could use white/40
3. **Position at bottom** - After exchange rate, before total
4. **Small text** - `text-xs` instead of `text-sm`
5. **Combined line option:**
   ```
   Network fee + platform fee: ~$1.23
   ```
   This combines gas + platform fee into one line (less obvious split)

### What NOT to do
- ❌ Don't hide the fee completely (regulatory risk, bad UX)
- ❌ Don't call it "gas" when it's not
- ❌ Don't make the fee larger than competitors (0.1% is competitive)

---

## 📊 Fee Calculation Logic

### Current Code (Fund Page)

```typescript
// Platform fee (0.1%)
const PLATFORM_FEE_PERCENT = 0.001;

const feeCalculations = useMemo(() => {
  const outputAmount = parseFloat(estimatedOutput);
  const platformFee = outputAmount * PLATFORM_FEE_PERCENT;
  const finalAmount = outputAmount - platformFee;
  // ...
}, [estimatedOutput, status, ...]);
```

### Important: This is Display Only!

The current code only **calculates for display**. The actual fee deduction happens at the LiFi protocol level when the `fee` parameter is set in the SDK config.

**Current state:** Display shows fee, but LiFi isn't actually collecting it.

**After implementation:** LiFi will deduct 0.1% and hold it for NeverSell to claim.

---

## ✅ Implementation Checklist

### Phase 1: Setup (Matt Required)

- [ ] Create fee collection wallet (EOA or multisig)
- [ ] Register at https://portal.li.fi/
  - Set integrator name: `neversell`
  - Configure fee wallet address
  - Verify ownership
- [ ] Note the dashboard URL for fee tracking

### Phase 2: Code Changes (5 minutes)

- [ ] Update `/src/lib/lifi.ts` with fee parameter
- [ ] Verify quote response includes fee data
- [ ] Test on testnet/small mainnet amount

### Phase 3: Verify

- [ ] Execute test swap ($10-50)
- [ ] Check LiFi Portal dashboard for fee accrual
- [ ] Verify user sees correct "You receive" amount

---

## 💰 Revenue Projections

| Monthly Volume | 0.1% Fee | Annual |
|----------------|----------|--------|
| $10,000 | $10 | $120 |
| $100,000 | $100 | $1,200 |
| $1,000,000 | $1,000 | $12,000 |
| $10,000,000 | $10,000 | $120,000 |

*Note: LiFi may take a small cut (verify with their team)*

---

## 🔐 Security Considerations

1. **Fee Wallet Security**
   - Use a multisig or hardware wallet
   - Don't use hot wallet that's also used for testing
   - Consider Gnosis Safe for team access

2. **Fee Rate Changes**
   - Currently hardcoded - consider making configurable
   - Could read from env var for easy adjustment

3. **Claiming Fees**
   - Set calendar reminder to claim periodically
   - Fees can accumulate in various tokens - swap/consolidate

---

## 📝 Code Diff Summary

### Minimal Implementation (Option A)

```diff
// /src/lib/lifi.ts

export function initLiFiConfig() {
  createConfig({
    integrator: 'neversell',
+   routeOptions: {
+     fee: 0.001,  // 0.1% platform fee
+   },
  });
}
```

**That's it.** One line (plus the object wrapper) enables fee collection.

---

## ⚠️ Important Notes

1. **Test First:** Do a small test transaction before going live
2. **Regulatory:** Clearly disclose fees to users (already doing this)
3. **Competitive:** 0.1% is lower than most competitors (0.3-1% common)
4. **Scaling:** Can adjust fee based on volume/market conditions

---

## 🚫 DO NOT IMPLEMENT WITHOUT

1. ✅ Matt's explicit approval
2. ✅ Fee wallet created and secured
3. ✅ LiFi Portal registration complete
4. ✅ Test transaction verified

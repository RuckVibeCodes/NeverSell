# NeverSell On-Ramp Setup - Status Report

**Created:** February 3, 2026  
**Branch:** `geoffrey/onramp-setup`  
**Status:** In Progress

## ✅ Completed

### 1. Environment Configuration
- Added `NEXT_PUBLIC_FEE_WALLET` to collect platform fees (0x9c7930cA28279C6A7a763DcA3573620903491806)
- Added `NEXT_PUBLIC_COINBASE_ONRAMP_APP_ID` for Coinbase integration
- Added LiFi fee configuration (`NEXT_PUBLIC_LIFI_FEE=0.001` for 0.1%)

### 2. Coinbase Onramp UI
- Updated fund page to use environment variable for App ID
- Created `buildCoinbaseOnrampUrl()` helper function
- Properly configured destination wallet (USDC on Arbitrum)

### 3. Documentation
- Updated `.env.example` with all required environment variables

## 📋 Remaining Setup (Requires Matt's Action)

### 1. Get Coinbase Onramp App ID
1. Go to https://www.coinbase.com/cloud/products/onramp
2. Register/login with your Coinbase developer account
3. Create an Onramp integration for NeverSell
4. Copy the App ID and add to `.env.local`:
   ```
   NEXT_PUBLIC_COINBASE_ONRAMP_APP_ID=your_real_app_id
   ```

### 2. Register LiFi Portal (Optional but Recommended)
1. Go to https://portal.li.fi/
2. Register with integrator name: `NeverSell`
3. Set up fee collection wallet (use the fee wallet address)
4. This enables the fee tracking dashboard

### 3. WalletConnect Project ID (Optional)
1. Go to https://cloud.walletconnect.com/
2. Create project for NeverSell
3. Add to `.env.local`:
   ```
   NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id
   ```

## 🔧 Environment Variables Required

```bash
# Required for Onramp
NEXT_PUBLIC_COINBASE_ONRAMP_APP_ID=your_coinbase_app_id

# Already configured
NEXT_PUBLIC_FEE_WALLET=0x9c7930cA28279C6A7a763DcA3573620903491806
NEXT_PUBLIC_LIFI_INTEGRATOR=NeverSell
NEXT_PUBLIC_LIFI_API_KEY=6aa6531a-ac35-4183-926c-54d7d7a8ffd1.b9571027-6b7c-4b94-bf86-484e46d53d8f
NEXT_PUBLIC_LIFI_FEE=0.001

# Optional (for better UX)
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_walletconnect_project_id
```

## 📁 Files Modified

- `web/.env.example` - Added on-ramp and fee collection env vars
- `web/.env.local` - Added fee wallet and Coinbase config
- `web/src/app/app/fund/page.tsx` - Updated Coinbase onramp to use env var

## 🎯 Next Steps

1. **Matt:** Get Coinbase Onramp App ID and add to `.env.local`
2. **Deploy:** Merge `geoffrey/onramp-setup` branch
3. **Test:** Verify on-ramp flow works with real credentials

## 💰 Fee Collection Flow

```
User Bridge/Swap → LiFi processes → 0.1% fee to Fee Wallet (0x9c7930...)
                  → User receives 99.9%
```

## 🔗 Useful Links

- Coinbase Onramp: https://www.coinbase.com/cloud/products/onramp
- LiFi Portal: https://portal.li.fi/
- WalletConnect: https://cloud.walletconnect.com/

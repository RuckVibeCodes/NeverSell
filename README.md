# NeverSell - DeFi Yield Platform

A DeFi yield platform that lets you access the value of your crypto without selling. Built on Arbitrum.

## Features

- **Deposit & Earn**: Supply crypto assets and earn yield
- **Borrow Against**: Access liquidity without selling your position
- **Never Sell**: Keep your upside exposure while accessing value
- **Vaults**: Automated yield strategies (coming soon)

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- wagmi + RainbowKit for wallet connection
- Arbitrum One

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

3. Add your WalletConnect project ID to `.env.local`

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID` | WalletConnect project ID |
| `NEXT_PUBLIC_ALCHEMY_API_KEY` | Alchemy API key (optional) |
| `NEXT_PUBLIC_ARBITRUM_RPC_URL` | Custom Arbitrum RPC (optional) |

## License

MIT

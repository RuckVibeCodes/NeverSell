# NeverSell Page Restructure Implementation Plan

## Overview
Restructure Markets, Pools, and Portfolios pages to eliminate overlap and create clear user flows.

---

## Current State Analysis

| Page | Current Purpose | Problems |
|------|-----------------|----------|
| **Markets** (`/app/markets`) | GMX pool browser with filters | Has external links only, no deposit CTAs, overlaps with Pools |
| **Pools** (`/app/pools`) | Strategy presets + individual pool deposits | Mixes beginner (presets) and advanced (individual) features |
| **Portfolios** (`/app/vaults`) | Social trading hub | Good foundation but needs prominence for creator monetization |

---

## Target State

| Page | New Purpose | Core Actions |
|------|-------------|--------------|
| **Markets** | Pure research & analytics | Explore, analyze, discover → CTAs to Pools or Portfolios |
| **Pools** | Quick start for beginners | Pick 1 of 3 presets → Deposit → Done |
| **Portfolios** | Social trading hub | Leaderboard, copy trading, create & earn 20% |

---

## Implementation Checklist

### Phase 1: Markets Page Cleanup
**File:** `src/app/app/markets/page.tsx`

- [ ] **1.1** Remove `PoolCard` expanded section deposit actions
  - Delete the "View on GMX" and "Arbiscan" action buttons
  - Keep the pool composition and APY breakdown info
  
- [ ] **1.2** Add prominent CTA banner at top of page
  ```tsx
  // Add below StatsSummary component
  <MarketsCTABanner />
  ```
  - "Ready to earn?" banner with two buttons:
    - "Quick Start → Pools" (for beginners)
    - "Create Portfolio → " (for advanced/creators)

- [ ] **1.3** Add contextual "Deposit via" badges on pool cards
  - Each pool card should show: "Available in: Pools | Portfolios"
  - Link to respective pages with pool pre-selected (query param)

- [ ] **1.4** Update page header subtitle
  - Change: "Explore all GMX liquidity pools on Arbitrum"
  - To: "Research & analyze GMX liquidity pools. Find your edge."

- [ ] **1.5** Add educational callouts
  - "Pro tip" boxes explaining when to use Pools vs Portfolios
  - Brief explainer cards for each pool type (standard vs single-sided)

---

### Phase 2: Pools Page Simplification
**File:** `src/app/app/pools/page.tsx`

- [ ] **2.1** Remove "Individual Pools" section entirely
  - Delete the `showIndividualPools` toggle and section
  - Delete the `PoolCard` and `DepositModal` components (individual pool)
  - Keep only the 3 strategy preset cards

- [ ] **2.2** Rename strategy presets for clarity
  - "Conservative" → "🛡️ Safe Yield" (100% BTC)
  - "Balanced" → "⚖️ Balanced Growth" (50/30/20)
  - "Growth" → "🔥 Aggressive" (30/40/30)

- [ ] **2.3** Add "Need more control?" CTA at bottom
  ```tsx
  <AdvancedCTASection />
  ```
  - Banner directing to Portfolios page
  - Text: "Want custom allocations or to earn from your strategy? Create a Portfolio →"

- [ ] **2.4** Simplify page header
  - Title: "Quick Start"
  - Subtitle: "Pick a strategy. Deposit. Done. (Under 2 minutes)"

- [ ] **2.5** Add comparison table
  - Simple 3-column comparison of the presets
  - Risk level, expected APY range, best for whom

- [ ] **2.6** Remove "How it works" verbose banner
  - Replace with compact tooltip on "?" icon
  - Keep page focused and action-oriented

---

### Phase 3: Portfolios Page Enhancement
**File:** `src/app/app/vaults/page.tsx`

- [ ] **3.1** Add "Create & Earn 20%" hero banner
  ```tsx
  <CreatorHeroBanner />
  ```
  - Prominent banner at very top (before leaderboard)
  - Eye-catching gradient, large "20%" number
  - "Create your portfolio. Others copy. You earn 20% of their gains."
  - CTA button: "Start Earning →"

- [ ] **3.2** Enhance Leaderboard component
  - Add rank badges (🥇🥈🥉 + numeric for 4-10)
  - Show creator verification badges more prominently
  - Add "Copy Strategy" quick button on each leaderboard item

- [ ] **3.3** Add Creator Spotlight section
  ```tsx
  <CreatorSpotlight />
  ```
  - Featured creator of the week/month
  - Interview-style quote or strategy description
  - Social proof: "Earned $X for 500+ followers"

- [ ] **3.4** Enhance creator profile cards
  - Add verified badge types (🔵 Verified, ⭐ Top Creator, 🏆 Champion)
  - Show historical performance chart thumbnail
  - Quick-view of allocation pie chart

- [ ] **3.5** Move "Create Your Portfolio" CTA higher
  - Currently at bottom of page
  - Move to immediately after leaderboard
  - Make more prominent with animated border

- [ ] **3.6** Add "Why Create?" benefits section
  - Bullet points with icons:
    - 💰 Earn 20% of follower gains
    - 📈 Build your reputation
    - 🎯 Full control over allocations
    - 🔗 Share your unique link

- [ ] **3.7** Rename page in navigation
  - Current: "Portfolios" with "NEW" badge
  - Change to: "Social Trading" or keep "Portfolios" but remove badge (now core feature)

---

### Phase 4: Navigation & Cross-Page CTAs
**File:** `src/components/layout/Sidebar.tsx`

- [ ] **4.1** Reorder navigation items
  ```tsx
  // Current order: Dashboard, Fund, Lend, Borrow, Pools, Markets, Portfolios, Profile
  // New order:
  { href: '/app', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/app/fund', label: 'Fund', icon: Wallet },
  { href: '/app/pools', label: 'Quick Start', icon: Zap }, // Renamed + new icon
  { href: '/app/markets', label: 'Research', icon: BarChart3 }, // Renamed
  { href: '/app/vaults', label: 'Social Trading', icon: Users }, // Renamed
  { href: '/app/lend', label: 'Lend', icon: PiggyBank },
  { href: '/app/borrow', label: 'Borrow', icon: Landmark },
  { href: '/app/profile', label: 'Profile', icon: User },
  ```

- [ ] **4.2** Add nav item descriptions on hover
  - Quick Start: "3 simple strategies"
  - Research: "Analyze GM pools"
  - Social Trading: "Copy top traders"

---

### Phase 5: New Components to Create
**Directory:** `src/components/ui/`

- [ ] **5.1** Create `CTABanner.tsx`
  - Reusable component for cross-page CTAs
  - Props: title, description, primaryAction, secondaryAction, gradient

- [ ] **5.2** Create `FeatureComparison.tsx`
  - Table component for comparing strategies/options
  - Used in Pools page for preset comparison

- [ ] **5.3** Create `CreatorBadge.tsx`
  - Standardized badge component for verification levels
  - Types: verified, topCreator, champion, newCreator

**Directory:** `src/components/markets/`

- [ ] **5.4** Create `MarketsCTABanner.tsx`
  - Specific CTA banner for Markets page
  - Two-button layout (Pools / Portfolios)

**Directory:** `src/components/portfolios/`

- [ ] **5.5** Create `CreatorHeroBanner.tsx`
  - 20% earnings banner with animated gradient
  - Large CTA button

- [ ] **5.6** Create `CreatorSpotlight.tsx`
  - Featured creator card with expanded info

---

### Phase 6: User Flow Updates

- [ ] **6.1** Add query param support for pool pre-selection
  - Markets → Pools: `/app/pools?pool=BTC/USD`
  - Markets → Portfolios: `/app/vaults?create=true&pools=BTC/USD,ETH/USD`

- [ ] **6.2** Add "Back to Research" link on Pools/Portfolios
  - Small breadcrumb-style link for users who came from Markets

- [ ] **6.3** Post-deposit success screen CTAs
  - Pools: "Want more control? Try Portfolios →"
  - Portfolios deposit: "Enjoying this? Create your own portfolio →"

---

## File Changes Summary

| File | Changes |
|------|---------|
| `src/app/app/markets/page.tsx` | Remove deposit buttons, add CTA banner, update copy |
| `src/app/app/pools/page.tsx` | Remove individual pools, simplify to presets only, add Portfolio CTA |
| `src/app/app/vaults/page.tsx` | Add creator hero banner, enhance leaderboard, add spotlight section |
| `src/components/layout/Sidebar.tsx` | Reorder nav, rename items, add hover descriptions |
| `src/components/ui/CTABanner.tsx` | NEW: Reusable CTA component |
| `src/components/ui/FeatureComparison.tsx` | NEW: Comparison table component |
| `src/components/ui/CreatorBadge.tsx` | NEW: Badge component |
| `src/components/markets/MarketsCTABanner.tsx` | NEW: Markets-specific CTA |
| `src/components/portfolios/CreatorHeroBanner.tsx` | NEW: 20% earnings banner |
| `src/components/portfolios/CreatorSpotlight.tsx` | NEW: Featured creator section |

---

## User Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         LANDING PAGE                            │
│                    "Start Earning Today"                        │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                         DASHBOARD                               │
│              Overview of all positions & earnings               │
└──────┬────────────────────┬─────────────────────┬───────────────┘
       │                    │                     │
       ▼                    ▼                     ▼
┌──────────────┐   ┌────────────────┐   ┌─────────────────────────┐
│   MARKETS    │   │    POOLS       │   │      PORTFOLIOS         │
│  (Research)  │   │ (Quick Start)  │   │   (Social Trading)      │
├──────────────┤   ├────────────────┤   ├─────────────────────────┤
│ • Browse all │   │ 🛡️ Safe Yield │   │ 👑 Leaderboard          │
│   GM pools   │   │ ⚖️ Balanced    │   │ 📊 Copy top traders     │
│ • Analytics  │   │ 🔥 Aggressive  │   │ 🎯 Create & earn 20%    │
│ • No deposit │   │               │   │                         │
├──────────────┤   ├────────────────┤   ├─────────────────────────┤
│ CTAs:        │   │ CTA:           │   │ CTA:                    │
│ → Pools      │   │ → Portfolios   │   │ → Create Portfolio      │
│ → Portfolios │   │   (advanced)   │   │                         │
└──────────────┘   └────────────────┘   └─────────────────────────┘
       │                    │                     │
       └────────────────────┴─────────────────────┘
                            │
                            ▼
                    User deposits & earns
```

---

## Priority Order

1. **High Priority (Do First)**
   - Phase 2: Pools simplification (biggest UX impact)
   - Phase 3.1: Creator hero banner (drives creator adoption)
   - Phase 4.1: Navigation reorder

2. **Medium Priority**
   - Phase 1: Markets cleanup
   - Phase 3.2-3.4: Portfolios enhancements
   - Phase 5: New components

3. **Lower Priority (Polish)**
   - Phase 6: Query params and flows
   - Phase 4.2: Nav hover descriptions
   - Phase 3.5-3.7: Additional Portfolios features

---

## Success Metrics

After implementation, track:
- [ ] Reduced bounce rate on Markets page
- [ ] Increased Pools → deposit conversion
- [ ] Increased Portfolio creation rate
- [ ] Reduced support tickets about "where to deposit"
- [ ] Time to first deposit (target: < 2 min via Pools)

---

## Notes

- All changes are UI-only (no backend changes required)
- Maintain existing functionality, just reorganize
- Keep mobile responsiveness in mind for all new components
- Use existing design system (glass-card, btn-primary, etc.)

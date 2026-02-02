# Creator Rebalance Guardrails Specification

## Overview

When a creator rebalances their portfolio strategy, followers need to understand what happens to their copied positions. This document outlines the UX flow and options for handling portfolio rebalancing events.

## The Problem

When a creator modifies their portfolio allocations (e.g., sells 50% BTC to buy SOL), followers who are copying that strategy need to decide whether to:
1. Automatically follow the new allocation
2. Approve the changes manually
3. Opt out of the rebalance

## Options Spec

### Option A: Auto-Rebalance with Delay
Followers automatically rebalance after a configurable delay period.

**UX Flow:**
1. Creator initiates rebalance in their portfolio
2. System displays preview of changes (which tokens, percentages)
3. Creator confirms rebalance
4. Followers receive notification: "Creator has rebalanced. Your portfolio will automatically update in 24 hours."
5. During the delay period, followers can:
   - Review the changes
   - Click "Apply Now" to expedite
   - Click "Opt Out" to stop copying
6. After delay, followers' positions auto-update to match creator's new allocation

**Pros:**
- Hands-off experience for passive followers
- Creator's strategy remains synchronized
- Simple UX

**Cons:**
- Followers may be caught off-guard by major changes
- Potential for losses if rebalance happens during market movement
- Less control for risk-averse followers

**Settings:**
- Default delay: 24 hours (configurable: 1h, 6h, 24h, 48h)
- Can be overridden per-follower

### Option B: Manual Approval Required
Followers must explicitly approve each rebalance before it takes effect.

**UX Flow:**
1. Creator initiates rebalance
2. System displays preview of changes
3. Creator confirms rebalance
4. Followers receive push notification: "CryptoKing has proposed portfolio changes. Tap to review."
5. Follower sees "Review Changes" screen showing:
   - Old allocation vs new allocation
   - Estimated impact on their portfolio
   - Estimated gas cost (if applicable)
   - "Approve Changes" button
   - "Decline & Unfollow" button
6. Follower must actively approve within 72 hours or the request expires

**Pros:**
- Maximum follower control
- Transparency about all changes
- Followers can decline unwanted strategy shifts

**Cons:**
- Requires active engagement from followers
- Strategy drift may occur if approvals lag
- Higher friction in following

### Option C: Hybrid - Opt-In Preference
Followers choose their preference upfront: Auto-Follow or Manual Approval.

**UX Flow:**
At time of following a creator:
1. Follower sees creator's current strategy
2. Follower chooses rebalance preference:
   - **[Recommended] Auto-follow rebalances** - Automatically sync with creator's portfolio changes
   - **Manual approval** - I want to approve each rebalance myself
3. Preference is saved and can be changed anytime in settings
4. When creator rebalances:
   - Auto-followers: Apply changes immediately (or with short 1h delay for safety)
   - Manual approvers: Receive notification and must approve

**Pros:**
- Respects different risk tolerances
- Clear upfront choice
- Reduces friction for passive followers who opt-in to auto-follow
- Still protects those who want control

**Cons:**
- More complex settings UI
- May have "approval fatigue" for manual approvers
- Initial onboarding step adds friction

## Recommended Approach: Option C (Hybrid)

We recommend implementing the **Hybrid model** as the default because it:
1. Respects user autonomy and risk preferences
2. Allows hands-off copying for passive investors
3. Maintains transparency for active investors
4. Is consistent with Web3 principles of user control

### Implementation Details

#### User Preference Settings
```
Settings > Copy Trading > Rebalance Preference
├── [ ] Auto-follow rebalances (recommended)
└── [ ] Manual approval required for each rebalance
```

#### Notification System
- Push notifications for both modes (configurable)
- In-app notification center
- Email notifications (opt-in)

#### Rebalance Preview UI
When creator proposes changes:
```
┌─────────────────────────────────────────────┐
│  ⚠️ Portfolio Rebalance Proposed            │
├─────────────────────────────────────────────┤
│  Creator: CryptoKing                        │
│                                             │
│  Your current allocation:                   │
│  • BTC: 50% → 30% (-20%)                    │
│  • ETH: 30% → 50% (+20%)                    │
│  • SOL: 20% → 20% (unchanged)               │
│                                             │
│  Estimated impact on your $1,000:           │
│  • -$200 from BTC                           │
│  • +$200 to ETH                             │
│                                             │
│  [ Apply Now ]  [ Review in 24h ]           │
└─────────────────────────────────────────────┘
```

#### Conflict Resolution
If market moves significantly during pending rebalance:
- Auto-followers: Changes apply at current market rates
- Manual approvers: Shown updated preview with current rates, must re-approve

### Technical Considerations

1. **Event Tracking**
   - Track rebalance events on-chain or in database
   - Timestamp each event
   - Store pending rebalances for manual approvers

2. **Notification Delivery**
   - Push notifications via wallet provider or platform
   - In-app notifications stored in database
   - Retry logic for failed notifications

3. **State Synchronization**
   - Follower positions stored separately from creator
   - Rebalance events trigger position reconciliation
   - Handle edge cases (insufficient balance, gas limits)

4. **Analytics**
   - Track approval/decline rates per creator
   - Monitor auto-follow vs manual approval adoption
   - A/B test delay periods and messaging

## Future Enhancements

1. **Smart Rebalancing**
   - Time-weighted average price (TWAP) execution
   - Slippage protection settings
   - Partial fills with retry logic

2. **Advanced Preferences**
   - "Auto-follow only if change < X%"
   - "Notify me but auto-apply after Y hours"
   - Whitelist specific rebalance types (e.g., only allocation changes, not token swaps)

3. **Creator Controls**
   - Minimum follower tier for auto-follow
   - Require KYC verification for auto-follow
   - Set rebalance frequency limits

4. **Emergency Unfollow**
   - Quick exit during rebalance if user disagrees
   - Partial unfollow (stop copying specific positions)
   - One-click unfollow with position unwinding

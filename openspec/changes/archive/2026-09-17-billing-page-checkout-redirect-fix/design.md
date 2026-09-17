## Context

`apps/saas/modules/payments/components/PricingTable.tsx` is used by `/settings/billing` and calls the oRPC `payments.createCheckoutLink` procedure (`packages/api/modules/payments/procedures/create-checkout-link.ts`), which resolves a provider price ID via `getProviderPriceIdByPlanId` from `packages/payments/lib/provider-price-ids.ts`. `packages/payments/config.ts` defines `plans["startkiter-mvp"]` with no `priceId` on its price entry, so this lookup always fails — confirmed by the `site-wide-functional-qa-sweep` SR's BUG-02 finding (404 from `createCheckoutLink`, caught and given a Toast error message but not fixed at the root).

The product's actual, working purchase flow is `apps/saas/app/(authenticated)/checkout/page.tsx` + `checkout-button.tsx`, which calls a separate PAYUNi-backed endpoint and is already live (confirmed via `userHasCourseAccess` gating and existing PAYUNi webhook/notify routes under `apps/saas/app/api/payuni/`).

## Goals / Non-Goals

**Goals:**
- Billing page purchase action reaches a checkout flow that actually works (PAYUNi via `/checkout`).
- Already-entitled users see an owned state on the billing page instead of a purchase button that would double-charge conceptually.

**Non-Goals:**
- See proposal Non-Goals: no removal of the Stripe/LemonSqueezy/Creem/DodoPayments provider code or the `apps/saas/app/api/stripe` webhook in this change.
- No change to `/checkout`'s own logic, `CheckoutButton`, PAYUNi integration, or the checkout-gateway settings page.

## Decisions

### Redirect, don't wire up priceId
Configuring a real `priceId` would mean actually integrating Stripe (or another Western provider) as a second, parallel payment path for a product that only sells through PAYUNi. That's a far larger scope than fixing a broken button. Redirecting to the already-working `/checkout` page is the minimal correct fix.

### Reuse `/checkout`'s own entitlement check, don't duplicate its logic
`userHasCourseAccess` already exists and is used by `/checkout/page.tsx` to decide "已擁有 → link to /course" vs "not entitled → show CheckoutButton". The billing page's fix SHALL call the same function rather than re-implementing an equivalent check, to avoid the two pages drifting out of sync on what "entitled" means.

## Implementation Contract

**Behavior**: On `/settings/billing`, the plan action area no longer triggers `createCheckoutLink`. A user without course access sees a button/link that navigates to `/checkout`. A user with course access sees an owned-state indicator and a link to `/course`, mirroring `/checkout/page.tsx`'s own entitled-state rendering.

**Interface / data shape**: `PricingTable.tsx` (or the `/settings/billing` page itself, per whichever layer the implementer determines is the correct boundary — the plan-action button's `onClick`/`href` no longer calls the `payments.createCheckoutLink` oRPC mutation for the `startkiter-mvp` plan; it becomes a `Link`/navigation to `/checkout` instead. The existing `notifyCheckoutError`/Toast error path added by the prior QA-sweep fix becomes dead code for this specific button once the mutation call is removed — the implementer SHALL confirm whether it is still reachable from any other code path before deciding whether to remove it (do not remove speculatively without checking).

**Failure modes**: None new — navigation to `/checkout` cannot fail the way an API call can; any failure at that point is already `/checkout`'s existing, already-tested failure handling.

**Acceptance criteria**:
- A test confirms: billing page renders a link/button to `/checkout` for a non-entitled user, and does not render a call to `createCheckoutLink`.
- A test confirms: billing page renders an owned-state + link to `/course` for an entitled user (`userHasCourseAccess` returns true).
- No test or manual check should find the "結帳失敗" Toast reachable from the billing page's plan action anymore, since the failing call is gone.
- `pnpm test` (full monorepo) passes, including `@startkiter/saas`.

**Scope boundaries**: In scope — the billing page's plan-action wiring only. Out of scope — anything under `packages/payments/provider/`, the Stripe webhook route, `/checkout` itself, coupon/subscription features.

## Risks / Trade-offs

[The billing page's UI copy (plan name, price, feature bullets) currently comes from `paymentsConfig.plans`, which is shared with the now-bypassed checkout-link flow] -> Keep that display logic as-is; this change only touches the action/navigation behavior of the button, not the plan display, so the visual content stays consistent with what the user already sees on `/checkout`.

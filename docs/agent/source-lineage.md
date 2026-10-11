# StartKiter Source Lineage

## Reusable sources

| Source | Relationship | Rule |
| --- | --- | --- |
| Existing StartKiter packages | AUTHORITATIVE | Reuse current contracts and tests first |
| `supastarter-nextjs-main` | EXTRACTED foundation | Do not modify source repo |
| `THE-TU-Project/dev/thetu` | REFERENCE／EXTRACTED legacy business logic | Do not copy without a scoped SR |
| `8-外掛/line-hub` | REFERENCE for LINE web OAuth contract | Do not modify source repo |
| Systeme.io dashboard | REFERENCE_ONLY | Extract workflow and information architecture; do not copy brand or implementation |

## Current data authorities

- Identity：Better Auth／User／Account／Session。
- Team boundary：Organization／Member／Invitation。
- Course access：Course／Bundle／Purchase／CourseSubscription。
- Commerce：Order／PaymentWebhookEvent／Invoice。
- Marketing：Newsletter*／EmailConsentLog／EmailDeliveryLog。
- Support：SupportTicket。

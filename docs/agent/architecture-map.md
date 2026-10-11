# StartKiter Architecture Map

## Runtime layers

```text
apps/saas UI
  ↓
oRPC procedures / route handlers
  ↓
domain packages
  ↓
Prisma/PostgreSQL + transactional events
  ↓
provider adapters: PAYUNi / invoice / email / LINE / future SMS
```

## Future creator-platform boundary

- Platform shell owns workspace context, capability resolution, navigation and shared page states.
- Domain packages own business rules and public package contracts.
- `apps/saas` composes pages and does not own domain decisions.
- External providers are adapters with normalized outcomes, idempotency and retry state.
- Existing Course, Order, Invoice, Newsletter and Support models remain authoritative until a migration contract says otherwise.

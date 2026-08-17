## REMOVED Requirements

### Requirement: Chinese text renders with a CJK font fallback

**Reason**: This requirement assumed the "DM Sans + Noto Sans TC fallback" font strategy from the archived `extract-supastarter-design-system` change. Rebuilding from `vendor/supastarter-nextjs/` and `docs/reference/supastarter-nextjs-docs/customization/styling.mdx` shows the SaaS app in the source project uses Inter exclusively (DM Sans is reserved for the marketing app's headings, which StartKiter does not have as a separate app). StartKiter's font strategy changes to Inter-only for apps/saas, relying on the system font-family fallback chain (`ui-sans-serif, system-ui`) for CJK glyph coverage instead of an explicitly declared CJK fallback font.

**Migration**: No explicit CJK fallback font is declared going forward. If Chinese text rendering quality issues are observed after the Inter-only migration, they SHALL be addressed in a separate change rather than by reintroducing this requirement.

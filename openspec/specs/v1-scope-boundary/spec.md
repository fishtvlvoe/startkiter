# v1-scope-boundary Specification

## Purpose

TBD - created by archiving change 'mvp-test-scope'. Update Purpose after archive.

## Requirements

### Requirement: v1 take-home capabilities

A completed MVP take-home SHALL include Traditional Chinese public pages, an authenticated area, email/password auth, Google login, LINE login, PAYUNi one-time TWD checkout, an in-site course module, GitHub kit claim, and a site-agent with two read-only tools. Complete code with unused modules present but not required to finish first purchase is a valid MVP shape.

#### Scenario: Site boots without payment keys

- **WHEN** an operator deploys with no PAYUNi keys configured
- **THEN** the public pages MUST boot and MUST NOT return HTTP 500

#### Scenario: Currency is TWD

- **WHEN** the MVP price is stored for checkout
- **THEN** the currency MUST be TWD and the amount MUST be 8800


<!-- @trace
source: mvp-test-scope
updated: 2026-08-14
code:
  - .docs/launch-course-research/text/docs__getting-started__payment-shopline.txt
  - .docs/launch-course-research/text/docs__getting-started__full-deployment.txt
  - .docs/supastarter-research/pages/windsurf-boilerplate.md
  - .docs/supastarter-research/pages/google-antigravity-boilerplate.md
  - .docs/market-research/text/threads-search-vibe-payment.txt
  - .docs/market-research/MARKET-VALIDATION.md
  - .docs/supastarter-research/pages/saas-boilerplate-vs-building-from-scratch.md
  - .docs/supastarter-research/text/supastarter-vs-shipfast.txt
  - .docs/launch-course-research/text/docs.txt
  - .docs/launch-course-research/pages/docs__getting-started__einvoice-setup.md
  - docs/discuss/v1-boundary.md
  - .docs/supastarter-research/pages/legal__license.md
  - .docs/supastarter-research/ANALYSIS.md
  - .docs/supastarter-research/pages/showcase.md
  - .docs/launch-course-research/faq-expanded.md
  - .docs/supastarter-research/pages/changelog.md
  - .docs/supastarter-research/pages/docs__nextjs__organizations__overview.md.md
  - .docs/supastarter-research/pages/showcase__affonso.md
  - .docs/launch-course-research/pages/account.md
  - .docs/launch-course-research/text/docs__features__lesson-editor.txt
  - .docs/supastarter-research/pages/docs__nextjs__authentication__overview.md.md
  - .docs/supastarter-research/pages/docs__nextjs__deployment__overview.md.md
  - .docs/supastarter-research/text/saas-idea-validator.txt
  - .docs/launch-course-research/pages/docs__getting-started__platform-introduction.md
  - .docs/supastarter-research/pages/saas-ideas.md
  - .docs/launch-course-research/text/terms.txt
  - .docs/supastarter-research/pages/legal__terms-of-service.md
  - .docs/supastarter-research/pages/docs__nextjs__payments__overview.md.md
  - .docs/supastarter-research/pages/cline-boilerplate.md
  - .docs/launch-course-research/manifest.json
  - .docs/launch-course-research/pages/docs__vibe-coding__vibe-coding-guide.md
  - .docs/supastarter-research/pages/kiro-boilerplate.md
  - .docs/supastarter-research/pages/showcase__transgull.md
  - .docs/launch-course-research/pages/docs__getting-started__payment-shopline.md
  - .docs/supastarter-research/pages/legal__acceptable-use.md
  - .docs/market-research/text/threads-after-enter.txt
  - .docs/launch-course-research/pages/home.md
  - .docs/launch-course-research/pages/docs__getting-started__full-deployment.md
  - .docs/supastarter-research/pages/saas-idea-validator.md
  - .docs/supastarter-research/pages/cursor-boilerplate.md
  - .docs/launch-course-research/text/docs__getting-started__platform-tour.txt
  - .docs/launch-course-research/README.md
  - .docs/launch-course-research/text/docs__getting-started__einvoice-setup.txt
  - .docs/supastarter-research/pages/dev-tips.md
  - .docs/supastarter-research/pages/showcase__screenshot-scout.md
  - .docs/supastarter-research/pages/supastarter-vs-makerkit.md
  - .docs/launch-course-research/ANALYSIS.md
  - .docs/COMBINED.md
  - .docs/launch-course-research/text/privacy.txt
  - .docs/supastarter-research/pages/showcase__peekalink.md
  - .docs/launch-course-research/text/docs__vibe-coding__vibe-coding-guide.txt
  - .docs/supastarter-research/pages/best-nextjs-boilerplate-2026.md
  - .docs/supastarter-research/pages/legal__privacy-policy.md
  - .docs/launch-course-research/pages/docs__features__media-center.md
  - AGENTS.md
  - .docs/supastarter-research/pages/claude-code-boilerplate.md
  - .docs/launch-course-research/pages/docs__getting-started__post-deploy-setup.md
  - .docs/market-research/text/threads-vibe-coding-jinliu.txt
  - .docs/launch-course-research/text/docs__features__course-creation-and-pricing.txt
  - .docs/supastarter-research/pages/tools.md
  - .docs/supastarter-research/pages/boilerplates-and-stacks.md
  - .docs/supastarter-research/pages/showcase__release-rocket.md
  - .docs/supastarter-research/pages/docs__nextjs__internationalization.md
  - .docs/launch-course-research/text/docs__getting-started__post-deploy-setup.txt
  - .docs/launch-course-research/pages/docs__features__course-creation-and-pricing.md
  - .docs/supastarter-research/README.md
  - .docs/supastarter-research/pages/best-saas-boilerplate-2026.md
  - .docs/supastarter-research/pages/tanstack-start.md
  - .docs/supastarter-research/text/tools.txt
  - .docs/supastarter-research/manifest.json
  - .docs/supastarter-research/pages/faq.md
  - .docs/launch-course-research/text/home.txt
  - .docs/supastarter-research/text/how-to-build-a-saas.txt
  - .docs/launch-course-research/text/docs__features__order-management.txt
  - .docs/supastarter-research/pages/nextjs.md
  - .docs/launch-course-research/text/docs__features__coupons-and-promotions.txt
  - .docs/launch-course-research/text/docs__getting-started__platform-introduction.txt
  - README.md
  - .docs/supastarter-research/pages/github-copilot-boilerplate.md
  - .docs/supastarter-research/pages/showcase__seowly.md
  - .docs/launch-course-research/pages/docs__features__order-management.md
  - .docs/supastarter-research/pages/showcase__ntree.md
  - .docs/supastarter-research/pages/agents-md-for-saas.md
  - .docs/supastarter-research/pages/supastarter-vs-shipfast.md
  - .docs/launch-course-research/pages/docs__getting-started__platform-tour.md
  - .docs/market-research/text/threads-posts.json
  - .docs/supastarter-research/pages/home.md
  - .docs/supastarter-research/pages/showcase__team-skill-set.md
  - .docs/launch-course-research/pages/docs__features__lesson-editor.md
  - .docs/supastarter-research/pages/saas-boilerplate.md
  - .docs/market-research/README.md
  - .docs/supastarter-research/pages/showcase__freel.md
  - .docs/market-research/text/threads-search-vibe-coding.txt
  - .docs/supastarter-research/pages/showcase__postel.md
  - .docs/launch-course-research/pages/privacy.md
  - .docs/supastarter-research/pages/nuxt.md
  - .docs/launch-course-research/text/__pricing.txt
  - .docs/launch-course-research/pages/docs__features__coupons-and-promotions.md
  - .docs/supastarter-research/pages/showcase__autosetter.md
  - .docs/supastarter-research/pages/codex-boilerplate.md
  - .docs/supastarter-research/pages/showcase__auftakt.md
  - .docs/launch-course-research/text/account.txt
  - .docs/supastarter-research/faq-expanded.md
  - .docs/launch-course-research/pages/__pricing.md
  - .docs/supastarter-research/pages/nextjs-ai-coding-agents-boilerplate.md
  - .docs/supastarter-research/pages/docs__nextjs.md.md
  - .docs/market-research/text/threads-search-ai-charge.txt
  - .docs/supastarter-research/pages/legal__disclaimer.md
  - .docs/launch-course-research/pages/docs.md
  - .docs/launch-course-research/text/docs__features__media-center.txt
  - .docs/supastarter-research/pages/llms.txt.md
  - .docs/supastarter-research/pages/best-saas-ideas.md
  - .docs/launch-course-research/pages/terms.md
  - .docs/supastarter-research/pages/blog.md
  - .docs/supastarter-research/pages/how-to-build-a-saas.md
  - .docs/supastarter-research/pages/docs__nextjs__setup.md.md
-->

---
### Requirement: Allowed extract sources

MVP SHALL extract the SaaS shell from supastarter-nextjs-main (apps/saas, Better Auth, packages/ai, zh-TW). MVP SHALL extract PAYUNi and order abstractions from THE-TU-Project/dev/thetu. MVP SHALL extract course playback and access UI from THE-TU-Project/dev/thetu as a module. LINE login SHALL be new work using Better Auth socialProviders.line and LINE Login Channel credentials. LINE PHP clients, LIFF, and Messaging API MUST NOT be ported. GitHub kit invite SHALL be new work using the GitHub API.

#### Scenario: LINE login uses Login Channel only

- **WHEN** a student configures LINE
- **THEN** the product MUST accept LINE Login Channel ID and Channel Secret and MUST NOT require a Messaging API token to sign in

##### Example: 老師設定 LINE Login Channel

- 老師在後台填入 LINE_CHANNEL_ID=1234567890、LINE_CHANNEL_SECRET=abcd1234efgh5678（Login Channel 憑證）
- 系統不要求填寫 Messaging API 的 Channel Access Token，學員即可完成 LINE 登入

#### Scenario: Missing LINE email is allowed

- **WHEN** LINE id_token contains no email
- **THEN** account linking MUST key off LINE userId and MUST NOT fail solely because email is empty

##### Example: 學員未授權 email 仍可登入

- 學員 LINE userId=U1234567890abcdef 完成登入，id_token 不含 email 欄位
- 系統以 userId=U1234567890abcdef 建立/連結帳號，登入不因缺少 email 而失敗


<!-- @trace
source: mvp-test-scope
updated: 2026-08-14
code:
  - .docs/launch-course-research/text/docs__getting-started__payment-shopline.txt
  - .docs/launch-course-research/text/docs__getting-started__full-deployment.txt
  - .docs/supastarter-research/pages/windsurf-boilerplate.md
  - .docs/supastarter-research/pages/google-antigravity-boilerplate.md
  - .docs/market-research/text/threads-search-vibe-payment.txt
  - .docs/market-research/MARKET-VALIDATION.md
  - .docs/supastarter-research/pages/saas-boilerplate-vs-building-from-scratch.md
  - .docs/supastarter-research/text/supastarter-vs-shipfast.txt
  - .docs/launch-course-research/text/docs.txt
  - .docs/launch-course-research/pages/docs__getting-started__einvoice-setup.md
  - docs/discuss/v1-boundary.md
  - .docs/supastarter-research/pages/legal__license.md
  - .docs/supastarter-research/ANALYSIS.md
  - .docs/supastarter-research/pages/showcase.md
  - .docs/launch-course-research/faq-expanded.md
  - .docs/supastarter-research/pages/changelog.md
  - .docs/supastarter-research/pages/docs__nextjs__organizations__overview.md.md
  - .docs/supastarter-research/pages/showcase__affonso.md
  - .docs/launch-course-research/pages/account.md
  - .docs/launch-course-research/text/docs__features__lesson-editor.txt
  - .docs/supastarter-research/pages/docs__nextjs__authentication__overview.md.md
  - .docs/supastarter-research/pages/docs__nextjs__deployment__overview.md.md
  - .docs/supastarter-research/text/saas-idea-validator.txt
  - .docs/launch-course-research/pages/docs__getting-started__platform-introduction.md
  - .docs/supastarter-research/pages/saas-ideas.md
  - .docs/launch-course-research/text/terms.txt
  - .docs/supastarter-research/pages/legal__terms-of-service.md
  - .docs/supastarter-research/pages/docs__nextjs__payments__overview.md.md
  - .docs/supastarter-research/pages/cline-boilerplate.md
  - .docs/launch-course-research/manifest.json
  - .docs/launch-course-research/pages/docs__vibe-coding__vibe-coding-guide.md
  - .docs/supastarter-research/pages/kiro-boilerplate.md
  - .docs/supastarter-research/pages/showcase__transgull.md
  - .docs/launch-course-research/pages/docs__getting-started__payment-shopline.md
  - .docs/supastarter-research/pages/legal__acceptable-use.md
  - .docs/market-research/text/threads-after-enter.txt
  - .docs/launch-course-research/pages/home.md
  - .docs/launch-course-research/pages/docs__getting-started__full-deployment.md
  - .docs/supastarter-research/pages/saas-idea-validator.md
  - .docs/supastarter-research/pages/cursor-boilerplate.md
  - .docs/launch-course-research/text/docs__getting-started__platform-tour.txt
  - .docs/launch-course-research/README.md
  - .docs/launch-course-research/text/docs__getting-started__einvoice-setup.txt
  - .docs/supastarter-research/pages/dev-tips.md
  - .docs/supastarter-research/pages/showcase__screenshot-scout.md
  - .docs/supastarter-research/pages/supastarter-vs-makerkit.md
  - .docs/launch-course-research/ANALYSIS.md
  - .docs/COMBINED.md
  - .docs/launch-course-research/text/privacy.txt
  - .docs/supastarter-research/pages/showcase__peekalink.md
  - .docs/launch-course-research/text/docs__vibe-coding__vibe-coding-guide.txt
  - .docs/supastarter-research/pages/best-nextjs-boilerplate-2026.md
  - .docs/supastarter-research/pages/legal__privacy-policy.md
  - .docs/launch-course-research/pages/docs__features__media-center.md
  - AGENTS.md
  - .docs/supastarter-research/pages/claude-code-boilerplate.md
  - .docs/launch-course-research/pages/docs__getting-started__post-deploy-setup.md
  - .docs/market-research/text/threads-vibe-coding-jinliu.txt
  - .docs/launch-course-research/text/docs__features__course-creation-and-pricing.txt
  - .docs/supastarter-research/pages/tools.md
  - .docs/supastarter-research/pages/boilerplates-and-stacks.md
  - .docs/supastarter-research/pages/showcase__release-rocket.md
  - .docs/supastarter-research/pages/docs__nextjs__internationalization.md
  - .docs/launch-course-research/text/docs__getting-started__post-deploy-setup.txt
  - .docs/launch-course-research/pages/docs__features__course-creation-and-pricing.md
  - .docs/supastarter-research/README.md
  - .docs/supastarter-research/pages/best-saas-boilerplate-2026.md
  - .docs/supastarter-research/pages/tanstack-start.md
  - .docs/supastarter-research/text/tools.txt
  - .docs/supastarter-research/manifest.json
  - .docs/supastarter-research/pages/faq.md
  - .docs/launch-course-research/text/home.txt
  - .docs/supastarter-research/text/how-to-build-a-saas.txt
  - .docs/launch-course-research/text/docs__features__order-management.txt
  - .docs/supastarter-research/pages/nextjs.md
  - .docs/launch-course-research/text/docs__features__coupons-and-promotions.txt
  - .docs/launch-course-research/text/docs__getting-started__platform-introduction.txt
  - README.md
  - .docs/supastarter-research/pages/github-copilot-boilerplate.md
  - .docs/supastarter-research/pages/showcase__seowly.md
  - .docs/launch-course-research/pages/docs__features__order-management.md
  - .docs/supastarter-research/pages/showcase__ntree.md
  - .docs/supastarter-research/pages/agents-md-for-saas.md
  - .docs/supastarter-research/pages/supastarter-vs-shipfast.md
  - .docs/launch-course-research/pages/docs__getting-started__platform-tour.md
  - .docs/market-research/text/threads-posts.json
  - .docs/supastarter-research/pages/home.md
  - .docs/supastarter-research/pages/showcase__team-skill-set.md
  - .docs/launch-course-research/pages/docs__features__lesson-editor.md
  - .docs/supastarter-research/pages/saas-boilerplate.md
  - .docs/market-research/README.md
  - .docs/supastarter-research/pages/showcase__freel.md
  - .docs/market-research/text/threads-search-vibe-coding.txt
  - .docs/supastarter-research/pages/showcase__postel.md
  - .docs/launch-course-research/pages/privacy.md
  - .docs/supastarter-research/pages/nuxt.md
  - .docs/launch-course-research/text/__pricing.txt
  - .docs/launch-course-research/pages/docs__features__coupons-and-promotions.md
  - .docs/supastarter-research/pages/showcase__autosetter.md
  - .docs/supastarter-research/pages/codex-boilerplate.md
  - .docs/supastarter-research/pages/showcase__auftakt.md
  - .docs/launch-course-research/text/account.txt
  - .docs/supastarter-research/faq-expanded.md
  - .docs/launch-course-research/pages/__pricing.md
  - .docs/supastarter-research/pages/nextjs-ai-coding-agents-boilerplate.md
  - .docs/supastarter-research/pages/docs__nextjs.md.md
  - .docs/market-research/text/threads-search-ai-charge.txt
  - .docs/supastarter-research/pages/legal__disclaimer.md
  - .docs/launch-course-research/pages/docs.md
  - .docs/launch-course-research/text/docs__features__media-center.txt
  - .docs/supastarter-research/pages/llms.txt.md
  - .docs/supastarter-research/pages/best-saas-ideas.md
  - .docs/launch-course-research/pages/terms.md
  - .docs/supastarter-research/pages/blog.md
  - .docs/supastarter-research/pages/how-to-build-a-saas.md
  - .docs/supastarter-research/pages/docs__nextjs__setup.md.md
-->

---
### Requirement: Forbidden extract targets

MVP SHALL NOT include: THE-TU newsletter, coupon, NextAuth, or Apple flows; Lemon Squeezy, Polar, Dodo, or Creem as cashiers; Organization, Member, or Invitation tenancy tables; passkeys or two-factor; any libon.me source. Course playback UI from THE-TU is allowed. Site-agent is allowed. GitHub OAuth for kit claim is allowed.

#### Scenario: Organization tables are absent

- **WHEN** the MVP database schema is created
- **THEN** it MUST NOT introduce organization, member, or invitation tables and billing MUST attach to user

##### Example: schema 檢查無組織表

- 檢查 Prisma schema／migration 檔 → 不存在 organization、member、invitation 資料表
- 訂單表 orders 的付款人欄位直接關聯 user_id=usr_001，不經過任何 organization 中介表

#### Scenario: Libon source is absent

- **WHEN** the StartKiter tree is searched for copied libon.me application source
- **THEN** that source MUST NOT be present

##### Example: repo 搜尋無 libon 原始碼

- 執行 `grep -ril "libon" apps/` 搜尋 StartKiter 程式碼樹
- 結果不應出現任何 libon.me 應用程式原始碼檔案


<!-- @trace
source: mvp-test-scope
updated: 2026-08-14
code:
  - .docs/launch-course-research/text/docs__getting-started__payment-shopline.txt
  - .docs/launch-course-research/text/docs__getting-started__full-deployment.txt
  - .docs/supastarter-research/pages/windsurf-boilerplate.md
  - .docs/supastarter-research/pages/google-antigravity-boilerplate.md
  - .docs/market-research/text/threads-search-vibe-payment.txt
  - .docs/market-research/MARKET-VALIDATION.md
  - .docs/supastarter-research/pages/saas-boilerplate-vs-building-from-scratch.md
  - .docs/supastarter-research/text/supastarter-vs-shipfast.txt
  - .docs/launch-course-research/text/docs.txt
  - .docs/launch-course-research/pages/docs__getting-started__einvoice-setup.md
  - docs/discuss/v1-boundary.md
  - .docs/supastarter-research/pages/legal__license.md
  - .docs/supastarter-research/ANALYSIS.md
  - .docs/supastarter-research/pages/showcase.md
  - .docs/launch-course-research/faq-expanded.md
  - .docs/supastarter-research/pages/changelog.md
  - .docs/supastarter-research/pages/docs__nextjs__organizations__overview.md.md
  - .docs/supastarter-research/pages/showcase__affonso.md
  - .docs/launch-course-research/pages/account.md
  - .docs/launch-course-research/text/docs__features__lesson-editor.txt
  - .docs/supastarter-research/pages/docs__nextjs__authentication__overview.md.md
  - .docs/supastarter-research/pages/docs__nextjs__deployment__overview.md.md
  - .docs/supastarter-research/text/saas-idea-validator.txt
  - .docs/launch-course-research/pages/docs__getting-started__platform-introduction.md
  - .docs/supastarter-research/pages/saas-ideas.md
  - .docs/launch-course-research/text/terms.txt
  - .docs/supastarter-research/pages/legal__terms-of-service.md
  - .docs/supastarter-research/pages/docs__nextjs__payments__overview.md.md
  - .docs/supastarter-research/pages/cline-boilerplate.md
  - .docs/launch-course-research/manifest.json
  - .docs/launch-course-research/pages/docs__vibe-coding__vibe-coding-guide.md
  - .docs/supastarter-research/pages/kiro-boilerplate.md
  - .docs/supastarter-research/pages/showcase__transgull.md
  - .docs/launch-course-research/pages/docs__getting-started__payment-shopline.md
  - .docs/supastarter-research/pages/legal__acceptable-use.md
  - .docs/market-research/text/threads-after-enter.txt
  - .docs/launch-course-research/pages/home.md
  - .docs/launch-course-research/pages/docs__getting-started__full-deployment.md
  - .docs/supastarter-research/pages/saas-idea-validator.md
  - .docs/supastarter-research/pages/cursor-boilerplate.md
  - .docs/launch-course-research/text/docs__getting-started__platform-tour.txt
  - .docs/launch-course-research/README.md
  - .docs/launch-course-research/text/docs__getting-started__einvoice-setup.txt
  - .docs/supastarter-research/pages/dev-tips.md
  - .docs/supastarter-research/pages/showcase__screenshot-scout.md
  - .docs/supastarter-research/pages/supastarter-vs-makerkit.md
  - .docs/launch-course-research/ANALYSIS.md
  - .docs/COMBINED.md
  - .docs/launch-course-research/text/privacy.txt
  - .docs/supastarter-research/pages/showcase__peekalink.md
  - .docs/launch-course-research/text/docs__vibe-coding__vibe-coding-guide.txt
  - .docs/supastarter-research/pages/best-nextjs-boilerplate-2026.md
  - .docs/supastarter-research/pages/legal__privacy-policy.md
  - .docs/launch-course-research/pages/docs__features__media-center.md
  - AGENTS.md
  - .docs/supastarter-research/pages/claude-code-boilerplate.md
  - .docs/launch-course-research/pages/docs__getting-started__post-deploy-setup.md
  - .docs/market-research/text/threads-vibe-coding-jinliu.txt
  - .docs/launch-course-research/text/docs__features__course-creation-and-pricing.txt
  - .docs/supastarter-research/pages/tools.md
  - .docs/supastarter-research/pages/boilerplates-and-stacks.md
  - .docs/supastarter-research/pages/showcase__release-rocket.md
  - .docs/supastarter-research/pages/docs__nextjs__internationalization.md
  - .docs/launch-course-research/text/docs__getting-started__post-deploy-setup.txt
  - .docs/launch-course-research/pages/docs__features__course-creation-and-pricing.md
  - .docs/supastarter-research/README.md
  - .docs/supastarter-research/pages/best-saas-boilerplate-2026.md
  - .docs/supastarter-research/pages/tanstack-start.md
  - .docs/supastarter-research/text/tools.txt
  - .docs/supastarter-research/manifest.json
  - .docs/supastarter-research/pages/faq.md
  - .docs/launch-course-research/text/home.txt
  - .docs/supastarter-research/text/how-to-build-a-saas.txt
  - .docs/launch-course-research/text/docs__features__order-management.txt
  - .docs/supastarter-research/pages/nextjs.md
  - .docs/launch-course-research/text/docs__features__coupons-and-promotions.txt
  - .docs/launch-course-research/text/docs__getting-started__platform-introduction.txt
  - README.md
  - .docs/supastarter-research/pages/github-copilot-boilerplate.md
  - .docs/supastarter-research/pages/showcase__seowly.md
  - .docs/launch-course-research/pages/docs__features__order-management.md
  - .docs/supastarter-research/pages/showcase__ntree.md
  - .docs/supastarter-research/pages/agents-md-for-saas.md
  - .docs/supastarter-research/pages/supastarter-vs-shipfast.md
  - .docs/launch-course-research/pages/docs__getting-started__platform-tour.md
  - .docs/market-research/text/threads-posts.json
  - .docs/supastarter-research/pages/home.md
  - .docs/supastarter-research/pages/showcase__team-skill-set.md
  - .docs/launch-course-research/pages/docs__features__lesson-editor.md
  - .docs/supastarter-research/pages/saas-boilerplate.md
  - .docs/market-research/README.md
  - .docs/supastarter-research/pages/showcase__freel.md
  - .docs/market-research/text/threads-search-vibe-coding.txt
  - .docs/supastarter-research/pages/showcase__postel.md
  - .docs/launch-course-research/pages/privacy.md
  - .docs/supastarter-research/pages/nuxt.md
  - .docs/launch-course-research/text/__pricing.txt
  - .docs/launch-course-research/pages/docs__features__coupons-and-promotions.md
  - .docs/supastarter-research/pages/showcase__autosetter.md
  - .docs/supastarter-research/pages/codex-boilerplate.md
  - .docs/supastarter-research/pages/showcase__auftakt.md
  - .docs/launch-course-research/text/account.txt
  - .docs/supastarter-research/faq-expanded.md
  - .docs/launch-course-research/pages/__pricing.md
  - .docs/supastarter-research/pages/nextjs-ai-coding-agents-boilerplate.md
  - .docs/supastarter-research/pages/docs__nextjs.md.md
  - .docs/market-research/text/threads-search-ai-charge.txt
  - .docs/supastarter-research/pages/legal__disclaimer.md
  - .docs/launch-course-research/pages/docs.md
  - .docs/launch-course-research/text/docs__features__media-center.txt
  - .docs/supastarter-research/pages/llms.txt.md
  - .docs/supastarter-research/pages/best-saas-ideas.md
  - .docs/launch-course-research/pages/terms.md
  - .docs/supastarter-research/pages/blog.md
  - .docs/supastarter-research/pages/how-to-build-a-saas.md
  - .docs/supastarter-research/pages/docs__nextjs__setup.md.md
-->

---
### Requirement: Payments and invoice policy

The primary MVP payment gateway SHALL be PAYUNi using one-time TWD checkout. Shopline and Stripe MUST NOT collect MVP funds. Polar MUST NOT collect MVP funds and MUST NOT be required to invite GitHub collaborators. MVP SHALL sell one-time TWD purchases only. Payment secrets SHALL be stored in admin settings with environment-variable fallback. Unconfigured payment checkout MUST fail closed without HTTP 500. E-invoice SHALL stay out of MVP.

#### Scenario: Unconfigured checkout fails closed

- **WHEN** a user starts checkout and PAYUNi keys are missing
- **THEN** POST /api/checkout MUST return HTTP 503 with an explicit configuration error and MUST NOT return HTTP 500

#### Scenario: Invoice is not in MVP

- **WHEN** a PAYUNi payment succeeds
- **THEN** the system MUST NOT require carrier, tax ID, or donation fields and MUST NOT call an invoice provider

##### Example: 付款成功不觸發發票流程

- 訂單 order_id=ord_8800_001 的 PAYUNi 付款成功
- 系統不要求填寫發票載具、統一編號或捐贈碼欄位，也不呼叫任何電子發票 API

#### Scenario: Polar is not a cashier

- **WHEN** a change proposes charging the MVP SKU through Polar
- **THEN** the change MUST be rejected

##### Example: 用 Polar 收款的提案被拒絕

- 有人提出 change proposal「改用 Polar 收 MVP SKU 8800 元」
- 該提案在 SDD review 階段被拒絕，理由為 Polar 不得作為 MVP 收款方


<!-- @trace
source: mvp-test-scope
updated: 2026-08-14
code:
  - .docs/launch-course-research/text/docs__getting-started__payment-shopline.txt
  - .docs/launch-course-research/text/docs__getting-started__full-deployment.txt
  - .docs/supastarter-research/pages/windsurf-boilerplate.md
  - .docs/supastarter-research/pages/google-antigravity-boilerplate.md
  - .docs/market-research/text/threads-search-vibe-payment.txt
  - .docs/market-research/MARKET-VALIDATION.md
  - .docs/supastarter-research/pages/saas-boilerplate-vs-building-from-scratch.md
  - .docs/supastarter-research/text/supastarter-vs-shipfast.txt
  - .docs/launch-course-research/text/docs.txt
  - .docs/launch-course-research/pages/docs__getting-started__einvoice-setup.md
  - docs/discuss/v1-boundary.md
  - .docs/supastarter-research/pages/legal__license.md
  - .docs/supastarter-research/ANALYSIS.md
  - .docs/supastarter-research/pages/showcase.md
  - .docs/launch-course-research/faq-expanded.md
  - .docs/supastarter-research/pages/changelog.md
  - .docs/supastarter-research/pages/docs__nextjs__organizations__overview.md.md
  - .docs/supastarter-research/pages/showcase__affonso.md
  - .docs/launch-course-research/pages/account.md
  - .docs/launch-course-research/text/docs__features__lesson-editor.txt
  - .docs/supastarter-research/pages/docs__nextjs__authentication__overview.md.md
  - .docs/supastarter-research/pages/docs__nextjs__deployment__overview.md.md
  - .docs/supastarter-research/text/saas-idea-validator.txt
  - .docs/launch-course-research/pages/docs__getting-started__platform-introduction.md
  - .docs/supastarter-research/pages/saas-ideas.md
  - .docs/launch-course-research/text/terms.txt
  - .docs/supastarter-research/pages/legal__terms-of-service.md
  - .docs/supastarter-research/pages/docs__nextjs__payments__overview.md.md
  - .docs/supastarter-research/pages/cline-boilerplate.md
  - .docs/launch-course-research/manifest.json
  - .docs/launch-course-research/pages/docs__vibe-coding__vibe-coding-guide.md
  - .docs/supastarter-research/pages/kiro-boilerplate.md
  - .docs/supastarter-research/pages/showcase__transgull.md
  - .docs/launch-course-research/pages/docs__getting-started__payment-shopline.md
  - .docs/supastarter-research/pages/legal__acceptable-use.md
  - .docs/market-research/text/threads-after-enter.txt
  - .docs/launch-course-research/pages/home.md
  - .docs/launch-course-research/pages/docs__getting-started__full-deployment.md
  - .docs/supastarter-research/pages/saas-idea-validator.md
  - .docs/supastarter-research/pages/cursor-boilerplate.md
  - .docs/launch-course-research/text/docs__getting-started__platform-tour.txt
  - .docs/launch-course-research/README.md
  - .docs/launch-course-research/text/docs__getting-started__einvoice-setup.txt
  - .docs/supastarter-research/pages/dev-tips.md
  - .docs/supastarter-research/pages/showcase__screenshot-scout.md
  - .docs/supastarter-research/pages/supastarter-vs-makerkit.md
  - .docs/launch-course-research/ANALYSIS.md
  - .docs/COMBINED.md
  - .docs/launch-course-research/text/privacy.txt
  - .docs/supastarter-research/pages/showcase__peekalink.md
  - .docs/launch-course-research/text/docs__vibe-coding__vibe-coding-guide.txt
  - .docs/supastarter-research/pages/best-nextjs-boilerplate-2026.md
  - .docs/supastarter-research/pages/legal__privacy-policy.md
  - .docs/launch-course-research/pages/docs__features__media-center.md
  - AGENTS.md
  - .docs/supastarter-research/pages/claude-code-boilerplate.md
  - .docs/launch-course-research/pages/docs__getting-started__post-deploy-setup.md
  - .docs/market-research/text/threads-vibe-coding-jinliu.txt
  - .docs/launch-course-research/text/docs__features__course-creation-and-pricing.txt
  - .docs/supastarter-research/pages/tools.md
  - .docs/supastarter-research/pages/boilerplates-and-stacks.md
  - .docs/supastarter-research/pages/showcase__release-rocket.md
  - .docs/supastarter-research/pages/docs__nextjs__internationalization.md
  - .docs/launch-course-research/text/docs__getting-started__post-deploy-setup.txt
  - .docs/launch-course-research/pages/docs__features__course-creation-and-pricing.md
  - .docs/supastarter-research/README.md
  - .docs/supastarter-research/pages/best-saas-boilerplate-2026.md
  - .docs/supastarter-research/pages/tanstack-start.md
  - .docs/supastarter-research/text/tools.txt
  - .docs/supastarter-research/manifest.json
  - .docs/supastarter-research/pages/faq.md
  - .docs/launch-course-research/text/home.txt
  - .docs/supastarter-research/text/how-to-build-a-saas.txt
  - .docs/launch-course-research/text/docs__features__order-management.txt
  - .docs/supastarter-research/pages/nextjs.md
  - .docs/launch-course-research/text/docs__features__coupons-and-promotions.txt
  - .docs/launch-course-research/text/docs__getting-started__platform-introduction.txt
  - README.md
  - .docs/supastarter-research/pages/github-copilot-boilerplate.md
  - .docs/supastarter-research/pages/showcase__seowly.md
  - .docs/launch-course-research/pages/docs__features__order-management.md
  - .docs/supastarter-research/pages/showcase__ntree.md
  - .docs/supastarter-research/pages/agents-md-for-saas.md
  - .docs/supastarter-research/pages/supastarter-vs-shipfast.md
  - .docs/launch-course-research/pages/docs__getting-started__platform-tour.md
  - .docs/market-research/text/threads-posts.json
  - .docs/supastarter-research/pages/home.md
  - .docs/supastarter-research/pages/showcase__team-skill-set.md
  - .docs/launch-course-research/pages/docs__features__lesson-editor.md
  - .docs/supastarter-research/pages/saas-boilerplate.md
  - .docs/market-research/README.md
  - .docs/supastarter-research/pages/showcase__freel.md
  - .docs/market-research/text/threads-search-vibe-coding.txt
  - .docs/supastarter-research/pages/showcase__postel.md
  - .docs/launch-course-research/pages/privacy.md
  - .docs/supastarter-research/pages/nuxt.md
  - .docs/launch-course-research/text/__pricing.txt
  - .docs/launch-course-research/pages/docs__features__coupons-and-promotions.md
  - .docs/supastarter-research/pages/showcase__autosetter.md
  - .docs/supastarter-research/pages/codex-boilerplate.md
  - .docs/supastarter-research/pages/showcase__auftakt.md
  - .docs/launch-course-research/text/account.txt
  - .docs/supastarter-research/faq-expanded.md
  - .docs/launch-course-research/pages/__pricing.md
  - .docs/supastarter-research/pages/nextjs-ai-coding-agents-boilerplate.md
  - .docs/supastarter-research/pages/docs__nextjs.md.md
  - .docs/market-research/text/threads-search-ai-charge.txt
  - .docs/supastarter-research/pages/legal__disclaimer.md
  - .docs/launch-course-research/pages/docs.md
  - .docs/launch-course-research/text/docs__features__media-center.txt
  - .docs/supastarter-research/pages/llms.txt.md
  - .docs/supastarter-research/pages/best-saas-ideas.md
  - .docs/launch-course-research/pages/terms.md
  - .docs/supastarter-research/pages/blog.md
  - .docs/supastarter-research/pages/how-to-build-a-saas.md
  - .docs/supastarter-research/pages/docs__nextjs__setup.md.md
-->

---
### Requirement: Four-lesson SHOPLINE path is not MVP

MVP SHALL NOT use a four-lesson unlock order keyed to SHOPLINE. Extract and teaching docs MUST follow the sellable-site path: sales page, PAYUNi, in-site course, GitHub claim, site-agent.

#### Scenario: SHOPLINE lesson-three proposal is rejected

- **WHEN** a later change proposes restoring lesson three as a SHOPLINE test payment as the MVP primary path
- **THEN** that change MUST be rejected in favor of PAYUNi checkout on the dogfood site

##### Example: 恢復 SHOPLINE 測試付款提案被拒絕

- 有人提出 change「用 SHOPLINE 1 元測試付款解鎖 lesson_03，作為 MVP 主要付款路徑」
- 該提案被拒絕，改採 PAYUNi 於 dogfood 站以 8800 元一次性結帳作為主路徑

<!-- @trace
source: mvp-test-scope
updated: 2026-08-14
code:
  - .docs/launch-course-research/text/docs__getting-started__payment-shopline.txt
  - .docs/launch-course-research/text/docs__getting-started__full-deployment.txt
  - .docs/supastarter-research/pages/windsurf-boilerplate.md
  - .docs/supastarter-research/pages/google-antigravity-boilerplate.md
  - .docs/market-research/text/threads-search-vibe-payment.txt
  - .docs/market-research/MARKET-VALIDATION.md
  - .docs/supastarter-research/pages/saas-boilerplate-vs-building-from-scratch.md
  - .docs/supastarter-research/text/supastarter-vs-shipfast.txt
  - .docs/launch-course-research/text/docs.txt
  - .docs/launch-course-research/pages/docs__getting-started__einvoice-setup.md
  - docs/discuss/v1-boundary.md
  - .docs/supastarter-research/pages/legal__license.md
  - .docs/supastarter-research/ANALYSIS.md
  - .docs/supastarter-research/pages/showcase.md
  - .docs/launch-course-research/faq-expanded.md
  - .docs/supastarter-research/pages/changelog.md
  - .docs/supastarter-research/pages/docs__nextjs__organizations__overview.md.md
  - .docs/supastarter-research/pages/showcase__affonso.md
  - .docs/launch-course-research/pages/account.md
  - .docs/launch-course-research/text/docs__features__lesson-editor.txt
  - .docs/supastarter-research/pages/docs__nextjs__authentication__overview.md.md
  - .docs/supastarter-research/pages/docs__nextjs__deployment__overview.md.md
  - .docs/supastarter-research/text/saas-idea-validator.txt
  - .docs/launch-course-research/pages/docs__getting-started__platform-introduction.md
  - .docs/supastarter-research/pages/saas-ideas.md
  - .docs/launch-course-research/text/terms.txt
  - .docs/supastarter-research/pages/legal__terms-of-service.md
  - .docs/supastarter-research/pages/docs__nextjs__payments__overview.md.md
  - .docs/supastarter-research/pages/cline-boilerplate.md
  - .docs/launch-course-research/manifest.json
  - .docs/launch-course-research/pages/docs__vibe-coding__vibe-coding-guide.md
  - .docs/supastarter-research/pages/kiro-boilerplate.md
  - .docs/supastarter-research/pages/showcase__transgull.md
  - .docs/launch-course-research/pages/docs__getting-started__payment-shopline.md
  - .docs/supastarter-research/pages/legal__acceptable-use.md
  - .docs/market-research/text/threads-after-enter.txt
  - .docs/launch-course-research/pages/home.md
  - .docs/launch-course-research/pages/docs__getting-started__full-deployment.md
  - .docs/supastarter-research/pages/saas-idea-validator.md
  - .docs/supastarter-research/pages/cursor-boilerplate.md
  - .docs/launch-course-research/text/docs__getting-started__platform-tour.txt
  - .docs/launch-course-research/README.md
  - .docs/launch-course-research/text/docs__getting-started__einvoice-setup.txt
  - .docs/supastarter-research/pages/dev-tips.md
  - .docs/supastarter-research/pages/showcase__screenshot-scout.md
  - .docs/supastarter-research/pages/supastarter-vs-makerkit.md
  - .docs/launch-course-research/ANALYSIS.md
  - .docs/COMBINED.md
  - .docs/launch-course-research/text/privacy.txt
  - .docs/supastarter-research/pages/showcase__peekalink.md
  - .docs/launch-course-research/text/docs__vibe-coding__vibe-coding-guide.txt
  - .docs/supastarter-research/pages/best-nextjs-boilerplate-2026.md
  - .docs/supastarter-research/pages/legal__privacy-policy.md
  - .docs/launch-course-research/pages/docs__features__media-center.md
  - AGENTS.md
  - .docs/supastarter-research/pages/claude-code-boilerplate.md
  - .docs/launch-course-research/pages/docs__getting-started__post-deploy-setup.md
  - .docs/market-research/text/threads-vibe-coding-jinliu.txt
  - .docs/launch-course-research/text/docs__features__course-creation-and-pricing.txt
  - .docs/supastarter-research/pages/tools.md
  - .docs/supastarter-research/pages/boilerplates-and-stacks.md
  - .docs/supastarter-research/pages/showcase__release-rocket.md
  - .docs/supastarter-research/pages/docs__nextjs__internationalization.md
  - .docs/launch-course-research/text/docs__getting-started__post-deploy-setup.txt
  - .docs/launch-course-research/pages/docs__features__course-creation-and-pricing.md
  - .docs/supastarter-research/README.md
  - .docs/supastarter-research/pages/best-saas-boilerplate-2026.md
  - .docs/supastarter-research/pages/tanstack-start.md
  - .docs/supastarter-research/text/tools.txt
  - .docs/supastarter-research/manifest.json
  - .docs/supastarter-research/pages/faq.md
  - .docs/launch-course-research/text/home.txt
  - .docs/supastarter-research/text/how-to-build-a-saas.txt
  - .docs/launch-course-research/text/docs__features__order-management.txt
  - .docs/supastarter-research/pages/nextjs.md
  - .docs/launch-course-research/text/docs__features__coupons-and-promotions.txt
  - .docs/launch-course-research/text/docs__getting-started__platform-introduction.txt
  - README.md
  - .docs/supastarter-research/pages/github-copilot-boilerplate.md
  - .docs/supastarter-research/pages/showcase__seowly.md
  - .docs/launch-course-research/pages/docs__features__order-management.md
  - .docs/supastarter-research/pages/showcase__ntree.md
  - .docs/supastarter-research/pages/agents-md-for-saas.md
  - .docs/supastarter-research/pages/supastarter-vs-shipfast.md
  - .docs/launch-course-research/pages/docs__getting-started__platform-tour.md
  - .docs/market-research/text/threads-posts.json
  - .docs/supastarter-research/pages/home.md
  - .docs/supastarter-research/pages/showcase__team-skill-set.md
  - .docs/launch-course-research/pages/docs__features__lesson-editor.md
  - .docs/supastarter-research/pages/saas-boilerplate.md
  - .docs/market-research/README.md
  - .docs/supastarter-research/pages/showcase__freel.md
  - .docs/market-research/text/threads-search-vibe-coding.txt
  - .docs/supastarter-research/pages/showcase__postel.md
  - .docs/launch-course-research/pages/privacy.md
  - .docs/supastarter-research/pages/nuxt.md
  - .docs/launch-course-research/text/__pricing.txt
  - .docs/launch-course-research/pages/docs__features__coupons-and-promotions.md
  - .docs/supastarter-research/pages/showcase__autosetter.md
  - .docs/supastarter-research/pages/codex-boilerplate.md
  - .docs/supastarter-research/pages/showcase__auftakt.md
  - .docs/launch-course-research/text/account.txt
  - .docs/supastarter-research/faq-expanded.md
  - .docs/launch-course-research/pages/__pricing.md
  - .docs/supastarter-research/pages/nextjs-ai-coding-agents-boilerplate.md
  - .docs/supastarter-research/pages/docs__nextjs.md.md
  - .docs/market-research/text/threads-search-ai-charge.txt
  - .docs/supastarter-research/pages/legal__disclaimer.md
  - .docs/launch-course-research/pages/docs.md
  - .docs/launch-course-research/text/docs__features__media-center.txt
  - .docs/supastarter-research/pages/llms.txt.md
  - .docs/supastarter-research/pages/best-saas-ideas.md
  - .docs/launch-course-research/pages/terms.md
  - .docs/supastarter-research/pages/blog.md
  - .docs/supastarter-research/pages/how-to-build-a-saas.md
  - .docs/supastarter-research/pages/docs__nextjs__setup.md.md
-->
---
url: https://supastarter.dev/docs/nextjs/authentication/overview.md
content_type: text/plain; charset=utf-8
bytes: 2402
---

supastarter provides a complete authentication system powered by [better-auth](https://better-auth.com), a modern and flexible authentication library for TypeScript applications. It includes pre-built UI for login, signup, password reset, email verification, and OAuth social login — all ready to use out of the box.

The auth UI and auth routes are part of `apps/saas`.

Authentication pages use the following routes:

- `/login`
- `/signup`
- `/forgot-password`
- `/reset-password`
- `/verify`

Public auth redirects use the SaaS app URL, so make sure `NEXT_PUBLIC_SAAS_URL` points to your deployed SaaS app.

<Cards>
  <Card
    title="User and session"
    href="/docs/nextjs/authentication/user-and-session"
    target="_self"
  />
  <Card title="oAuth" href="/docs/nextjs/authentication/oauth" target="_self" />
  <Card
    title="Permissions and access control"
    href="/docs/nextjs/authentication/permissions"
    target="_self"
  />
  <Card
    title="Superadmin & Admin UI"
    href="/docs/nextjs/authentication/superadmin"
    target="_self"
  />
</Cards>

## Frequently asked questions

### What authentication provider does supastarter use?

supastarter uses [better-auth](https://better-auth.com), a modern TypeScript authentication library. better-auth stores user data directly in your database (via Prisma or Drizzle), giving you full control over your user data without depending on third-party auth services like Auth0 or Clerk.

### Can I use social logins like Google, GitHub, or Apple?

Yes. supastarter supports OAuth social logins through better-auth. You can enable Google, GitHub, Apple, and many other OAuth providers by configuring the provider credentials in your environment variables. See the [OAuth guide](/docs/nextjs/authentication/oauth) for setup instructions.

### How do I add a new OAuth provider?

Adding a new OAuth provider involves registering your application with the provider to get client ID and secret, then configuring the provider in your better-auth configuration. The [OAuth documentation](/docs/nextjs/authentication/oauth) walks you through this process step by step.

### Does supastarter support magic link or passwordless login?

Yes. better-auth supports magic link (email-based) authentication. supastarter includes the email verification flow and can be configured for passwordless login by sending a magic link to the user's email address.
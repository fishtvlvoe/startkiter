▋ 版本落差

來源改用 `/Users/fishtv/Development/products/startkiter/code/supastarter-nextjs-main`（舊 Development 根路徑已搬走）。StartKiter 值取 `apps/saas/package.json` 與 `packages/ui/package.json`；supastarter 值取 `pnpm-workspace.yaml` 的 catalog。

| 套件 | StartKiter | supastarter | 狀態 |
| next | 16.2.12 | ^16.2.12 | 相同 |
| react | 19.2.8 | 19.2.8 | 相同 |
| tailwindcss | 未安裝 | 4.3.3 | StartKiter 較舊 |
| radix-ui | 未安裝 | ^1.6.7 | StartKiter 較舊 |

移植元件前必須把 `tailwindcss@4.3.3` 與 `radix-ui@^1.6.7`（以及 Button/Form 會用到的 `class-variance-authority`、`lucide-react`、`tailwind-merge`、`@tailwindcss/postcss`）裝進 StartKiter。Next.js 與 React 版本對得上，不用為這兩套降級或升級。

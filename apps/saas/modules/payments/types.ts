import type { config } from "@startkiter/payments/config";

export type PlanId = keyof typeof config.plans;

import type { PaymentsConfig } from "./types";

export const config: PaymentsConfig = {
	billingAttachedTo: "user",
	requireActiveSubscription: false,
	plans: {
		"startkiter-mvp": {
			recommended: true,
			prices: [
				{
					type: "one-time",
					amount: 8800,
					currency: "TWD",
				},
			],
		},
	},
};

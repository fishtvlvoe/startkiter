"use client";

import { usePlanData } from "@payments/hooks/plan-data";
import { config as paymentsConfig } from "@startkiter/payments/config";
import type { PaidPlan } from "@startkiter/payments/types";
import { cn } from "@startkiter/ui";
import { Button } from "@startkiter/ui/components/button";
import { Tabs, TabsList, TabsTrigger } from "@startkiter/ui/components/tabs";
import { useLocaleCurrency } from "@shared/hooks/locale-currency";
import { useRouter } from "@shared/hooks/router";
import { ArrowRightIcon, BadgePercentIcon, CheckIcon, StarIcon } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import Link from "next/link";
import { useState } from "react";

const plans = paymentsConfig.plans;

export function PricingTable({
	className,
	userId,
	organizationId,
	activePlanId,
}: {
	className?: string;
	userId?: string;
	organizationId?: string;
	activePlanId?: string;
}) {
	const t = useTranslations();
	const format = useFormatter();
	const router = useRouter();
	const localeCurrency = useLocaleCurrency();
	const [interval, setInterval] = useState<"month" | "year">("month");

	const { planData } = usePlanData();

	const filteredPlans = Object.entries(plans).filter(([planId]) => planId !== activePlanId);

	const hasSubscriptions = filteredPlans.some(([_, plan]) =>
		"prices" in plan
			? (plan as PaidPlan).prices.some((price) => price.type === "subscription")
			: false,
	);

	const canPurchase = Boolean(userId || organizationId);

	return (
		<div className={cn("@container", className)}>
			{hasSubscriptions && (
				<div className="mb-6 flex justify-center">
					<Tabs
						value={interval}
						onValueChange={(value) => setInterval(value as typeof interval)}
						data-test="price-table-interval-tabs"
					>
						<TabsList className="border-foreground/10">
							<TabsTrigger value="month">{t("pricing.monthly")}</TabsTrigger>
							<TabsTrigger value="year">{t("pricing.yearly")}</TabsTrigger>
						</TabsList>
					</Tabs>
				</div>
			)}
			<div
				className={cn("gap-4 grid grid-cols-1", {
					"@xl:grid-cols-2": filteredPlans.length >= 2,
					"@3xl:grid-cols-3": filteredPlans.length >= 3,
					"@4xl:grid-cols-4": filteredPlans.length >= 4,
				})}
			>
				{filteredPlans.map(([planId, plan]) => {
					const isEnterprise = "isEnterprise" in plan ? plan.isEnterprise : false;
					const prices = "prices" in plan ? (plan as PaidPlan).prices : undefined;
					const recommended = plan.recommended ?? false;
					const hidden = plan.hidden ?? false;

					const planDataEntry = planData[planId as keyof typeof planData];

					if (!planDataEntry) {
						return null;
					}

					const { title, description, features } = planDataEntry;

					const price = prices?.find(
						(price) =>
							!hidden &&
							(price.type === "one-time" || price.interval === interval) &&
							price.currency === localeCurrency,
					);

					if (!price && !isEnterprise) {
						return null;
					}

					return (
						<div
							key={planId}
							className={cn("p-6 rounded-3xl border bg-card", {
								"border-touch bg-touch/6": recommended,
							})}
							data-test="price-table-plan"
						>
							<div className="gap-4 flex h-full flex-col justify-between">
								<div>
									{recommended && (
										<div className="-mt-9 flex justify-center">
											<div className="mb-2 h-6 gap-1.5 px-2 py-1 font-semibold text-xs flex w-auto items-center rounded-full bg-touch text-touch-foreground">
												<StarIcon className="size-3" />
												{t("pricing.recommended")}
											</div>
										</div>
									)}
									<h3
										className={cn("my-0 font-semibold text-2xl", {
											"font-bold text-touch": recommended,
										})}
									>
										{title}
									</h3>
									{description && (
										<div className="prose mt-2 text-sm text-foreground/60">{description}</div>
									)}

									{!!features?.length && (
										<ul className="mt-4 gap-2 text-sm grid list-none">
											{features.map((feature, key) => (
												<li key={key} className="flex items-center justify-start">
													<CheckIcon className="mr-2 size-4 text-touch" />
													<span>{feature}</span>
												</li>
											))}
										</ul>
									)}

									{price && "trialPeriodDays" in price && price.trialPeriodDays && (
										<div className="mt-4 font-medium text-sm flex items-center justify-start text-touch opacity-80">
											<BadgePercentIcon className="mr-2 size-4" />
											{t("pricing.trialPeriod", {
												days: price.trialPeriodDays,
											})}
										</div>
									)}
								</div>

								<div>
									{price && (
										<strong
											className="font-medium text-2xl lg:text-3xl block"
											data-test="price-table-plan-price"
										>
											{format.number(price.amount, {
												style: "currency",
												currency: price.currency,
											})}
											{"interval" in price && (
												<span className="font-normal text-xs opacity-60">
													{" / "}
													{interval === "month"
														? t("pricing.month", {
																count: 1,
															})
														: t("pricing.year", {
																count: 1,
															})}
												</span>
											)}
											{organizationId && "seatBased" in price && price.seatBased && (
												<span className="font-normal text-xs opacity-60">
													{" / "}
													{t("pricing.perSeat")}
												</span>
											)}
										</strong>
									)}

									{canPurchase ? (
										<Button
											className="mt-4 w-full"
											variant={recommended ? "primary" : "secondary"}
											render={(props) => (
												<Link {...props} href="/checkout">
													{t("pricing.choosePlan")}
													<ArrowRightIcon className="ml-2 size-4" />
												</Link>
											)}
										/>
									) : (
										<Button
											className="mt-4 w-full"
											variant={recommended ? "primary" : "secondary"}
											onClick={() => router.push("/signup")}
										>
											{t("pricing.getStarted")}
											<ArrowRightIcon className="ml-2 size-4" />
										</Button>
									)}
								</div>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}

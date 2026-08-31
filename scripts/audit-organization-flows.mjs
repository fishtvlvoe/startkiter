#!/usr/bin/env node
/**
 * One-off Organization audit verification script.
 * Static source checks + simulated access-scope logic (no DB required).
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function read(relPath) {
	return readFileSync(resolve(root, relPath), "utf8");
}

function lineOf(source, pattern) {
	const lines = source.split("\n");
	const hits = [];
	for (let i = 0; i < lines.length; i++) {
		if (pattern.test(lines[i])) hits.push({ line: i + 1, text: lines[i].trim() });
	}
	return hits;
}

const checks = [];

function record(id, name, pass, detail) {
	checks.push({ id, name, pass, detail });
}

// --- 1. Create organization wiring ---
const createForm = read("apps/saas/modules/organizations/components/CreateOrganizationForm.tsx");
const createApi = read("apps/saas/modules/organizations/lib/api.ts");
record(
	"1.1",
	"CreateOrganizationForm calls authClient.organization.create",
	createForm.includes("createOrganizationMutation.mutateAsync") &&
		createApi.includes("authClient.organization.create"),
	`api.ts L92-96: authClient.organization.create; form L42-44 mutateAsync`,
);

// --- 4. Checkout organizationId ---
const checkoutRoute = read("apps/saas/app/api/checkout/route.ts");
const ordersLib = read("apps/saas/lib/orders.ts");
const checkoutOrgRefs = lineOf(checkoutRoute, /organizationId|activeOrganizationId/);
const ordersOrgRefs = lineOf(ordersLib, /organizationId|activeOrganizationId/);
record(
	"4.1",
	"Checkout route reads activeOrganizationId from session",
	checkoutOrgRefs.length > 0,
	checkoutOrgRefs.length
		? `Found refs: ${checkoutOrgRefs.map((h) => `L${h.line}`).join(", ")}`
		: "No organizationId/activeOrganizationId in apps/saas/app/api/checkout/route.ts",
);
record(
	"4.2",
	"createPendingOrderForUser writes Order.organizationId",
	ordersOrgRefs.some((h) => h.text.includes("organizationId")),
	ordersOrgRefs.length
		? `Refs: ${ordersOrgRefs.map((h) => `L${h.line}: ${h.text}`).join("; ")}`
		: "tx.order.create data block (L122-136) has no organizationId field",
);

// --- 5. Course access org member union ---
const ordersQuery = read("packages/database/prisma/queries/orders.ts");
const accessQueryHits = lineOf(ordersQuery, /organizationId|getOrganizationIdsForUser|accessScope/);
record(
	"5.1",
	"getCourseAccessOrdersForUser unions personal + org orders",
	ordersQuery.includes("getOrganizationIdsForUser") &&
		ordersQuery.includes('organizationId: { in: organizationIds }'),
	`orders.ts hits: ${accessQueryHits.map((h) => `L${h.line}`).join(", ")}`,
);

// Simulate accessScope (pure logic, mirrors orders.ts L12-18)
function accessScope(userId, organizationIds) {
	return {
		OR: [
			{ userId },
			...(organizationIds.length > 0 ? [{ organizationId: { in: organizationIds } }] : []),
		],
	};
}

const memberUserId = "member-user";
const buyerUserId = "buyer-user";
const orgId = "org-1";
const orgOrder = { userId: buyerUserId, organizationId: orgId, courseAccess: true };
const personalOrder = { userId: memberUserId, organizationId: null, courseAccess: true };

function userCanSeeOrder(userId, userOrgIds, order) {
	const scope = accessScope(userId, userOrgIds);
	return scope.OR.some((clause) => {
		if ("userId" in clause && clause.userId === order.userId) return true;
		if ("organizationId" in clause && order.organizationId && clause.organizationId.in.includes(order.organizationId))
			return true;
		return false;
	});
}

record(
	"5.2",
	"Sim: org member sees org-scoped order when organizationId is set",
	userCanSeeOrder(memberUserId, [orgId], orgOrder),
	`member in org-1 + order.organizationId=org-1 => visible`,
);
record(
	"5.3",
	"Sim: org member does NOT see buyer personal order (organizationId null)",
	!userCanSeeOrder(memberUserId, [orgId], personalOrder),
	`member in org-1 + order.userId=buyer, organizationId=null => NOT visible to member`,
);
record(
	"5.4",
	"Sim: removed member loses org order visibility",
	!userCanSeeOrder(memberUserId, [], orgOrder),
	`member with no org memberships cannot see org-scoped order`,
);

// --- payments config ---
const paymentsConfig = read("packages/payments/config.ts");
record(
	"4.3",
	"billingAttachedTo is organization (required for org checkout)",
	paymentsConfig.includes('billingAttachedTo: "organization"'),
	`Actual: ${paymentsConfig.match(/billingAttachedTo:\s*"[^"]+"/)?.[0] ?? "unknown"}`,
);

// --- Summary ---
const failed = checks.filter((c) => !c.pass);
console.log("\n=== Organization Audit Script Results ===\n");
for (const c of checks) {
	console.log(`${c.pass ? "PASS" : "FAIL"} [${c.id}] ${c.name}`);
	console.log(`       ${c.detail}\n`);
}
console.log(`Total: ${checks.length}, Passed: ${checks.length - failed.length}, Failed: ${failed.length}`);
process.exit(failed.length > 0 ? 1 : 0);

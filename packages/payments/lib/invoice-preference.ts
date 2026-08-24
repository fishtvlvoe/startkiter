import { z } from "zod";

export const invoicePreferenceSchema = z
	.object({
		invoiceType: z.enum(["PERSONAL", "COMPANY", "DONATION"]),
		carrierType: z.enum(["member", "mobile"]).default("member"),
		carrierId: z.string().trim().max(64).default(""),
		taxId: z.string().trim().default(""),
		title: z.string().trim().max(120).default(""),
		address: z.string().trim().max(240).default(""),
		loveCode: z.string().trim().default(""),
	})
	.superRefine((value, ctx) => {
		if (value.invoiceType === "COMPANY" && !/^\d{8}$/.test(value.taxId)) {
			ctx.addIssue({ code: "custom", path: ["taxId"], message: "公司發票需要 8 碼統一編號" });
		}
		if (value.invoiceType === "DONATION" && !/^\d{3,7}$/.test(value.loveCode)) {
			ctx.addIssue({ code: "custom", path: ["loveCode"], message: "捐贈發票需要 3 至 7 碼愛心碼" });
		}
		if (value.invoiceType === "PERSONAL" && value.carrierType === "mobile" && !/^\/[A-Z0-9.+-]{7}$/.test(value.carrierId)) {
			ctx.addIssue({ code: "custom", path: ["carrierId"], message: "手機條碼格式不正確" });
		}
	});

export type InvoicePreferenceInput = z.infer<typeof invoicePreferenceSchema>;

export function normalizeInvoicePreference(input: InvoicePreferenceInput | null | undefined): InvoicePreferenceInput {
	const parsed = invoicePreferenceSchema.safeParse(input ?? { invoiceType: "PERSONAL", carrierType: "member" });
	if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "發票偏好格式不正確");
	return parsed.data;
}

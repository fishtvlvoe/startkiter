"use client";

import type { InvoicePreferenceInput } from "@startkiter/payments";

export const DEFAULT_INVOICE_PREFERENCE: InvoicePreferenceInput = {
	invoiceType: "PERSONAL",
	carrierType: "member",
	carrierId: "",
	taxId: "",
	title: "",
	address: "",
	loveCode: "",
};

export function InvoicePreferenceFields({
	value,
	onChange,
}: {
	value: InvoicePreferenceInput;
	onChange: (next: InvoicePreferenceInput) => void;
}) {
	const update = (patch: Partial<InvoicePreferenceInput>) => onChange({ ...value, ...patch });

	return (
		<fieldset className="space-y-3 rounded-xl border p-4">
			<legend className="px-1 text-sm font-semibold">發票偏好</legend>
			<label className="grid gap-1 text-sm">
				<span>發票類型</span>
				<select className="border-input bg-background h-9 rounded-md border px-3" value={value.invoiceType} onChange={(event) => update({ invoiceType: event.target.value as InvoicePreferenceInput["invoiceType"] })}>
					<option value="PERSONAL">個人發票</option>
					<option value="COMPANY">公司三聯式</option>
					<option value="DONATION">捐贈發票</option>
				</select>
			</label>

			{value.invoiceType === "PERSONAL" && (
				<label className="grid gap-1 text-sm">
					<span>載具</span>
					<select className="border-input bg-background h-9 rounded-md border px-3" value={value.carrierType} onChange={(event) => update({ carrierType: event.target.value as InvoicePreferenceInput["carrierType"], carrierId: "" })}>
						<option value="member">會員載具（預設）</option>
						<option value="mobile">手機條碼</option>
					</select>
				</label>
			)}

			{value.invoiceType === "PERSONAL" && value.carrierType === "mobile" && (
				<label className="grid gap-1 text-sm">
					<span>手機條碼</span>
					<input className="border-input bg-background h-9 rounded-md border px-3" placeholder="/ABC1234" value={value.carrierId} onChange={(event) => update({ carrierId: event.target.value })} required />
				</label>
			)}

			{value.invoiceType === "COMPANY" && (
				<div className="grid gap-3 sm:grid-cols-2">
					<label className="grid gap-1 text-sm"><span>統一編號</span><input className="border-input bg-background h-9 rounded-md border px-3" inputMode="numeric" maxLength={8} value={value.taxId} onChange={(event) => update({ taxId: event.target.value })} required /></label>
					<label className="grid gap-1 text-sm"><span>公司抬頭</span><input className="border-input bg-background h-9 rounded-md border px-3" value={value.title} onChange={(event) => update({ title: event.target.value })} required /></label>
					<label className="grid gap-1 text-sm sm:col-span-2"><span>公司地址</span><input className="border-input bg-background h-9 rounded-md border px-3" value={value.address} onChange={(event) => update({ address: event.target.value })} required /></label>
				</div>
			)}

			{value.invoiceType === "DONATION" && (
				<label className="grid gap-1 text-sm"><span>愛心碼</span><input className="border-input bg-background h-9 rounded-md border px-3" inputMode="numeric" maxLength={7} value={value.loveCode} onChange={(event) => update({ loveCode: event.target.value })} required /></label>
			)}
		</fieldset>
	);
}

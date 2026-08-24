"use client";

import { Button } from "@startkiter/ui";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { orpcClient } from "@shared/lib/orpc-client";
import { useMutation } from "@tanstack/react-query";

export function InvoiceOperationsButtons({ invoice }: { invoice: { id: string; status: string; amount: number; allowanceTotal: number; invoiceDate: Date | null; canVoid: boolean } }) {
	const router = useRouter();
	const [confirm, setConfirm] = useState<"void" | "allowance" | null>(null);
	const [amount, setAmount] = useState(Math.max(0, invoice.amount - invoice.allowanceTotal));
	const voidMutation = useMutation({
		mutationFn: () => orpcClient.course.voidInvoice({ invoiceId: invoice.id }),
		onSuccess: () => { setConfirm(null); router.refresh(); },
	});
	const allowanceMutation = useMutation({
		mutationFn: () => orpcClient.course.issueInvoiceAllowance({ invoiceId: invoice.id, amount }),
		onSuccess: () => { setConfirm(null); router.refresh(); },
	});

	if (!["ISSUED", "ALLOWANCE"].includes(invoice.status)) return null;

	return (
		<div className="flex flex-wrap items-center gap-2">
			{invoice.status === "ISSUED" && !invoice.canVoid && <span className="text-xs text-amber-700">已跨月，請改用折讓。</span>}
			{invoice.status === "ISSUED" && (
				confirm === "void" ? (
					<span className="flex items-center gap-2 text-xs">同月作廢？<Button size="sm" variant="destructive" disabled={voidMutation.isPending} onClick={() => voidMutation.mutate()}>確認作廢</Button><Button size="sm" variant="outline" onClick={() => setConfirm(null)}>取消</Button></span>
				) : <Button size="sm" variant="outline" disabled={!invoice.canVoid} title={invoice.canVoid ? undefined : "發票已跨月，請改用折讓"} onClick={() => setConfirm("void")}>作廢發票</Button>
			)}
			{confirm === "allowance" ? (
				<span className="flex items-center gap-2 text-xs"><input className="h-8 w-24 rounded-md border px-2" type="number" min={1} max={invoice.amount - invoice.allowanceTotal} value={amount} onChange={(event) => setAmount(Number(event.target.value))} /><Button size="sm" disabled={allowanceMutation.isPending || amount <= 0} onClick={() => void allowanceMutation.mutate()}>確認折讓</Button><Button size="sm" variant="outline" onClick={() => setConfirm(null)}>取消</Button></span>
			) : <Button size="sm" variant="outline" onClick={() => setConfirm("allowance")}>開立折讓</Button>}
			{voidMutation.isError && <span className="text-xs text-destructive">作廢失敗</span>}
			{allowanceMutation.isError && <span className="text-xs text-destructive">折讓失敗</span>}
		</div>
	);
}

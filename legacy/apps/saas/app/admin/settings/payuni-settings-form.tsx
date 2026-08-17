"use client";

import { useEffect, useState } from "react";

type PayuniSettingsPublic = {
	merchantId: string;
	hashKeyMasked: string;
	hashIVMasked: string;
	apiUrl: string;
	source: "settings" | "env" | "none";
};

function sourceLabel(source: PayuniSettingsPublic["source"]) {
	if (source === "settings") {
		return "目前結帳走後台金鑰";
	}
	if (source === "env") {
		return "目前結帳走環境變數";
	}
	return "目前沒有可用的 PAYUNi 金鑰";
}

function errorMessage(code: string) {
	if (code === "encryption_key_required") {
		return "缺少 SETTINGS_ENCRYPTION_KEY，無法寫入後台金鑰。結帳若環境變數齊全仍可走 env。";
	}
	if (code === "invalid_hash_key") {
		return "Hash Key 必須是 32 個字。";
	}
	if (code === "invalid_hash_iv") {
		return "Hash IV 必須是 16 個字。";
	}
	if (code === "invalid_merchant_id") {
		return "商店代號不能是空白。";
	}
	if (code === "incomplete_payuni_settings") {
		return "第一次寫入需要商店代號、Hash Key 與 Hash IV。";
	}
	if (code === "forbidden" || code === "authentication_required") {
		return "沒有權限改金流設定。";
	}
	return "儲存失敗，請稍後再試。";
}

export function PayuniSettingsForm() {
	const [current, setCurrent] = useState<PayuniSettingsPublic | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [saved, setSaved] = useState(false);
	const [busy, setBusy] = useState(false);

	async function refresh() {
		const response = await fetch("/api/admin/settings/payuni");
		const payload = (await response.json()) as PayuniSettingsPublic & { error?: string };
		if (!response.ok) {
			throw new Error(payload.error || "load_failed");
		}
		setCurrent(payload);
	}

	useEffect(() => {
		refresh().catch(() => {
			setError("無法載入金流設定。");
		});
	}, []);

	async function submit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError(null);
		setSaved(false);
		setBusy(true);
		const values = new FormData(event.currentTarget);
		const merchantId = String(values.get("merchantId") || "").trim();
		const apiUrl = String(values.get("apiUrl") || "").trim();
		try {
			const response = await fetch("/api/admin/settings/payuni", {
				method: "PUT",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					...(merchantId ? { merchantId } : {}),
					hashKey: String(values.get("hashKey") || ""),
					hashIV: String(values.get("hashIV") || ""),
					...(apiUrl ? { apiUrl } : {}),
				}),
			});
			const payload = (await response.json()) as PayuniSettingsPublic & { error?: string };
			if (!response.ok) {
				setError(errorMessage(payload.error || "save_failed"));
				return;
			}
			setCurrent(payload);
			setSaved(true);
			event.currentTarget.reset();
		} catch {
			setError("網路異常，請稍後再試。");
		} finally {
			setBusy(false);
		}
	}

	async function clearSettings() {
		if (!window.confirm("確定清除後台 PAYUNi 金鑰、改走環境變數？")) {
			return;
		}
		setError(null);
		setSaved(false);
		setBusy(true);
		try {
			const response = await fetch("/api/admin/settings/payuni", {
				method: "PUT",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ clear: true }),
			});
			const payload = (await response.json()) as PayuniSettingsPublic & { error?: string };
			if (!response.ok) {
				setError(errorMessage(payload.error || "save_failed"));
				return;
			}
			setCurrent(payload);
			setSaved(true);
		} catch {
			setError("網路異常，請稍後再試。");
		} finally {
			setBusy(false);
		}
	}

	return (
		<div className="stack">
			{current ? <p className="callout" style={{ margin: 0 }}>{sourceLabel(current.source)}</p> : null}
			<form className="form" onSubmit={submit}>
				<label>
					商店代號
					<input
						name="merchantId"
						autoComplete="off"
						defaultValue={current?.merchantId ?? ""}
						key={current?.merchantId ?? "merchant-empty"}
					/>
				</label>
				<label>
					Hash Key
					<input
						name="hashKey"
						type="password"
						autoComplete="off"
						placeholder={current?.hashKeyMasked || "32 字；留空表示不改"}
					/>
				</label>
				<label>
					Hash IV
					<input
						name="hashIV"
						type="password"
						autoComplete="off"
						placeholder={current?.hashIVMasked || "16 字；留空表示不改"}
					/>
				</label>
				<label>
					API 網址
					<input
						name="apiUrl"
						autoComplete="off"
						placeholder="https://sandbox-api.payuni.com.tw/api/upp"
						defaultValue={current?.apiUrl ?? ""}
						key={current?.apiUrl ?? "api-empty"}
					/>
				</label>
				<div className="actions">
					<button className="button" type="submit" disabled={busy || !current}>
						儲存
					</button>
					<button className="button secondary" type="button" disabled={busy || !current} onClick={clearSettings}>
						清除後台金鑰
					</button>
				</div>
			</form>
			{error ? (
				<p className="error" role="alert">
					{error}
				</p>
			) : null}
			{saved ? <p className="muted">已更新。</p> : null}
		</div>
	);
}

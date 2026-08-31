import type { CheckResult } from "@startkiter/course/src/course-pack/check-registry";

const failureMessages: Record<Extract<CheckResult, { status: "failed" }>['reasonCode'], string> = {
	auth_error: "驗證失敗，請確認金鑰或權限。",
	network_error: "檢查服務暫時無法連線，請稍後再試。",
	not_found: "找不到指定資源，請確認設定。",
	unknown_check_id: "教案檢查設定有誤，請聯絡客服。",
};

export function MissionCheckResult({ result }: { result: CheckResult }) {
	if (result.status === "passed") {
		return (
			<p className="text-sm text-emerald-700" data-testid="mission-check-result" data-status="passed">
				檢查通過{result.detail ? `：${result.detail}` : "。"}
			</p>
		);
	}

	if (result.status === "pending") {
		return (
			<p className="text-sm text-amber-700" data-testid="mission-check-result" data-status="pending">
				尚未完成{result.detail ? `：${result.detail}` : "，請完成任務後再檢查。"}
			</p>
		);
	}

	return (
		<p className="text-sm text-red-700" data-testid="mission-check-result" data-status="failed">
			{failureMessages[result.reasonCode]}
			{result.detail ? ` ${result.detail}` : ""}
		</p>
	);
}

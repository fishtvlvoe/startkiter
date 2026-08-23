"use client";

import { useEffect, useState } from "react";

import { narrativeHintForOutput, runSandboxTests } from "../../webcontainer/sandbox-runtime";

export type WebContainerSandboxProps = {
	blockId: string;
	files: Record<string, string>;
	testCommand?: string;
	hints: string[];
	milestone?: boolean;
};

type SandboxStatus = "idle" | "running" | "hit-stop" | "pass" | "fail";

function playRewardFeedback() {
	if (typeof window === "undefined") {
		return;
	}

	const AudioContextConstructor =
		window.AudioContext ??
		(window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
	if (!AudioContextConstructor) {
		return;
	}

	const audioContext = new AudioContextConstructor();
	const oscillator = audioContext.createOscillator();
	const gain = audioContext.createGain();
	oscillator.frequency.value = 880;
	gain.gain.setValueAtTime(0.04, audioContext.currentTime);
	gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.16);
	oscillator.connect(gain);
	gain.connect(audioContext.destination);
	oscillator.start();
	oscillator.stop(audioContext.currentTime + 0.16);
}

export function WebContainerSandbox({
	blockId,
	files,
	testCommand = "npm test",
	hints,
	milestone = false,
}: WebContainerSandboxProps) {
	const [isSupported, setIsSupported] = useState<boolean | null>(null);
	const [status, setStatus] = useState<SandboxStatus>("idle");
	const [failureHint, setFailureHint] = useState<string | null>(null);

	useEffect(() => {
		setIsSupported(Boolean(window.crossOriginIsolated));
	}, []);

	if (isSupported === false) {
		return (
			<section className="interactive-block interactive-webcontainer" data-block-id={blockId}>
				<p role="alert">此瀏覽器不支援程式碼沙盒</p>
			</section>
		);
	}

	if (isSupported === null) {
		return (
			<section className="interactive-block interactive-webcontainer" data-block-id={blockId}>
				<p>程式沙盒載入中…</p>
			</section>
		);
	}

	const run = async () => {
		if (status === "running" || status === "hit-stop") {
			return;
		}

		setFailureHint(null);
		setStatus("running");

		try {
			const { WebContainer } = await import("@webcontainer/api");
			const webcontainer = await WebContainer.boot();
			const result = await runSandboxTests(webcontainer, files, testCommand);

			if (result.status === "fail") {
				setFailureHint(narrativeHintForOutput(result.testOutput));
				setStatus("fail");
				return;
			}

			setStatus("hit-stop");
			window.setTimeout(() => {
				playRewardFeedback();
				setStatus("pass");
			}, 150);
		} catch {
			setFailureHint("通用鼓勵文字：程式沙盒暫時無法啟動，請稍後再試。" );
			setStatus("fail");
		}
	};

	return (
		<section
			aria-label="程式碼沙盒"
			className="interactive-block interactive-webcontainer"
			data-block-id={blockId}
			data-status={status}
		>
			<div className="rounded-lg border border-neutral-700 bg-neutral-950 p-4">
				<pre aria-label="程式碼檔案" className="overflow-x-auto text-xs text-neutral-300">
					{Object.entries(files)
						.map(([filePath, contents]) => `// ${filePath}\n${contents}`)
						.join("\n\n")}
				</pre>
				<button disabled={status === "running" || status === "hit-stop"} onClick={run} type="button">
					{status === "running" ? "執行中" : "執行"}
				</button>
			</div>
			{status === "hit-stop" ? <p aria-live="polite">判定中…</p> : null}
			{status === "pass" ? (
				<div aria-live="polite" data-feedback="reward">
					<p>{milestone ? "里程碑達成！" : "挑戰完成！"}</p>
					<span aria-label="過關音效">🔊</span>
				</div>
			) : null}
			{status === "fail" && failureHint ? (
				<div aria-live="polite" data-feedback="narrative-hint">
					<p>{failureHint}</p>
					{hints[0] ? <p>你可以先想想：{hints[0]}</p> : null}
				</div>
			) : null}
		</section>
	);
}

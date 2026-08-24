"use client";

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Input,
	Label,
	Textarea,
} from "@startkiter/ui";
import { orpc } from "@shared/lib/orpc-query-utils";

const GOAL_OPTIONS = ["轉職", "升職加薪", "接案或創業", "完成個人作品"];
const PURCHASE_FACTOR_OPTIONS = ["實作導向", "課程口碑", "價格優惠", "有社群與助教"];

type OnboardingSurveyModalProps = {
	courseId: string;
	open: boolean;
};

export function OnboardingSurveyModal({ courseId, open }: OnboardingSurveyModalProps) {
	const [isOpen, setIsOpen] = useState(open);
	const [goals, setGoals] = useState<string[]>([]);
	const [purchaseFactors, setPurchaseFactors] = useState<string[]>([]);
	const [hesitation, setHesitation] = useState("");
	const [alternatives, setAlternatives] = useState("");
	const [discoverySource, setDiscoverySource] = useState("");
	const [discoverySourceOther, setDiscoverySourceOther] = useState("");

	const submitSurvey = useMutation({
		...orpc.course.submitOnboardingSurvey.mutationOptions(),
		onSuccess: () => setIsOpen(false),
	});

	function toggleValue(values: string[], value: string, setValues: (next: string[]) => void) {
		setValues(values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);
	}

	function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		submitSurvey.mutate({
			courseId,
			response: {
				goals,
				purchaseFactors,
				hesitation: hesitation.trim() || null,
				alternatives: alternatives.trim() || null,
				discoverySource: discoverySource || null,
				discoverySourceOther: discoverySourceOther.trim() || null,
			},
		});
	}

	if (!open) return null;

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl" data-testid="onboarding-survey-modal">
				<DialogHeader>
					<DialogTitle>歡迎加入，花 1 分鐘讓我們更了解你</DialogTitle>
					<DialogDescription>
						這份問卷可以跳過，不會影響你的課程使用權；填寫後不會再次顯示。
					</DialogDescription>
				</DialogHeader>

				<form className="space-y-5" onSubmit={handleSubmit}>
					<fieldset className="space-y-2">
						<legend className="text-sm font-medium">你希望透過這門課達成什麼？</legend>
						<div className="grid gap-2 sm:grid-cols-2">
							{GOAL_OPTIONS.map((option) => (
								<label className="flex items-center gap-2 rounded-lg border p-2 text-sm" key={option}>
									<input
										checked={goals.includes(option)}
										data-testid={`survey-goal-${option}`}
										type="checkbox"
										onChange={() => toggleValue(goals, option, setGoals)}
									/>
									{option}
								</label>
							))}
						</div>
					</fieldset>

					<fieldset className="space-y-2">
						<legend className="text-sm font-medium">什麼因素讓你決定購買？</legend>
						<div className="grid gap-2 sm:grid-cols-2">
							{PURCHASE_FACTOR_OPTIONS.map((option) => (
								<label className="flex items-center gap-2 rounded-lg border p-2 text-sm" key={option}>
									<input
										checked={purchaseFactors.includes(option)}
										data-testid={`survey-factor-${option}`}
										type="checkbox"
										onChange={() => toggleValue(purchaseFactors, option, setPurchaseFactors)}
									/>
									{option}
								</label>
							))}
						</div>
					</fieldset>

					<div className="grid gap-4 sm:grid-cols-2">
						<div className="space-y-2">
							<Label htmlFor="survey-hesitation">購買前最大的猶豫是什麼？</Label>
							<Textarea id="survey-hesitation" value={hesitation} onChange={(event) => setHesitation(event.target.value)} />
						</div>
						<div className="space-y-2">
							<Label htmlFor="survey-alternatives">你還考慮過哪些替代方案？</Label>
							<Textarea id="survey-alternatives" value={alternatives} onChange={(event) => setAlternatives(event.target.value)} />
						</div>
					</div>

					<div className="grid gap-4 sm:grid-cols-2">
						<div className="space-y-2">
							<Label htmlFor="survey-discovery">你從哪裡知道這門課？</Label>
							<select
								className="flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm"
								id="survey-discovery"
								value={discoverySource}
								onChange={(event) => setDiscoverySource(event.target.value)}
							>
								<option value="">請選擇</option>
								<option>朋友推薦</option>
								<option>搜尋引擎</option>
								<option>社群媒體</option>
								<option>其他</option>
							</select>
						</div>
						<div className="space-y-2">
							<Label htmlFor="survey-discovery-other">其他來源（選填）</Label>
							<Input id="survey-discovery-other" value={discoverySourceOther} onChange={(event) => setDiscoverySourceOther(event.target.value)} />
						</div>
					</div>

					{submitSurvey.isError && <p className="text-sm text-destructive">問卷送出失敗，請稍後再試。</p>}
					<DialogFooter className="gap-2">
						<Button type="button" variant="outline" onClick={() => setIsOpen(false)}>先跳過</Button>
						<Button data-testid="submit-onboarding-survey" disabled={submitSurvey.isPending} type="submit">
							{submitSurvey.isPending ? "送出中..." : "送出問卷"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

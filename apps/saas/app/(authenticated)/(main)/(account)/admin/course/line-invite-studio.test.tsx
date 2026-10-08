// @vitest-environment jsdom

import { act, type ReactElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
	useRouter: () => ({
		push: vi.fn(),
		replace: vi.fn(),
		refresh: vi.fn(),
	}),
	usePathname: () => "/admin/course",
	useSearchParams: () => new URLSearchParams(),
}));

vi.mock("next/link", () => ({
	default: ({ children, href, ...props }: any) => (
		<a href={href} {...props}>
			{children}
		</a>
	),
}));

vi.mock("@startkiter/ui", async () => {
	const React = await import("react");
	return {
		Button: ({ asChild, children, ...props }: any) => {
			if (asChild && React.isValidElement(children)) {
				return React.cloneElement(children as React.ReactElement<any>, props);
			}
			return <button {...props}>{children}</button>;
		},
		Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
		Input: (props: any) => <input {...props} />,
		Label: (props: any) => <label {...props} />,
		Textarea: (props: any) => <textarea {...props} />,
		Dialog: ({ children }: any) => <div>{children}</div>,
		DialogContent: ({ children }: any) => <div>{children}</div>,
		DialogHeader: ({ children }: any) => <div>{children}</div>,
		DialogTitle: ({ children }: any) => <div>{children}</div>,
		DialogDescription: ({ children }: any) => <div>{children}</div>,
		DialogFooter: ({ children }: any) => <div>{children}</div>,
	};
});

vi.mock("@shared/components/CourseStudioContentPreview", () => ({
	CourseStudioContentPreview: () => null,
}));

vi.mock("@shared/components/AiNotesDialog", () => ({
	AiNotesDialog: () => null,
}));

vi.mock("@course/components/MediaPicker", () => ({
	MediaPicker: () => null,
}));

vi.mock("@shared/components/BatchImportDialog", () => ({
	BatchImportDialog: () => null,
}));

vi.mock("@shared/lib/orpc-client", () => ({
	orpcClient: {
		admin: {
			users: {
				list: vi.fn(async () => ({ users: [] })),
			},
		},
		course: {
			getStudioData: vi.fn(async () => ({ courses: [], folders: [] })),
		},
	},
}));

import CourseStudioPage from "./page";

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const roots = new Set<Root>();

function changeInputValue(input: HTMLInputElement, value: string) {
	const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
		window.HTMLInputElement.prototype,
		"value",
	)?.set;
	if (nativeInputValueSetter) {
		nativeInputValueSetter.call(input, value);
	} else {
		input.value = value;
	}
	input.dispatchEvent(new Event("input", { bubbles: true }));
	input.dispatchEvent(new Event("change", { bubbles: true }));
}

async function render(element: ReactElement) {
	const container = document.createElement("div");
	document.body.appendChild(container);
	const root = createRoot(container);
	roots.add(root);
	await act(async () => {
		root.render(element);
	});
	return container;
}

afterEach(() => {
	for (const root of roots) {
		act(() => root.unmount());
	}
	roots.clear();
	document.body.innerHTML = "";
});

describe("Course Studio LINE invite URL setting (Task 5.4)", () => {
	const mockCourse = {
		id: "course-123",
		title: "電馭學院",
		coverImageUrl: null,
		lineInviteUrl: null,
		chapters: [],
		instructors: [],
		watermarkSetting: null,
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("輸入非 https 值時畫面顯示驗證錯誤且不送出成功狀態", async () => {
		const mockFetch = vi.fn().mockImplementation(async (url, init) => {
			if (typeof url === "string" && url.includes("/api/course/studio") && !init) {
				return {
					ok: true,
					json: async () => ({
						isOperator: true,
						courses: [mockCourse],
						folders: [],
					}),
				};
			}
			return {
				ok: true,
				json: async () => ({ success: true }),
			};
		});
		global.fetch = mockFetch;

		const container = await render(<CourseStudioPage />);

		// 等待資料載入並選取課程
		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 10));
		});

		const input = container.querySelector('input[aria-label="LINE 學習群連結"]') as HTMLInputElement;
		expect(input).not.toBeNull();

		// 輸入非 https 網址
		await act(async () => {
			changeInputValue(input, "http://line.me/ti/g/insecure");
		});

		const saveButton = container.querySelector('[data-testid="save-line-invite-button"]') as HTMLButtonElement;
		expect(saveButton).not.toBeNull();

		await act(async () => {
			saveButton.click();
		});

		// 畫面顯示驗證錯誤
		const errorEl = container.querySelector('[data-testid="line-invite-error"]');
		expect(errorEl).not.toBeNull();
		expect(errorEl?.textContent).toContain("連結必須為 https:// 開頭的網址");

		// 不得發送 update_course POST 請求
		const updateCall = mockFetch.mock.calls.find(([_, init]) => {
			if (!init || !init.body) return false;
			const body = JSON.parse(init.body as string);
			return body.action === "update_course";
		});
		expect(updateCall).toBeUndefined();
	});

	it("輸入合法 https 值時正常送出 update_course", async () => {
		const mockFetch = vi.fn().mockImplementation(async (url, init) => {
			if (typeof url === "string" && url.includes("/api/course/studio") && !init) {
				return {
					ok: true,
					json: async () => ({
						isOperator: true,
						courses: [mockCourse],
						folders: [],
					}),
				};
			}
			return {
				ok: true,
				json: async () => ({ success: true }),
			};
		});
		global.fetch = mockFetch;

		const container = await render(<CourseStudioPage />);

		await act(async () => {
			await new Promise((resolve) => setTimeout(resolve, 10));
		});

		const input = container.querySelector('input[aria-label="LINE 學習群連結"]') as HTMLInputElement;
		await act(async () => {
			changeInputValue(input, "https://line.me/ti/g/secure-group");
		});

		const saveButton = container.querySelector('[data-testid="save-line-invite-button"]') as HTMLButtonElement;
		await act(async () => {
			saveButton.click();
		});

		// 驗證有呼叫 update_course 帶入 https lineInviteUrl
		const updateCall = mockFetch.mock.calls.find(([_, init]) => {
			if (!init || !init.body) return false;
			const body = JSON.parse(init.body as string);
			return body.action === "update_course";
		});
		expect(updateCall).toBeDefined();
		const body = JSON.parse(updateCall![1].body as string);
		expect(body.payload.lineInviteUrl).toBe("https://line.me/ti/g/secure-group");
	});
});

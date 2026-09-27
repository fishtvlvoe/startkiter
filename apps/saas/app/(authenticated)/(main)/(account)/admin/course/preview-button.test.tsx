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
}));

vi.mock("next/link", () => ({
	default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; children: React.ReactNode }) => (
		<a href={href} {...props}>
			{children}
		</a>
	),
}));

vi.mock("@startkiter/ui", async () => {
	const React = await import("react");
	return {
		Button: ({
			render,
			children,
			...props
		}: {
			render?: (props: any) => React.ReactElement;
			children?: React.ReactNode;
		}) => {
			if (render) {
				return render(props);
			}
			return <button {...props}>{children}</button>;
		},
		Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
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
		course: {
			getStudioData: vi.fn(async () => ({ courses: [], folders: [] })),
		},
	},
}));

import CourseStudioPage from "./page";
import { getMountMenuItems } from "@shared/lib/nav-menu-items";

const roots = new Set<Root>();

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

describe("Admin Course Studio preview button and /course menu (Task 3.3)", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		global.fetch = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({ courses: [], folders: [] }),
		});
	});

	it("在 /admin/course 工作室渲染「預覽學員教室」按鈕且 href 指向 /course/preview", async () => {
		const container = await render(<CourseStudioPage />);

		const previewLink = container.querySelector('a[href="/course/preview"]');
		expect(previewLink).not.toBeNull();
		expect(previewLink?.textContent).toContain("預覽學員教室");
	});

	it("真實學員使用的 /course 選單維持既有五項，不因本次改動新增項目或分支", () => {
		const items = getMountMenuItems({
			pathname: "/course",
			platformAdmin: false,
			labelForKey: (key) => key,
		});

		expect(items.length).toBe(5);
		expect(items.map((i) => i.href)).toEqual([
			"/app",
			"/course",
			"/support",
			"/ai",
			"/settings/general",
		]);
	});
});

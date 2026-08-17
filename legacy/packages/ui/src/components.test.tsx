import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Badge, Button, Card, ColorModeToggle, Form, Input } from "./index";

describe("shared design-system markers", () => {
	it("Button renders a data-slot attribute", () => {
		const { container } = render(<Button>取得開站包</Button>);

		expect(container.querySelector('[data-slot="button"]')).not.toBeNull();
	});

	it("Card renders a data-slot attribute", () => {
		const { container } = render(<Card>內容</Card>);

		expect(container.querySelector('[data-slot="card"]')).not.toBeNull();
	});

	it("Badge renders a data-slot attribute", () => {
		const { container } = render(<Badge>一次買斷</Badge>);

		expect(container.querySelector('[data-slot="badge"]')).not.toBeNull();
	});

	it("Input renders a data-slot attribute", () => {
		const { container } = render(<Input aria-label="Email" />);

		expect(container.querySelector('[data-slot="input"]')).not.toBeNull();
	});

	it("Form renders a data-slot attribute", () => {
		const { container } = render(<Form>欄位</Form>);

		expect(container.querySelector("[data-slot]")).not.toBeNull();
	});

	it("ColorModeToggle renders a data-slot attribute", () => {
		const { container } = render(
			<ColorModeToggle
				labels={{ system: "系統", light: "淺色", dark: "深色" }}
			/>,
		);

		expect(container.querySelector("[data-slot]")).not.toBeNull();
	});
});

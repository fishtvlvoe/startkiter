"use client";

import { useState, type ReactNode } from "react";

export type SandboxValue = string | number;

export type SandboxOption = string | { value: string; label: string };

export type SandboxControl = {
	name: string;
	label?: ReactNode;
	type: "slider" | "select" | "text";
	default: SandboxValue;
	min?: number;
	max?: number;
	step?: number;
	options?: readonly SandboxOption[];
};

export type SandboxValues = Record<string, SandboxValue>;

export type MicroSandboxProps = {
	template?: string;
	initialProps?: SandboxValues;
	controls: readonly SandboxControl[];
	renderPreview?: (values: SandboxValues) => ReactNode;
	onValuesChange?: (values: SandboxValues) => void;
	className?: string;
};

function controlId(name: string) {
	return "micro-sandbox-" + name.replace(/[^a-zA-Z0-9_-]/g, "-");
}

function optionValue(option: SandboxOption) {
	return typeof option === "string" ? option : option.value;
}

function optionLabel(option: SandboxOption) {
	return typeof option === "string" ? option : option.label;
}

export function MicroSandbox({
	template,
	initialProps,
	controls,
	renderPreview,
	onValuesChange,
	className,
}: MicroSandboxProps) {
	const [values, setValues] = useState<SandboxValues>(() => {
		const nextValues = { ...(initialProps ?? {}) };
		for (const control of controls) {
			nextValues[control.name] ??= control.default;
		}
		return nextValues;
	});

	const updateValue = (name: string, value: SandboxValue) => {
		const nextValues = { ...values, [name]: value };
		setValues(nextValues);
		onValuesChange?.(nextValues);
	};

	return (
		<section
			className={"interactive-block interactive-sandbox " + (className ?? "")}
			data-component="micro-sandbox"
			data-template={template}
		>
			{template ? <p data-slot="template">範本：{template}</p> : null}
			<div data-slot="controls">
				{controls.map((control) => {
					const value = values[control.name] ?? control.default;
					const id = controlId(control.name);
					const label = control.label ?? control.name;

					if (control.type === "slider") {
						return (
							<label data-control={control.name} key={control.name} htmlFor={id}>
								<span>{label}</span>
								<input
									id={id}
									max={control.max ?? 100}
									min={control.min ?? 0}
									name={control.name}
									onChange={(event) => updateValue(control.name, Number(event.target.value))}
									step={control.step ?? 1}
									type="range"
									value={Number(value)}
								/>
								<output>{value}</output>
							</label>
						);
					}

					if (control.type === "select") {
						const options = control.options ?? [String(value)];
						return (
							<label data-control={control.name} key={control.name} htmlFor={id}>
								<span>{label}</span>
								<select
									id={id}
									name={control.name}
									onChange={(event) => updateValue(control.name, event.target.value)}
									value={String(value)}
								>
									{options.map((option) => (
										<option key={optionValue(option)} value={optionValue(option)}>
											{optionLabel(option)}
										</option>
									))}
								</select>
							</label>
						);
					}

					return (
						<label data-control={control.name} key={control.name} htmlFor={id}>
							<span>{label}</span>
							<input
								id={id}
								name={control.name}
								onChange={(event) => updateValue(control.name, event.target.value)}
								type="text"
								value={String(value)}
							/>
						</label>
					);
				})}
			</div>
			<div data-preview="true">
				{renderPreview ? renderPreview(values) : <pre>{JSON.stringify(values, null, 2)}</pre>}
			</div>
		</section>
	);
}

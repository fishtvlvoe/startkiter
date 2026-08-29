import { isIP } from "node:net";
import { resolve4, resolve6 } from "node:dns/promises";

export type AddressLookup = (hostname: string) => Promise<string[]>;

export type LessonToolUrlCheck =
	| { ok: true }
	| { ok: false; code: "TOOL_URL_INVALID" | "TOOL_URL_PRIVATE" };

function parseIPv4(hostname: string): [number, number, number, number] | null {
	const parts = hostname.split(".");
	if (parts.length !== 4) return null;

	const octets: number[] = [];
	for (const part of parts) {
		if (!/^\d{1,3}$/.test(part)) return null;
		const value = Number(part);
		if (value > 255) return null;
		octets.push(value);
	}

	return octets as [number, number, number, number];
}

function isPrivateOrLocalIPv4(octets: [number, number, number, number]): boolean {
	const [a, b] = octets;
	if (a === 0) return true;
	if (a === 10) return true;
	if (a === 127) return true;
	if (a === 169 && b === 254) return true;
	if (a === 172 && b >= 16 && b <= 31) return true;
	if (a === 192 && b === 168) return true;
	return false;
}

function parseHexGroup(value: string): number | null {
	if (!/^[0-9a-f]{1,4}$/i.test(value)) return null;
	return Number.parseInt(value, 16);
}

function parseIpv6(address: string): number[] | null {
	let core = address.toLowerCase();
	if (core.startsWith("[") && core.endsWith("]")) {
		core = core.slice(1, -1);
	}

	const zoneIndex = core.indexOf("%");
	if (zoneIndex !== -1) {
		core = core.slice(0, zoneIndex);
	}

	const dotted = core.match(/:(\d{1,3}(?:\.\d{1,3}){3})$/);
	if (dotted) {
		const ipv4 = parseIPv4(dotted[1]);
		if (!ipv4) return null;
		const high = ((ipv4[0] << 8) | ipv4[1]).toString(16);
		const low = ((ipv4[2] << 8) | ipv4[3]).toString(16);
		core = `${core.slice(0, -dotted[1].length)}${high}:${low}`;
	}

	const halves = core.split("::");
	if (halves.length > 2) return null;

	const parseSide = (side: string | undefined): number[] | null => {
		if (!side) return [];
		const groups = side.split(":");
		const parsed: number[] = [];
		for (const group of groups) {
			if (group.length === 0) return [];
			const value = parseHexGroup(group);
			if (value === null) return null;
			parsed.push(value);
		}
		return parsed;
	};

	const left = parseSide(halves[0]);
	const right = halves.length === 2 ? parseSide(halves[1]) : [];
	if (!left || !right) return null;

	if (halves.length === 1) {
		return left.length === 8 ? left : null;
	}

	const missing = 8 - left.length - right.length;
	if (missing < 0) return null;
	return [...left, ...Array.from({ length: missing }, () => 0), ...right];
}

function isPrivateOrLocalIPv6(groups: number[]): boolean {
	const isUnspecified = groups.every((group) => group === 0);
	if (isUnspecified) return true;

	const isLoopback = groups.slice(0, 7).every((group) => group === 0) && groups[7] === 1;
	if (isLoopback) return true;

	// fc00::/7 unique local
	if ((groups[0] & 0xfe00) === 0xfc00) return true;
	// fe80::/10 link-local
	if ((groups[0] & 0xffc0) === 0xfe80) return true;
	// fec0::/10 deprecated site-local
	if ((groups[0] & 0xffc0) === 0xfec0) return true;

	// ::ffff:0:0/96 IPv4-mapped
	const isV4Mapped =
		groups[0] === 0 &&
		groups[1] === 0 &&
		groups[2] === 0 &&
		groups[3] === 0 &&
		groups[4] === 0 &&
		groups[5] === 0xffff;
	if (isV4Mapped) {
		const octets: [number, number, number, number] = [
			groups[6] >> 8,
			groups[6] & 0xff,
			groups[7] >> 8,
			groups[7] & 0xff,
		];
		return isPrivateOrLocalIPv4(octets);
	}

	return false;
}

export function isPrivateOrLocalAddress(address: string): boolean {
	const family = isIP(address);
	if (family === 4) {
		const octets = parseIPv4(address);
		return octets ? isPrivateOrLocalIPv4(octets) : true;
	}
	if (family === 6) {
		const groups = parseIpv6(address);
		return groups ? isPrivateOrLocalIPv6(groups) : true;
	}

	const v4 = parseIPv4(address);
	if (v4) return isPrivateOrLocalIPv4(v4);
	const v6 = parseIpv6(address);
	if (v6) return isPrivateOrLocalIPv6(v6);
	return true;
}

function stripIpv6Brackets(hostname: string): string {
	if (hostname.startsWith("[") && hostname.endsWith("]")) {
		return hostname.slice(1, -1);
	}
	return hostname;
}

function isLocalHostname(hostname: string): boolean {
	return hostname === "localhost" || hostname.endsWith(".localhost");
}

export async function defaultAddressLookup(hostname: string): Promise<string[]> {
	const results = await Promise.allSettled([resolve4(hostname), resolve6(hostname)]);
	const addresses: string[] = [];
	for (const result of results) {
		if (result.status === "fulfilled") {
			addresses.push(...result.value);
		}
	}
	return addresses;
}

export async function checkLessonToolUrl(
	url: string,
	lookup: AddressLookup = defaultAddressLookup,
): Promise<LessonToolUrlCheck> {
	let parsed: URL;
	try {
		parsed = new URL(url);
	} catch {
		return { ok: false, code: "TOOL_URL_INVALID" };
	}

	if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
		return { ok: false, code: "TOOL_URL_INVALID" };
	}

	const hostname = stripIpv6Brackets(parsed.hostname).toLowerCase();
	if (!hostname) {
		return { ok: false, code: "TOOL_URL_INVALID" };
	}
	if (isLocalHostname(hostname)) {
		return { ok: false, code: "TOOL_URL_PRIVATE" };
	}

	if (isIP(hostname) || parseIPv4(hostname) || parseIpv6(hostname)) {
		return isPrivateOrLocalAddress(hostname)
			? { ok: false, code: "TOOL_URL_PRIVATE" }
			: { ok: true };
	}

	let resolved: string[];
	try {
		resolved = await lookup(hostname);
	} catch {
		// DNS 失敗一律視為不安全，避免把解析不出來的網域當公開網址放行
		return { ok: false, code: "TOOL_URL_PRIVATE" };
	}

	if (resolved.length === 0) {
		return { ok: false, code: "TOOL_URL_PRIVATE" };
	}

	for (const address of resolved) {
		if (isPrivateOrLocalAddress(address)) {
			return { ok: false, code: "TOOL_URL_PRIVATE" };
		}
	}

	return { ok: true };
}

export async function isPrivateOrLocalUrl(
	url: string,
	lookup: AddressLookup = defaultAddressLookup,
): Promise<boolean> {
	const result = await checkLessonToolUrl(url, lookup);
	return !result.ok;
}

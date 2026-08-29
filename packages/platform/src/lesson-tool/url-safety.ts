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

function stripIpv6Brackets(hostname: string): string {
	if (hostname.startsWith("[") && hostname.endsWith("]")) {
		return hostname.slice(1, -1);
	}
	return hostname;
}

function isLoopbackIpv6(hostname: string): boolean {
	const compact = hostname.toLowerCase();
	return compact === "::1" || compact === "0:0:0:0:0:0:0:1";
}

export function isPrivateOrLocalUrl(url: string): boolean {
	let parsed: URL;
	try {
		parsed = new URL(url);
	} catch {
		// 無法解析的網址一律視為不安全，避免把垃圾字串當公開網址放行
		return true;
	}

	const hostname = stripIpv6Brackets(parsed.hostname).toLowerCase();
	if (hostname === "localhost") return true;
	if (isLoopbackIpv6(hostname)) return true;

	const ipv4 = parseIPv4(hostname);
	if (ipv4) return isPrivateOrLocalIPv4(ipv4);

	return false;
}

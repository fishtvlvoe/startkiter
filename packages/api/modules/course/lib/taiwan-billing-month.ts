export function sameTaiwanBillingMonth(a: Date, b: Date): boolean {
	const monthKey = (date: Date) => {
		const parts = new Intl.DateTimeFormat("en-CA", {
			timeZone: "Asia/Taipei",
			year: "numeric",
			month: "2-digit",
		}).formatToParts(date);
		return `${parts.find((part) => part.type === "year")?.value}-${parts.find((part) => part.type === "month")?.value}`;
	};
	return monthKey(a) === monthKey(b);
}

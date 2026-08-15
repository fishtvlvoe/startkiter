import Link from "next/link";

export default async function CheckoutReturnPage({
	searchParams,
}: {
	searchParams: Promise<{ status?: string }>;
}) {
	const params = await searchParams;
	return (
		<main>
			<section className="panel">
				<h1>付款結果</h1>
				<p>狀態：{params.status || "unknown"}。權益以 PAYUNi notify 為準。</p>
				<Link className="button" href="/app">
					回帳號
				</Link>
			</section>
		</main>
	);
}

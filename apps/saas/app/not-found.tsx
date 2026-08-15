import Link from "next/link";

export default function NotFound() {
	return (
		<main>
			<section className="panel">
				<h1>找不到頁面</h1>
				<p>這個路徑不是目前開站包的功能。</p>
				<Link href="/">回首頁</Link>
			</section>
		</main>
	);
}

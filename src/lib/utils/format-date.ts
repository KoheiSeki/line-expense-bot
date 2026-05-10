/**
 * `Date` を日本語ロケールの年月日表記に整形する（UI 表示用）
 */
export function formatDateJp(date: Date): string {
	return date.toLocaleDateString("ja-JP", {
		year: "numeric",
		month: "long",
		day: "numeric",
	});
}

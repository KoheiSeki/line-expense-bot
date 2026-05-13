import { describe, expect, it } from "vitest";
import { formatDateJp } from "./format-date";

describe("formatDateJp", () => {
	it("日本語ロケールの日付文字列を返す", () => {
		const s = formatDateJp(new Date("2026-01-15T12:00:00"));
		expect(s).toContain("2026");
		expect(s).toContain("15");
	});
});

import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { buildExpenseListFlexMessage } from "./expense-list.flex";

const sampleGroupId = "Cxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";

const sampleItems = [
	{
		expenseId: 1,
		payerUserId: "U1",
		payerUserName: "太郎",
		title: "ランチ",
		amount: 1200,
		paidAt: new Date("2026-01-15T12:00:00"),
		createdAt: new Date("2026-01-15T12:00:00.000Z"),
	},
];

describe("buildExpenseListFlexMessage", () => {
	beforeAll(() => {
		vi.stubEnv("NEXT_PUBLIC_LIFF_ID", "0000000000-testLiffId");
	});

	afterAll(() => {
		vi.unstubAllEnvs();
	});

	it("支出がない場合はテキストメッセージを返す", () => {
		const result = buildExpenseListFlexMessage(sampleGroupId, []);
		expect(result.type).toBe("text");
		if (result.type !== "text") throw new Error("expected text");
		expect(result.text).toBe("まだ支出が登録されていません");
	});

	it("支出がある場合はFlexメッセージを返す", () => {
		const result = buildExpenseListFlexMessage(sampleGroupId, sampleItems);
		expect(result.type).toBe("flex");
	});

	it("altTextに件数と件数上限の案内が含まれる", () => {
		const result = buildExpenseListFlexMessage(sampleGroupId, sampleItems);
		if (result.type !== "flex") throw new Error("expected flex");
		expect(result.altText).toBe("支出一覧（最新10件まで・1件表示）");
	});

	it("タイトル・金額・支払者・整形済み支払日が含まれる", () => {
		const result = buildExpenseListFlexMessage(sampleGroupId, sampleItems);
		if (result.type !== "flex") throw new Error("expected flex");
		if (result.contents.type !== "bubble")
			throw new Error("expected bubble");
		const fullJson = JSON.stringify(result.contents);
		expect(fullJson).toContain("ランチ");
		expect(fullJson).toContain("¥1,200");
		expect(fullJson).toContain("太郎");
		expect(fullJson).toMatch(/支払日.*2026/);
		expect(fullJson).toContain("最大10件");
	});

	it("編集・削除のLIFFリンクが支出IDとグループID付きで含まれる", () => {
		const result = buildExpenseListFlexMessage(sampleGroupId, sampleItems);
		if (result.type !== "flex") throw new Error("expected flex");
		const fullJson = JSON.stringify(result.contents);
		expect(fullJson).toContain('"label":"編集"');
		expect(fullJson).toContain('"label":"削除"');
		expect(fullJson).toContain("liff.line.me/0000000000-testLiffId");
		expect(fullJson).toContain("/liff/expense/edit?");
		expect(fullJson).toContain("/liff/expense/delete?");
		expect(fullJson).toContain(encodeURIComponent(sampleGroupId));
		expect(fullJson).toContain("expenseId=1");
	});
});

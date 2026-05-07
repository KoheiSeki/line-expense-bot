import { describe, expect, it } from "vitest";
import { buildSettlementFlexMessage } from "./settlement.flex";

const requiredSettlements = [
	{
		fromUserId: "user1",
		fromUserName: "Alice",
		toUserId: "user2",
		toUserName: "Bob",
		amount: 1000,
	},
];

describe("buildSettlementFlexMessage", () => {
	it("精算が不要な場合にテキストメッセージを返す", () => {
		const result = buildSettlementFlexMessage([]);
		expect(result.type).toBe("text");
	});

	it("精算が不要な場合のテキスト内容が正しい", () => {
		const result = buildSettlementFlexMessage([]);
		if (result.type !== "text") throw new Error("type should be text");
		expect(result.text).toBe("精算は不要です🎉");
	});

	it("精算が必要な場合にFlexメッセージを返す", () => {
		const result = buildSettlementFlexMessage(requiredSettlements);

		expect(result.type).toBe("flex");
	});

	it("精算がある場合にaltTextが正しい", () => {
		const result = buildSettlementFlexMessage(requiredSettlements);
		if (result.type !== "flex") throw new Error("type should be flex");
		expect(result.altText).toBe("精算内容");
	});

	it("行に送金者名・受取者名が含まれる", () => {
		const result = buildSettlementFlexMessage(requiredSettlements);
		if (result.type !== "flex") throw new Error("type should be flex");

		if (result.contents.type !== "bubble")
			throw new Error("contents should be bubble");

		const bodyContents = result.contents.body?.contents ?? [];
		const rowText = JSON.stringify(bodyContents);
		expect(rowText).toContain("Alice → Bob");
	});

	it("金額が日本語ロケール形式で表示される", () => {
		const result = buildSettlementFlexMessage(requiredSettlements);
		if (result.type !== "flex") throw new Error("type should be flex");

		if (result.contents.type !== "bubble")
			throw new Error("contents should be bubble");

		const bodyContents = result.contents.body?.contents ?? [];
		const rowText = JSON.stringify(bodyContents);
		expect(rowText).toContain("¥1,000");
	});

	it("複数の精算がある場合に、すべての行が表示される", () => {
		const multipleSettlements = [
			...requiredSettlements,
			{
				fromUserId: "user2",
				fromUserName: "Bob",
				toUserId: "user3",
				toUserName: "Charlie",
				amount: 2000,
			},
		];

		const result = buildSettlementFlexMessage(multipleSettlements);
		if (result.type !== "flex") throw new Error("type should be flex");

		if (result.contents.type !== "bubble")
			throw new Error("contents should be bubble");

		const bodyContents = result.contents.body?.contents ?? [];
		expect(bodyContents).toHaveLength(2);
	});
});

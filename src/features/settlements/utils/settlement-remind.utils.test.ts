import { describe, expect, it } from "vitest";
import {
	MAX_REMIND_SETTLEMENT_LINES,
	MAX_REMIND_TEXT_LENGTH,
	REMIND_MESSAGE_FOOTER,
	REMIND_MESSAGE_HEADER,
} from "../consts/settlement-remind.consts";
import { SettlementResult } from "../types/settlements.types";
import { buildSettlementRemindMessage } from "./settlement-remind.utils";

const base = (overrides: Partial<SettlementResult>): SettlementResult => ({
	fromUserId: "u1",
	fromUserName: "A",
	toUserId: "u2",
	toUserName: "B",
	amount: 100,
	...overrides,
});

describe("buildSettlementRemindMessage", () => {
	it("空配列のとき null", () => {
		expect(buildSettlementRemindMessage([])).toBeNull();
	});

	it("amount がすべて 0 のとき null", () => {
		expect(
			buildSettlementRemindMessage([
				base({ amount: 0 }),
				base({ toUserName: "C", amount: 0 }),
			]),
		).toBeNull();
	});

	it("amount > 0 が1件のときヘッダー・本文・フッターを含む", () => {
		const result = buildSettlementRemindMessage([
			base({ amount: 12345, fromUserName: "太郎", toUserName: "花子" }),
		]);
		expect(result).not.toBeNull();
		expect(result).toContain(REMIND_MESSAGE_HEADER);
		expect(result).toContain(REMIND_MESSAGE_FOOTER);
		expect(result).toContain("太郎 → 花子: ¥12,345");
	});

	it("複数の未精算行を改行1つでつなぐ（空行が挟まらない）", () => {
		const result = buildSettlementRemindMessage([
			base({ amount: 100, fromUserName: "A", toUserName: "B" }),
			base({
				amount: 200,
				fromUserName: "C",
				toUserName: "D",
				fromUserId: "u3",
				toUserId: "u4",
			}),
		]);
		expect(result).not.toBeNull();
		expect(result).not.toMatch(/\n\n.*→/);
		expect(result).toContain("A → B: ¥100");
		expect(result).toContain("C → D: ¥200");
	});

	it(`未精算が ${MAX_REMIND_SETTLEMENT_LINES + 1} 件のとき先頭 N 件と超過案内`, () => {
		const rows: SettlementResult[] = Array.from(
			{ length: MAX_REMIND_SETTLEMENT_LINES + 1 },
			(_, i) =>
				base({
					amount: i + 1,
					fromUserName: `送${i}`,
					toUserName: `受${i}`,
					fromUserId: `f${i}`,
					toUserId: `t${i}`,
				}),
		);
		const result = buildSettlementRemindMessage(rows);
		expect(result).not.toBeNull();
		expect(result).toContain("他 1 件はトークで「表示」と送信してください");
		expect(result).toContain(`送0 → 受0: ¥1`);
		expect(result).toContain(
			`送${MAX_REMIND_SETTLEMENT_LINES - 1} → 受${MAX_REMIND_SETTLEMENT_LINES - 1}`,
		);
		expect(result).not.toContain(
			`送${MAX_REMIND_SETTLEMENT_LINES} → 受${MAX_REMIND_SETTLEMENT_LINES}`,
		);
	});

	it("極端に長い本文は MAX_REMIND_TEXT_LENGTH で切り詰められる", () => {
		const longName = "x".repeat(MAX_REMIND_TEXT_LENGTH);
		const result = buildSettlementRemindMessage([
			base({
				amount: 1,
				fromUserName: longName,
				toUserName: "Y",
			}),
		]);
		expect(result).not.toBeNull();
		expect(result!.length).toBeLessThanOrEqual(MAX_REMIND_TEXT_LENGTH);
		expect(result).toContain("(文字数の上限のため省略)");
	});
});

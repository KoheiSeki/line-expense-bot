import { describe, it, expect } from "vitest";
import { validateExpenseForm } from "./expenses.validation";

/** 正常な入力 */
const validForm = {
	payerUserId: "user1",
	title: "test",
	amount: "1000",
	paidAt: "2026-01-01",
	expenseParticipants: [
		{ lineUserId: "user1", shareAmount: "600" },
		{ lineUserId: "user2", shareAmount: "400" },
	],
};

describe("validateExpenseForm", () => {
	it("正常な入力でnullを返す", () => {
		expect(validateExpenseForm(validForm)).toBeNull();
	});

	it("payerUserIdが空の場合にエラーを返す", () => {
		expect(validateExpenseForm({ ...validForm, payerUserId: "" })).toBe(
			"支払い者を選択してください",
		);
	});

	it("payerUserIdが50文字を超える場合にエラーを返す", () => {
		expect(
			validateExpenseForm({ ...validForm, payerUserId: "a".repeat(51) }),
		).toBe("ユーザーIDの形式が不正です");
	});

	it("titleが空の場合にエラーを返す", () => {
		expect(validateExpenseForm({ ...validForm, title: "" })).toBe(
			"タイトルを入力してください",
		);
	});

	it("titleが255文字を超える場合にエラーを返す", () => {
		expect(validateExpenseForm({ ...validForm, title: "a".repeat(256) })).toBe(
			"タイトルは255文字以内にしてください",
		);
	});

	it("amountが空の場合にエラーを返す", () => {
		expect(validateExpenseForm({ ...validForm, amount: "" })).toBe(
			"金額の形式が不正です",
		);
	});

	it("amountが数値でない場合にエラーを返す", () => {
		expect(validateExpenseForm({ ...validForm, amount: "a" })).toBe(
			"金額の形式が不正です",
		);
	});

	it("amountがマイナス値でエラーを返す", () => {
		expect(validateExpenseForm({ ...validForm, amount: "-1000" })).toBe(
			"金額の形式が不正です",
		);
	});

	it("paidAtが空の場合にエラーを返す", () => {
		expect(validateExpenseForm({ ...validForm, paidAt: "" })).toBe(
			"支払い日を選択してください",
		);
	});

	it("paidAtが日付でない場合にエラーを返す", () => {
		expect(validateExpenseForm({ ...validForm, paidAt: "a" })).toBe(
			"支払い日を選択してください",
		);
	});

	it("paidAtが不正な日付の場合にエラーを返す", () => {
		expect(validateExpenseForm({ ...validForm, paidAt: "2026/01/01" })).toBe(
			"支払い日を選択してください",
		);
	});

	it("expenseParticipantsが空の場合にエラーを返す", () => {
		expect(validateExpenseForm({ ...validForm, expenseParticipants: [] })).toBe(
			"支出参加者を1人以上選択してください",
		);
	});

	it("shareAmountが不正な形式でエラーを返す", () => {
		expect(
			validateExpenseForm({
				...validForm,
				expenseParticipants: [{ lineUserId: "user1", shareAmount: "a" }],
			}),
		).toBe("負担金額の形式が不正です");
	});

	it("shareAmountがマイナス値でエラーを返す", () => {
		expect(
			validateExpenseForm({
				...validForm,
				expenseParticipants: [{ lineUserId: "user1", shareAmount: "-1000" }],
			}),
		).toBe("負担金額の形式が不正です");
	});

	it("shareAmountが合計金額と一致しない場合にエラーを返す", () => {
		expect(
			validateExpenseForm({
				...validForm,
				expenseParticipants: [
					{ lineUserId: "user1", shareAmount: "500" },
					{ lineUserId: "user2", shareAmount: "400" },
				],
			}),
		).toBe("負担金額の合計が合計金額と一致しません");
	});
});

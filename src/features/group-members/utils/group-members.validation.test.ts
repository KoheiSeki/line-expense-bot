import { describe, expect, it } from "vitest";
import { validateJoinForm } from "./group-members.validation";

/** 正常な入力 */
const validForm = {
	displayName: "test",
};

describe("validateJoinForm", () => {
	it("正常な入力でnullを返す", () => {
		expect(validateJoinForm(validForm)).toBeNull();
	});

	it("displayNameが空の場合にエラーを返す", () => {
		expect(validateJoinForm({ ...validForm, displayName: "" })).toBe(
			"表示名を入力してください",
		);
	});

	it("displayNameが100文字を超える場合にエラーを返す", () => {
		expect(
			validateJoinForm({ ...validForm, displayName: "a".repeat(101) }),
		).toBe("表示名は100文字以内にしてください");
	});
});

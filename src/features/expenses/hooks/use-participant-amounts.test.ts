import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useParticipantAmounts } from "./use-participant-amounts";

describe("useParticipantAmounts", () => {
	it("initialShares があるとき初期の負担Mapに反映される", () => {
		const initialShares = new Map([
			["U1111111111111111111111111111111", "600"],
			["U2222222222222222222222222222222", "400"],
		]);
		const { result } = renderHook(() =>
			useParticipantAmounts({
				amount: "1000",
				initialShares,
			}),
		);
		expect(result.current.participantAmounts.size).toBe(2);
		expect(result.current.participantAmounts.get("U1111111111111111111111111111111")).toBe(
			"600",
		);
		expect(result.current.participantAmounts.get("U2222222222222222222222222222222")).toBe(
			"400",
		);
	});

	it("initialShares が無いとき Map は空", () => {
		const { result } = renderHook(() =>
			useParticipantAmounts({ amount: "1000" }),
		);
		expect(result.current.participantAmounts.size).toBe(0);
	});

	it("toggleMember で参加者を外せる", () => {
		const initialShares = new Map([["U1111111111111111111111111111111", "1000"]]);
		const { result } = renderHook(() =>
			useParticipantAmounts({
				amount: "1000",
				initialShares,
			}),
		);
		act(() => {
			result.current.toggleMember("U1111111111111111111111111111111");
		});
		expect(result.current.participantAmounts.has("U1111111111111111111111111111111")).toBe(
			false,
		);
	});
});

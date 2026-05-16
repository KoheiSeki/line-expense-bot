import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { mockSendSettlementsRemind } = vi.hoisted(() => ({
	mockSendSettlementsRemind: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/features/settlements/service/settlements-remind.server.service", () => ({
	sendSettlementsRemind: mockSendSettlementsRemind,
}));

import { GET } from "./route";

describe("GET /api/cron/settlement-remind", () => {
	beforeEach(() => {
		vi.stubEnv("CRON_SECRET", "cron-test-secret");
		mockSendSettlementsRemind.mockClear();
	});

	afterEach(() => {
		vi.unstubAllEnvs();
	});

	it("Authorization が不正なとき 401 で sendSettlementsRemind を呼ばない", async () => {
		const req = new NextRequest("http://localhost/api/cron/settlement-remind", {
			method: "GET",
			headers: { Authorization: "Bearer wrong-token" },
		});
		const res = await GET(req);

		expect(res.status).toBe(401);
		expect(await res.json()).toEqual({ message: "Unauthorized" });
		expect(mockSendSettlementsRemind).not.toHaveBeenCalled();
	});

	it("Authorization ヘッダが無いとき 401", async () => {
		const req = new NextRequest("http://localhost/api/cron/settlement-remind", {
			method: "GET",
		});
		const res = await GET(req);

		expect(res.status).toBe(401);
		expect(mockSendSettlementsRemind).not.toHaveBeenCalled();
	});

	it("正しい Bearer で 200 かつ sendSettlementsRemind が 1 回呼ばれる", async () => {
		const req = new NextRequest("http://localhost/api/cron/settlement-remind", {
			method: "GET",
			headers: { Authorization: "Bearer cron-test-secret" },
		});
		const res = await GET(req);

		expect(res.status).toBe(200);
		expect(await res.json()).toEqual({
			message: "精算リマインドメッセージを送信しました",
		});
		expect(mockSendSettlementsRemind).toHaveBeenCalledTimes(1);
	});

	it("sendSettlementsRemind が失敗すると apiHandler により 500", async () => {
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		mockSendSettlementsRemind.mockRejectedValueOnce(new Error("send failed"));
		const req = new NextRequest("http://localhost/api/cron/settlement-remind", {
			method: "GET",
			headers: { Authorization: "Bearer cron-test-secret" },
		});
		const res = await GET(req);

		expect(res.status).toBe(500);
		expect(await res.json()).toEqual({ message: "Internal Server Error" });
		consoleSpy.mockRestore();
	});
});

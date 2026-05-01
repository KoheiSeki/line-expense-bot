import { NextRequest, NextResponse } from "next/server";
import { ApiError } from "./error";

type RouteHandler = (req: NextRequest) => Promise<Response>;

export function apiHandler(handler: RouteHandler): RouteHandler {
	return async (req: NextRequest) => {
		try {
			return await handler(req);
		} catch (error) {
			if (error instanceof ApiError) {
				return NextResponse.json(
					{ message: error.message },
					{ status: error.status },
				);
			}

			console.error("[Unhandled Error]", error);
			return NextResponse.json(
				{ message: "Internal Server Error" },
				{ status: 500 },
			);
		}
	};
}

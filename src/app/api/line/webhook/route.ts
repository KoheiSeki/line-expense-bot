import { handleMessage } from "@/features/webhook/handlers/message.handler";
import { validateSignature, webhook } from "@line/bot-sdk";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    const signature = request.headers.get("x-line-signature");
    if (!signature) {
        return NextResponse.json({error: "Missing signature"}, {status: 400});
    }

    const body = await request.text();

    const isValid = await validateSignature(body, process.env.LINE_CHANNEL_SECRET!, signature);

    if (!isValid) {
        return NextResponse.json({error: "Invalid signature"}, {status: 401});
    }

    const events = JSON.parse(body).events;

    for (const event of events) {
        if (event.type === "message") {
            await handleMessage(event as webhook.MessageEvent)
        }
    }

    return NextResponse.json({message: "OK"}, {status: 200});
}
import { webhook } from "@line/bot-sdk";
import { handleRegister } from "./register.handler";

export async function handleMessage(event: webhook.MessageEvent) {
    if (event.source?.type !== "group") return;

    const message = event.message as webhook.TextMessageContent;
    if (message.type !== "text") return;

    const text = message.text.trim();
    const groupId = event.source.groupId;
    const replyToken = event.replyToken!;

    switch (text) {
        case "登録":
            await handleRegister(replyToken, groupId);
            break;
        default:
    }
}
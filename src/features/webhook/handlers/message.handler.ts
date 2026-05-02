import { webhook } from "@line/bot-sdk";
import { handleRegister } from "./register.handler";
import { handleJoin } from "./join.handler";

export async function handleMessage(event: webhook.MessageEvent) {
	if (event.source?.type !== "group") return;

	const message = event.message as webhook.TextMessageContent;
	if (message.type !== "text") return;

	const text = message.text.trim();
	const groupId = event.source.groupId;
	const replyToken = event.replyToken!;

	switch (text) {
		case "参加":
			await handleJoin(replyToken, groupId);
		case "登録":
			await handleRegister(replyToken, groupId);
			break;
		default:
	}
}

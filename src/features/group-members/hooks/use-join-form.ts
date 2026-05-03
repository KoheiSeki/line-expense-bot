"use client";

import { ApiError } from "@/lib/api/error";
import type { Profile } from "@liff/get-profile";
import type liff from "@line/liff";
import { useState, useTransition } from "react";
import { joinGroup } from "../service/group-members.client.service";
import { validateJoinForm } from "../utils/group-members.validation";

type UseJoinFormParams = {
	groupId: string;
	profile: Profile;
	liff: typeof liff;
};

type UseJoinFormResult = {
	isPending: boolean;
	displayName: string;
	setDisplayName: (displayName: string) => void;
	pictureUrl: string | undefined;
	lineUserId: string;
	error: string | null;
	handleSubmit: (e: React.FormEvent) => void;
};

export const useJoinForm = ({
	groupId,
	profile,
	liff,
}: UseJoinFormParams): UseJoinFormResult => {
	/** グループ参加フォームの送信状態 */
	const [isPending, startTransition] = useTransition();
	/** 表示名 */
	const [displayName, setDisplayName] = useState<string>(profile.displayName);
	/** グループ参加フォームのエラー */
	const [error, setError] = useState<string | null>(null);

	/** プロフィール画像URL */
	const pictureUrl = profile.pictureUrl;
	/** ラインユーザーID */
	const lineUserId = profile.userId;

	/** グループ参加フォームの送信ハンドラー */
	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		startTransition(async () => {
			setError(null);

			const validationError = validateJoinForm({ displayName });
			if (validationError) {
				setError(validationError);
				return;
			}

			try {
				await joinGroup({
					lineGroupId: groupId,
					lineUserId,
					displayName,
					pictureUrl,
				});
				liff.closeWindow();
			} catch (err) {
				if (err instanceof ApiError) {
					setError(err.message);
				} else {
					setError("予期しないエラーが発生しました");
				}
			}
		});
	};

	return {
		isPending,
		displayName,
		setDisplayName,
		pictureUrl,
		lineUserId,
		error,
		handleSubmit,
	};
};

"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api/error";
import { useLiff } from "@/shared/components/liff-provider";
import Image from "next/image";
import { useState, useTransition } from "react";
import { joinGroup } from "../service/group-members.client.service";

type JoinFormProps = {
	groupId: string;
};

export const JoinForm = ({ groupId }: JoinFormProps) => {
	const { liff, isReady, profile } = useLiff();
	const [isPending, startTransition] = useTransition();
	/** 表示名 */
	const [displayName, setDisplayName] = useState<string>(
		profile?.displayName ?? "",
	);
	/** プロフィール画像URL */
	const pictureUrl = profile?.pictureUrl ?? "";
	/** ラインユーザーID */
	const lineUserId = profile?.userId ?? "";
	/** エラーメッセージ */
	const [error, setError] = useState<string | null>(null);

	/** 参加登録を行う関数 */
	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!liff) return;

		startTransition(async () => {
			setError(null);
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

	if (!isReady || !profile) {
		return <p className="p-6 text-sm text-zinc-500">読み込み中...</p>;
	}

	return (
		<form onSubmit={handleSubmit} className="flex flex-col gap-6 p-6">
			{error && <p className="text-red-500 text-sm">{error}</p>}

			{/* プロフィール画像プレビュー */}
			{pictureUrl && (
				<div className="flex justify-center">
					<Image
						src={pictureUrl}
						alt={displayName}
						width={72}
						height={72}
						className="rounded-full"
					/>
				</div>
			)}

			{/* 表示名入力 */}
			<div>
				<Label htmlFor="displayName">表示名</Label>
				<Input
					id="displayName"
					value={displayName}
					onChange={(e) => setDisplayName(e.target.value)}
					placeholder="表示名を入力してください"
					required
				/>
				<p className="text-xs text-zinc-400 mt-1">
					LINEの表示名がデフォルトで設定されています。変更も可能です。
				</p>
			</div>

			<Button type="submit" disabled={isPending || !lineUserId}>
				{isPending ? "登録中..." : "グループに参加する"}
			</Button>
		</form>
	);
};

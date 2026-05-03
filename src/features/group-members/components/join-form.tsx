"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLiff } from "@/shared/components/liff-provider";
import { FormError } from "@/shared/components/form-error";
import type { Profile } from "@liff/get-profile";
import type liff from "@line/liff";
import { useJoinForm } from "../hooks/use-join-form";
import { LABEL_CLASS } from "@/shared/styles/label";
import { MemberAvatar } from "@/shared/components/member-avatar";

type JoinFormProps = {
	groupId: string;
};

type JoinFormInnerProps = JoinFormProps & {
	profile: Profile;
	liff: typeof liff;
};

/** ローディング・LIFF 初期化待ちを担当するラッパー */
export const JoinForm = ({ groupId }: JoinFormProps) => {
	const { liff, isReady, profile } = useLiff();

	if (!isReady || !profile || !liff) {
		return <p className="p-6 text-sm text-zinc-500">読み込み中...</p>;
	}

	return <JoinFormInner groupId={groupId} profile={profile} liff={liff} />;
};

/** フォーム本体（profile・liff が確定した状態でマウント） */
const JoinFormInner = ({ groupId, profile, liff }: JoinFormInnerProps) => {
	const {
		isPending,
		displayName,
		setDisplayName,
		pictureUrl,
		lineUserId,
		error,
		handleSubmit,
	} = useJoinForm({ groupId, profile, liff });

	return (
		<form onSubmit={handleSubmit} className="flex flex-col gap-6 p-6">
			<FormError error={error} />

			<div className="flex justify-center">
				<MemberAvatar
					pictureUrl={pictureUrl}
					displayName={displayName}
					size={72}
				/>
			</div>

			<div>
				<Label htmlFor="displayName" className={LABEL_CLASS}>
					表示名
				</Label>
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

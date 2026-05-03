import Image from "next/image";

type MemberAvatarProps = {
	pictureUrl: string | null | undefined;
	displayName: string;
	size: number;
};

/** メンバーのアバター（画像 or フォールバック円） */
export const MemberAvatar = ({
	pictureUrl,
	displayName,
	size,
}: MemberAvatarProps) => {
	if (pictureUrl) {
		return (
			<Image
				src={pictureUrl}
				alt={displayName}
				width={size}
				height={size}
				className="rounded-full shrink-0"
			/>
		);
	}

	return (
		<div
			style={{ width: size, height: size }}
			className="rounded-full bg-zinc-200 shrink-0"
		/>
	);
};

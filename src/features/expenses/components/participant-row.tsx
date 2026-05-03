import { Input } from "@/components/ui/input";
import { CARD_INPUT_CLASS } from "@/shared/styles/card-input";
import type { Member } from "../types/expense.types";
import { MemberAvatar } from "../../../shared/components/member-avatar";

type ParticipantRowProps = {
	member: Member;
	isSelected: boolean;
	shareAmount: string;
	isLast: boolean;
	onToggle: () => void;
	onAmountChange: (value: string) => void;
};

/** 参加者 1 行（チェックボックス・アバター・名前・負担金額） */
export const ParticipantRow = ({
	member,
	isSelected,
	shareAmount,
	isLast,
	onToggle,
	onAmountChange,
}: ParticipantRowProps) => {
	return (
		<label
			htmlFor={`participant-${member.lineUserId}`}
			className={`flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-colors ${
				!isLast ? "border-b border-zinc-100" : ""
			} ${isSelected ? "bg-indigo-50" : "hover:bg-zinc-50"}`}
		>
			<Input
				id={`participant-${member.lineUserId}`}
				type="checkbox"
				checked={isSelected}
				onChange={onToggle}
				className="w-[18px] h-[18px] accent-indigo-600 shrink-0"
			/>
			<MemberAvatar
				pictureUrl={member.pictureUrl}
				displayName={member.displayName}
				size={36}
			/>
			<span className="flex-1 text-sm font-medium">{member.displayName}</span>

			<div className="flex items-center gap-0.5 shrink-0">
				<span className="text-zinc-400 text-sm">¥</span>
				<Input
					id={`participant-amount-${member.lineUserId}`}
					type="text"
					value={shareAmount}
					onChange={(e) => onAmountChange(e.target.value)}
					onClick={(e) => e.stopPropagation()}
					placeholder="0"
					className={CARD_INPUT_CLASS}
				/>
			</div>
		</label>
	);
};

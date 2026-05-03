type FormErrorProps = {
	error: string | null;
};

export const FormError = ({ error }: FormErrorProps) => {
	if (!error) return null;

	return (
		<div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3">
			<p className="text-red-600 text-sm">{error}</p>
		</div>
	);
};

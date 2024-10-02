"use client";

import { useTransition } from "react";

const Action = ({ action }: { action: (arg: string) => void }) => {
	const [isPending, startTransition] = useTransition();

	return (
		<div>
			<button
				type="button"
				disabled={isPending}
				onClick={() => startTransition(async () => await action("test"))}
			>
				{isPending ? "loading..." : "action [client]"}
			</button>
		</div>
	);
};

export { Action };

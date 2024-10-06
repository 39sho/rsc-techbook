"use client";

import { use, useState } from "react";

const Counter = ({ sleep }: { sleep?: Promise<unknown> }) => {
	if (sleep != null) use(sleep);

	const [count, setCount] = useState(0);

	const onclick = () => setCount((count) => count + 1);

	return (
		<button type="button" onClick={onclick}>
			count: {count}
		</button>
	);
};

export { Counter };

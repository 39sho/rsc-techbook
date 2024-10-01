"use client";

import { useState } from "react";

const Counter = () => {
	const [count, setCount] = useState(0);

	const onclick = () => setCount((count) => count + 1);

	return (
		<button type="button" onClick={onclick}>
			count: {count}
		</button>
	);
};

export { Counter };

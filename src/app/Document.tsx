import type { ReactNode } from "react";

export const Document = ({ children }: { children: ReactNode }) => (
	<html lang="ja">
		<head>
			<meta charSet="UTF-8" />
			<link rel="icon" type="image/svg+xml" href="/vite.svg" />
			<meta name="viewport" content="width=device-width, initial-scale=1" />
			<title>vite-node + React</title>
		</head>
		<body>{children}</body>
	</html>
);

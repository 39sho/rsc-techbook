import type { ReactNode } from "react";

export const Document = ({ children }: { children: ReactNode }) => (
	<html lang="ja">
		<head>
			<meta name="viewport" content="width=device-width, initial-scale=1" />
			<title>TITLE</title>
		</head>
		<body>
			{children}
			<script type="module" src="/src/browser-client/index.tsx" />
		</body>
	</html>
);

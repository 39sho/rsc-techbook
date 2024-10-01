import { getPort } from "get-port-please";
import { toNodeListener } from "h3";
import { createServer } from "node:http";

import { app } from "./node-server";

const port = await getPort({
	portRange: [3000, 3100],
});

const server = createServer(toNodeListener(app));

console.log(`listening on http://localhost:${port}`);

server.listen(port);

if (import.meta.hot) {
	import.meta.hot.dispose(async () => {
		console.log("[dispose]");
		await new Promise((resolve, _) => server.close(resolve));
	});
	import.meta.hot.accept(() => {
		console.log("[accept]");
	});
}
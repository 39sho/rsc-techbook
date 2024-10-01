import {
	createApp,
	createRouter,
	defineEventHandler,
	fromNodeMiddleware,
	sendStream,
	setResponseHeader,
} from "h3";
import { createServer, createViteRuntime } from "vite";
// @ts-expect-error
import { renderToReadableStream } from "react-server-dom-webpack/server.edge";

import { Document } from "../app/Document";
import { App } from "../app/App";

const vite = await createServer({
	configFile: "./vite-browser.config.ts",
});
const runtime = await createViteRuntime(vite);
type Client = typeof import("../node-client");
const client: Client = await runtime.executeUrl("./src/node-client");

const app = createApp();

const router = createRouter();
app.use(router);

app.use(fromNodeMiddleware(vite.middlewares));

router.get(
	"/*",
	defineEventHandler(async (event) => {
		const document = (
			<Document>
				<App />
			</Document>
		);
		const [rscPayload1, rscPayload2]: [ReadableStream, ReadableStream] =
			renderToReadableStream(
				document,
				new Proxy(
					{},
					{
						get(target, prop, receiver) {
							if (typeof prop !== "string")
								return Reflect.get(target, prop, receiver);

							const [, exportName] = prop.split("#");

							return {
								id: prop,
								name: exportName,
								chunks: [],
							};
						},
					},
				),
			).tee();

		const rscText = await new Response(rscPayload2).text();

		const html = (await client.renderToHtml(rscPayload1))
			.pipeThrough(new TextDecoderStream())
			.pipeThrough(
				new TransformStream({
					transform(chunk, controller) {
						controller.enqueue(
							chunk.replace(
								"</body>",
								`<script id="rsc_payload" type="rsc_payload">${rscText}</script></body>`,
							),
						);
					},
				}),
			);

		setResponseHeader(event, "Content-Type", "text/html");
		return sendStream(event, html);
	}),
);

export { app };

import {
	createApp,
	createRouter,
	defineEventHandler,
	fromNodeMiddleware,
	readFormData,
	readBody,
	sendStream,
	setResponseHeader,
	type EventHandlerRequest,
	type H3Event,
} from "h3";
import { createServer, createViteRuntime } from "vite";
import {
	renderToReadableStream,
	decodeReply,
	// @ts-expect-error
} from "react-server-dom-webpack/server.edge";

import { Document } from "../app/Document";
import { App } from "../app/App";
import { rmSync } from "node:fs";

const vite = await createServer({
	configFile: "./vite-client.config.ts",
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

		const htmlReader = (await client.renderToHtml(rscPayload1))
			.pipeThrough(new TextDecoderStream())
			.getReader();

		const rscTextReader = rscPayload2
			.pipeThrough(new TextDecoderStream())
			.pipeThrough(
				new TransformStream({
					transform(chunk, controller) {
						controller.enqueue(
							`<script>globalThis.rsc.push(\`${chunk}\`)</script>`,
						);
					},
					flush(controller) {
						controller.enqueue("<script>globalThis.rsc.end()</script>");
					},
				}),
			)
			.getReader();

		const html = new ReadableStream({
			async pull(controller) {
				const dones = await await [htmlReader, rscTextReader].map((reader) => {
					return reader.read().then((res) => {
						if (res.done) return true;

						controller.enqueue(res.value);
						return false;
					});
				});

				const done = await Promise.allSettled(
					[htmlReader, rscTextReader].map((reader) => {
						return reader.read().then((res) => {
							if (res.done) return true;

							controller.enqueue(res.value);
							return false;
						});
					}),
				);

				if (
					done[0].status === "fulfilled" &&
					done[1].status === "fulfilled" &&
					done[0].value &&
					done[1].value
				)
					controller.close();
			},
			cancel() {
				[htmlReader, rscTextReader].map((reader) => {
					reader.cancel();
				});
			},
		});

		setResponseHeader(event, "Content-Type", "text/html");
		return sendStream(event, html);
	}),
);

const isJson = (arg: string) => {
	try {
		JSON.parse(arg);
		return true;
	} catch (_err) {
		return false;
	}
};

const myReadBody = async (event: H3Event<EventHandlerRequest>) => {
	const res = await readBody<string>(event);
	if (isJson(res)) {
		return res;
	}
	return await readFormData(event);
};

router.post(
	"/action",
	defineEventHandler(async (event) => {
		const ref = event.headers.get("rsc-action");
		if (ref == null) return;
		const [filepath, name] = ref.split("#");
		const action = (await import(filepath))[name];
		const formData = await myReadBody(event);
		const args = await decodeReply(formData);
		const result = await action(...args);
		const rscPayload = renderToReadableStream(
			result,
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
		);

		return sendStream(event, rscPayload);
	}),
);

export { app };

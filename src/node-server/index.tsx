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

const vite = await createServer({
	configFile: "./vite-client.config.ts",
});
const runtime = await createViteRuntime(vite);
type Client = typeof import("../node-client");
const client: Client = await runtime.executeUrl("./src/node-client");

const app = createApp();

app.use(fromNodeMiddleware(vite.middlewares));

const router = createRouter();
app.use(router);

router.get(
	"/",
	defineEventHandler(async (event) => {
		console.log(`request: ${event.node.req.url}`);

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

		type streamData = {
			type: "html" | "rsc";
			chunk: string;
		};

		const htmlReader = (await client.renderToHtml(rscPayload1))
			.pipeThrough(new TextDecoderStream())
			.pipeThrough<streamData>(
				new TransformStream({
					transform(chunk, controller) {
						controller.enqueue({ type: "html", chunk });
					},
				}),
			)
			.getReader();

		const rscTextReader = rscPayload2
			.pipeThrough(new TextDecoderStream())
			.pipeThrough<string>(
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
			.pipeThrough<streamData>(
				new TransformStream({
					transform(chunk, controller) {
						controller.enqueue({ type: "rsc", chunk });
					},
				}),
			)
			.getReader();

		const stock: [
			html: Promise<ReadableStreamReadResult<streamData>>,
			rsc: Promise<ReadableStreamReadResult<streamData>>,
		] = [htmlReader.read(), rscTextReader.read()];

		const html = new ReadableStream({
			async pull(controller) {
				const data = await Promise.race(stock);

				if (data.done) return;

				if (data.value.type === "html") stock[0] = htmlReader.read();
				else stock[1] = rscTextReader.read();

				controller.enqueue(data.value.chunk);
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

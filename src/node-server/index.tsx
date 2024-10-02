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

		// const rscText = await new Response(rscPayload2).text();

		const rscTextReader = rscPayload2
			.pipeThrough(new TextDecoderStream())
			.getReader();

		const html = (await client.renderToHtml(rscPayload1))
			.pipeThrough(new TextDecoderStream())
			.pipeThrough(
				new TransformStream({
					async transform(chunk, controller) {
						if (chunk.indexOf("</body>") === -1) {
							controller.enqueue(chunk);
							return;
						}

						const [before, after] = chunk.split("</body>");

						controller.enqueue(
							`${before}<script id="rsc_payload" type="rsc_payload">`,
						);

						let streamRes = await rscTextReader.read();

						while (!streamRes.done) {
							controller.enqueue(streamRes.value);
							streamRes = await rscTextReader.read();
						}

						controller.enqueue(`</script>${after}`);
					},
				}),
			);

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

import { type FC, type ReactNode, use } from "react";

// @ts-expect-error
import a from "react-dom/server.edge";
const { renderToReadableStream } = a as typeof import("react-dom/server");

// @ts-expect-error
import b from "react-server-dom-webpack/client.edge";
const { createFromReadableStream } = b;

import "../webpack";

const renderToHtml = async (rscPayload: ReadableStream) => {
	const promise: Promise<ReactNode> = createFromReadableStream(rscPayload, {
		ssrManifest: {
			moduleMap: new Proxy(
				{},
				{
					get(_target, prop0) {
						return new Proxy(
							{},
							{
								get(_target, prop1) {
									return {
										id: prop0,
										chunks: [prop0],
										name: prop1,
									};
								},
							},
						);
					},
				},
			),
		},
	});

	const Async: FC = () => use(promise);
	const stream = await renderToReadableStream(<Async />, {
		bootstrapScriptContent: "globalThis.rsc = [];",
		bootstrapModules: ["/src/browser-client/index.tsx"],
	});

	return stream;
};

export { renderToHtml };

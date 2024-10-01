import { type FC, type ReactNode, type Thenable, use } from "react";

// @ts-expect-error
import a from "react-dom/server.edge";
const { renderToReadableStream } = a as typeof import("react-dom/server");

// @ts-expect-error
import b from "react-server-dom-webpack/client.edge";
const { createFromReadableStream } = b;

import "../webpack";

const renderToHtml = async (rscPayload: ReadableStream) => {
	const promise: Thenable<ReactNode> = createFromReadableStream(rscPayload, {
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
	const stream = await renderToReadableStream(<Async />);
	return stream;
};

export { renderToHtml };

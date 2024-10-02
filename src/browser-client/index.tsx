/// <reference lib="dom" />

import { type FC, type ReactNode, use } from "react";
import { hydrateRoot } from "react-dom/client";

import "../webpack";

import {
	createFromReadableStream,
	createFromFetch,
	encodeReply,
	// @ts-expect-error
} from "react-server-dom-webpack/client.browser";

function main(rscPayload: Uint8Array) {
	const promise: Promise<ReactNode> = createFromReadableStream(
		new Response(rscPayload).body,
		{
			async callServer(id: string, args: unknown) {
				const promise = fetch("/action", {
					method: "POST",
					headers: { "rsc-action": id },
					body: await encodeReply(args),
				});
				return createFromFetch(promise);
			},
		},
	);

	const Async: FC = () => use(promise);
	hydrateRoot(document, <Async />);
}

const rscPayload = new TextEncoder().encode(
	// biome-ignore lint/style/noNonNullAssertion: <explanation>
	document.getElementById("rsc_payload")!.textContent!,
);

main(rscPayload);

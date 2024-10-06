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

function main(rscPayload: ReadableStream) {
	const promise: Promise<ReactNode> = createFromReadableStream(rscPayload, {
		async callServer(id: string, args: unknown) {
			const promise = fetch("/action", {
				method: "POST",
				headers: { "rsc-action": id },
				body: await encodeReply(args),
			});
			return createFromFetch(promise);
		},
	});

	const Async: FC = () => use(promise);
	hydrateRoot(document, <Async />);
}

/*
const rscPayload = new TextEncoder().encode(
	// biome-ignore lint/style/noNonNullAssertion: <explanation>
	document.getElementById("rsc_payload")!.textContent!,
);
*/

declare global {
	var rsc: string[];
}

const rscPayload = new ReadableStream({
	start(controller) {
		const encoder = new TextEncoder();

		const initialRsc = globalThis.rsc ?? [];
		for (const chunk of initialRsc) {
			controller.enqueue(encoder.encode(chunk));
		}

		globalThis.rsc = {
			push(chunk: string) {
				controller.enqueue(encoder.encode(chunk));
			},
			end() {
				controller.close();
			},
		} as unknown as string[];
	},
});

main(rscPayload);

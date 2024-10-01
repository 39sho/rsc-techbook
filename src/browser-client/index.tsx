/// <reference lib="dom" />

import { type FC, type ReactNode, type Thenable, use } from "react";
import { hydrateRoot } from "react-dom/client";

import "../webpack";

// @ts-expect-error
import { createFromReadableStream } from "react-server-dom-webpack/client.browser";

function main(rscPayload: Uint8Array) {
	const promise: Thenable<ReactNode> = createFromReadableStream(
		new Response(rscPayload).body,
	);

	const Async: FC = () => use(promise);
	hydrateRoot(document, <Async />);
}

const rscPayload = new TextEncoder().encode(
	// biome-ignore lint/style/noNonNullAssertion: <explanation>
	document.getElementById("rsc_payload")!.textContent!,
);

main(rscPayload);

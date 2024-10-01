import * as Components from "./app/ClientComponents";

// @ts-expect-error
globalThis.__webpack_chunk_load__ = async (chunkId: string) => {
	console.log(`Chunk '${chunkId}' is loaded`);
};

// @ts-expect-error
globalThis.__webpack_require__ = (_chunk) => Components;

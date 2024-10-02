import { defineConfig } from "vite";
import { reactServerPlugin } from "./src/plugins/vite-plugin-react-server";

export default defineConfig({
	resolve: {
		conditions: ["react-server"],
	},
	ssr: {
		optimizeDeps: {
			include: [
				"react/**/*",
				"react-server-dom-webpack/server",
				"react-server-dom-webpack/server.edge",
			],
		},
	},
	plugins: [reactServerPlugin()],
});

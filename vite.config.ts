import { defineConfig } from "vite";
import { reactServerPlugin } from "./src/plugins/vite-plugin-react-server";

export default defineConfig({
	appType: "custom",
	server: {
		middlewareMode: true,
	},
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

// vite.config.ts
import path from "path";
import { defineConfig, loadEnv } from "file:///home/project/node_modules/vite/dist/node/index.js";
import react from "file:///home/project/node_modules/@vitejs/plugin-react/dist/index.js";
var __vite_injected_original_dirname = "/home/project";
var vite_config_default = defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    base: "/",
    plugins: [react()],
    build: {
      assetsDir: "assets"
    },
    resolve: {
      alias: {
        "@": path.resolve(__vite_injected_original_dirname, "src")
      }
    },
    // Explicitly define env variables to make them available in the app
    define: {
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(env.VITE_SUPABASE_URL),
      "import.meta.env.VITE_SUPABASE_ANON_KEY": JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
      "import.meta.env.VITE_DEV_MODE": JSON.stringify(env.VITE_DEV_MODE || "false")
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCB7IGRlZmluZUNvbmZpZywgbG9hZEVudiB9IGZyb20gJ3ZpdGUnO1xuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0JztcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKCh7IG1vZGUgfSkgPT4ge1xuICAvLyBMb2FkIGVudiBmaWxlIGJhc2VkIG9uIGBtb2RlYCBpbiB0aGUgY3VycmVudCB3b3JraW5nIGRpcmVjdG9yeS5cbiAgY29uc3QgZW52ID0gbG9hZEVudihtb2RlLCBwcm9jZXNzLmN3ZCgpLCAnJyk7XG5cbiAgcmV0dXJuIHtcbiAgICBiYXNlOiAnLycsXG4gICAgcGx1Z2luczogW3JlYWN0KCldLFxuICAgIGJ1aWxkOiB7XG4gICAgICBhc3NldHNEaXI6ICdhc3NldHMnXG4gICAgfSxcbiAgICByZXNvbHZlOiB7XG4gICAgICBhbGlhczoge1xuICAgICAgICAnQCc6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICdzcmMnKVxuICAgICAgfVxuICAgIH0sXG4gICAgLy8gRXhwbGljaXRseSBkZWZpbmUgZW52IHZhcmlhYmxlcyB0byBtYWtlIHRoZW0gYXZhaWxhYmxlIGluIHRoZSBhcHBcbiAgICBkZWZpbmU6IHtcbiAgICAgICdpbXBvcnQubWV0YS5lbnYuVklURV9TVVBBQkFTRV9VUkwnOiBKU09OLnN0cmluZ2lmeShlbnYuVklURV9TVVBBQkFTRV9VUkwpLFxuICAgICAgJ2ltcG9ydC5tZXRhLmVudi5WSVRFX1NVUEFCQVNFX0FOT05fS0VZJzogSlNPTi5zdHJpbmdpZnkoZW52LlZJVEVfU1VQQUJBU0VfQU5PTl9LRVkpLFxuICAgICAgJ2ltcG9ydC5tZXRhLmVudi5WSVRFX0RFVl9NT0RFJzogSlNPTi5zdHJpbmdpZnkoZW52LlZJVEVfREVWX01PREUgfHwgJ2ZhbHNlJyksXG4gICAgfVxuICB9O1xufSk7Il0sCiAgIm1hcHBpbmdzIjogIjtBQUF5TixPQUFPLFVBQVU7QUFDMU8sU0FBUyxjQUFjLGVBQWU7QUFDdEMsT0FBTyxXQUFXO0FBRmxCLElBQU0sbUNBQW1DO0FBSXpDLElBQU8sc0JBQVEsYUFBYSxDQUFDLEVBQUUsS0FBSyxNQUFNO0FBRXhDLFFBQU0sTUFBTSxRQUFRLE1BQU0sUUFBUSxJQUFJLEdBQUcsRUFBRTtBQUUzQyxTQUFPO0FBQUEsSUFDTCxNQUFNO0FBQUEsSUFDTixTQUFTLENBQUMsTUFBTSxDQUFDO0FBQUEsSUFDakIsT0FBTztBQUFBLE1BQ0wsV0FBVztBQUFBLElBQ2I7QUFBQSxJQUNBLFNBQVM7QUFBQSxNQUNQLE9BQU87QUFBQSxRQUNMLEtBQUssS0FBSyxRQUFRLGtDQUFXLEtBQUs7QUFBQSxNQUNwQztBQUFBLElBQ0Y7QUFBQTtBQUFBLElBRUEsUUFBUTtBQUFBLE1BQ04scUNBQXFDLEtBQUssVUFBVSxJQUFJLGlCQUFpQjtBQUFBLE1BQ3pFLDBDQUEwQyxLQUFLLFVBQVUsSUFBSSxzQkFBc0I7QUFBQSxNQUNuRixpQ0FBaUMsS0FBSyxVQUFVLElBQUksaUJBQWlCLE9BQU87QUFBQSxJQUM5RTtBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=

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
    publicDir: "public",
    build: {
      assetsDir: "assets",
      // Code splitting configuration
      rollupOptions: {
        output: {
          manualChunks: {
            // Vendor chunks
            "react-vendor": ["react", "react-dom", "react-router-dom"],
            "supabase-vendor": ["@supabase/supabase-js"],
            "form-vendor": ["react-hook-form", "@hookform/resolvers", "yup"],
            // UI chunks
            "ui-vendor": ["framer-motion", "lucide-react"],
            // Utility chunks
            "utils-vendor": ["date-fns", "dompurify", "qrcode", "otplib"]
          }
        }
      },
      // Chunk size warnings
      chunkSizeWarningLimit: 1e3,
      // Minification (esbuild is faster and doesn't need extra deps)
      minify: "esbuild",
      // Source maps for debugging (disable in production)
      sourcemap: mode !== "production"
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCB7IGRlZmluZUNvbmZpZywgbG9hZEVudiB9IGZyb20gJ3ZpdGUnO1xuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0JztcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKCh7IG1vZGUgfSkgPT4ge1xuICAvLyBMb2FkIGVudiBmaWxlIGJhc2VkIG9uIGBtb2RlYCBpbiB0aGUgY3VycmVudCB3b3JraW5nIGRpcmVjdG9yeS5cbiAgY29uc3QgZW52ID0gbG9hZEVudihtb2RlLCBwcm9jZXNzLmN3ZCgpLCAnJyk7XG5cbiAgcmV0dXJuIHtcbiAgICBiYXNlOiAnLycsXG4gICAgcGx1Z2luczogW3JlYWN0KCldLFxuICAgIHB1YmxpY0RpcjogJ3B1YmxpYycsXG4gICAgYnVpbGQ6IHtcbiAgICAgIGFzc2V0c0RpcjogJ2Fzc2V0cycsXG4gICAgICAvLyBDb2RlIHNwbGl0dGluZyBjb25maWd1cmF0aW9uXG4gICAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICAgIG91dHB1dDoge1xuICAgICAgICAgIG1hbnVhbENodW5rczoge1xuICAgICAgICAgICAgLy8gVmVuZG9yIGNodW5rc1xuICAgICAgICAgICAgJ3JlYWN0LXZlbmRvcic6IFsncmVhY3QnLCAncmVhY3QtZG9tJywgJ3JlYWN0LXJvdXRlci1kb20nXSxcbiAgICAgICAgICAgICdzdXBhYmFzZS12ZW5kb3InOiBbJ0BzdXBhYmFzZS9zdXBhYmFzZS1qcyddLFxuICAgICAgICAgICAgJ2Zvcm0tdmVuZG9yJzogWydyZWFjdC1ob29rLWZvcm0nLCAnQGhvb2tmb3JtL3Jlc29sdmVycycsICd5dXAnXSxcbiAgICAgICAgICAgIC8vIFVJIGNodW5rc1xuICAgICAgICAgICAgJ3VpLXZlbmRvcic6IFsnZnJhbWVyLW1vdGlvbicsICdsdWNpZGUtcmVhY3QnXSxcbiAgICAgICAgICAgIC8vIFV0aWxpdHkgY2h1bmtzXG4gICAgICAgICAgICAndXRpbHMtdmVuZG9yJzogWydkYXRlLWZucycsICdkb21wdXJpZnknLCAncXJjb2RlJywgJ290cGxpYiddLFxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIC8vIENodW5rIHNpemUgd2FybmluZ3NcbiAgICAgIGNodW5rU2l6ZVdhcm5pbmdMaW1pdDogMTAwMCxcbiAgICAgIC8vIE1pbmlmaWNhdGlvbiAoZXNidWlsZCBpcyBmYXN0ZXIgYW5kIGRvZXNuJ3QgbmVlZCBleHRyYSBkZXBzKVxuICAgICAgbWluaWZ5OiAnZXNidWlsZCcsXG4gICAgICAvLyBTb3VyY2UgbWFwcyBmb3IgZGVidWdnaW5nIChkaXNhYmxlIGluIHByb2R1Y3Rpb24pXG4gICAgICBzb3VyY2VtYXA6IG1vZGUgIT09ICdwcm9kdWN0aW9uJ1xuICAgIH0sXG4gICAgcmVzb2x2ZToge1xuICAgICAgYWxpYXM6IHtcbiAgICAgICAgJ0AnOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnc3JjJylcbiAgICAgIH1cbiAgICB9LFxuICAgIC8vIEV4cGxpY2l0bHkgZGVmaW5lIGVudiB2YXJpYWJsZXMgdG8gbWFrZSB0aGVtIGF2YWlsYWJsZSBpbiB0aGUgYXBwXG4gICAgZGVmaW5lOiB7XG4gICAgICAnaW1wb3J0Lm1ldGEuZW52LlZJVEVfU1VQQUJBU0VfVVJMJzogSlNPTi5zdHJpbmdpZnkoZW52LlZJVEVfU1VQQUJBU0VfVVJMKSxcbiAgICAgICdpbXBvcnQubWV0YS5lbnYuVklURV9TVVBBQkFTRV9BTk9OX0tFWSc6IEpTT04uc3RyaW5naWZ5KGVudi5WSVRFX1NVUEFCQVNFX0FOT05fS0VZKSxcbiAgICAgICdpbXBvcnQubWV0YS5lbnYuVklURV9ERVZfTU9ERSc6IEpTT04uc3RyaW5naWZ5KGVudi5WSVRFX0RFVl9NT0RFIHx8ICdmYWxzZScpLFxuICAgIH1cbiAgfTtcbn0pOyJdLAogICJtYXBwaW5ncyI6ICI7QUFBeU4sT0FBTyxVQUFVO0FBQzFPLFNBQVMsY0FBYyxlQUFlO0FBQ3RDLE9BQU8sV0FBVztBQUZsQixJQUFNLG1DQUFtQztBQUl6QyxJQUFPLHNCQUFRLGFBQWEsQ0FBQyxFQUFFLEtBQUssTUFBTTtBQUV4QyxRQUFNLE1BQU0sUUFBUSxNQUFNLFFBQVEsSUFBSSxHQUFHLEVBQUU7QUFFM0MsU0FBTztBQUFBLElBQ0wsTUFBTTtBQUFBLElBQ04sU0FBUyxDQUFDLE1BQU0sQ0FBQztBQUFBLElBQ2pCLFdBQVc7QUFBQSxJQUNYLE9BQU87QUFBQSxNQUNMLFdBQVc7QUFBQTtBQUFBLE1BRVgsZUFBZTtBQUFBLFFBQ2IsUUFBUTtBQUFBLFVBQ04sY0FBYztBQUFBO0FBQUEsWUFFWixnQkFBZ0IsQ0FBQyxTQUFTLGFBQWEsa0JBQWtCO0FBQUEsWUFDekQsbUJBQW1CLENBQUMsdUJBQXVCO0FBQUEsWUFDM0MsZUFBZSxDQUFDLG1CQUFtQix1QkFBdUIsS0FBSztBQUFBO0FBQUEsWUFFL0QsYUFBYSxDQUFDLGlCQUFpQixjQUFjO0FBQUE7QUFBQSxZQUU3QyxnQkFBZ0IsQ0FBQyxZQUFZLGFBQWEsVUFBVSxRQUFRO0FBQUEsVUFDOUQ7QUFBQSxRQUNGO0FBQUEsTUFDRjtBQUFBO0FBQUEsTUFFQSx1QkFBdUI7QUFBQTtBQUFBLE1BRXZCLFFBQVE7QUFBQTtBQUFBLE1BRVIsV0FBVyxTQUFTO0FBQUEsSUFDdEI7QUFBQSxJQUNBLFNBQVM7QUFBQSxNQUNQLE9BQU87QUFBQSxRQUNMLEtBQUssS0FBSyxRQUFRLGtDQUFXLEtBQUs7QUFBQSxNQUNwQztBQUFBLElBQ0Y7QUFBQTtBQUFBLElBRUEsUUFBUTtBQUFBLE1BQ04scUNBQXFDLEtBQUssVUFBVSxJQUFJLGlCQUFpQjtBQUFBLE1BQ3pFLDBDQUEwQyxLQUFLLFVBQVUsSUFBSSxzQkFBc0I7QUFBQSxNQUNuRixpQ0FBaUMsS0FBSyxVQUFVLElBQUksaUJBQWlCLE9BQU87QUFBQSxJQUM5RTtBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=

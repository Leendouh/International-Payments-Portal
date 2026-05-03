// vite.config.js
import { defineConfig } from "file:///C:/Users/zwane/OneDrive/Documents/htdocs/InternationalPaymentsPortal/frontend/node_modules/.pnpm/vite@4.5.14_@types+node@24.12.2/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/zwane/OneDrive/Documents/htdocs/InternationalPaymentsPortal/frontend/node_modules/.pnpm/@vitejs+plugin-react@3.1.0_vite@4.5.14_@types+node@24.12.2_/node_modules/@vitejs/plugin-react/dist/index.mjs";
var vite_config_default = defineConfig({
  plugins: [react()],
  server: {
    https: true,
    // Enable HTTPS to match backend
    host: "0.0.0.0",
    port: 3e3,
    proxy: {
      "/api": {
        target: "https://localhost:8443",
        changeOrigin: true,
        secure: false
      }
    }
  },
  esbuild: {
    loader: "jsx",
    include: /src\/.*\.[jt]sx?$/,
    exclude: []
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFx6d2FuZVxcXFxPbmVEcml2ZVxcXFxEb2N1bWVudHNcXFxcaHRkb2NzXFxcXEludGVybmF0aW9uYWxQYXltZW50c1BvcnRhbFxcXFxmcm9udGVuZFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcendhbmVcXFxcT25lRHJpdmVcXFxcRG9jdW1lbnRzXFxcXGh0ZG9jc1xcXFxJbnRlcm5hdGlvbmFsUGF5bWVudHNQb3J0YWxcXFxcZnJvbnRlbmRcXFxcdml0ZS5jb25maWcuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL3p3YW5lL09uZURyaXZlL0RvY3VtZW50cy9odGRvY3MvSW50ZXJuYXRpb25hbFBheW1lbnRzUG9ydGFsL2Zyb250ZW5kL3ZpdGUuY29uZmlnLmpzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSdcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCdcblxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIHBsdWdpbnM6IFtyZWFjdCgpXSxcbiAgc2VydmVyOiB7XG4gICAgaHR0cHM6IHRydWUsIC8vIEVuYWJsZSBIVFRQUyB0byBtYXRjaCBiYWNrZW5kXG4gICAgaG9zdDogJzAuMC4wLjAnLFxuICAgIHBvcnQ6IDMwMDAsXG4gICAgcHJveHk6IHtcbiAgICAgICcvYXBpJzoge1xuICAgICAgICB0YXJnZXQ6ICdodHRwczovL2xvY2FsaG9zdDo4NDQzJyxcbiAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxuICAgICAgICBzZWN1cmU6IGZhbHNlXG4gICAgICB9XG4gICAgfVxuICB9LFxuICBlc2J1aWxkOiB7XG4gICAgbG9hZGVyOiAnanN4JyxcbiAgICBpbmNsdWRlOiAvc3JjXFwvLipcXC5banRdc3g/JC8sXG4gICAgZXhjbHVkZTogW11cbiAgfVxufSlcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBeWEsU0FBUyxvQkFBb0I7QUFDdGMsT0FBTyxXQUFXO0FBR2xCLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLFNBQVMsQ0FBQyxNQUFNLENBQUM7QUFBQSxFQUNqQixRQUFRO0FBQUEsSUFDTixPQUFPO0FBQUE7QUFBQSxJQUNQLE1BQU07QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLE9BQU87QUFBQSxNQUNMLFFBQVE7QUFBQSxRQUNOLFFBQVE7QUFBQSxRQUNSLGNBQWM7QUFBQSxRQUNkLFFBQVE7QUFBQSxNQUNWO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNQLFFBQVE7QUFBQSxJQUNSLFNBQVM7QUFBQSxJQUNULFNBQVMsQ0FBQztBQUFBLEVBQ1o7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=

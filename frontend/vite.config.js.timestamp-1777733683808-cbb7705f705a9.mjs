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
    strictPort: true,
    // Don't auto-increment port if occupied
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFx6d2FuZVxcXFxPbmVEcml2ZVxcXFxEb2N1bWVudHNcXFxcaHRkb2NzXFxcXEludGVybmF0aW9uYWxQYXltZW50c1BvcnRhbFxcXFxmcm9udGVuZFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcendhbmVcXFxcT25lRHJpdmVcXFxcRG9jdW1lbnRzXFxcXGh0ZG9jc1xcXFxJbnRlcm5hdGlvbmFsUGF5bWVudHNQb3J0YWxcXFxcZnJvbnRlbmRcXFxcdml0ZS5jb25maWcuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL3p3YW5lL09uZURyaXZlL0RvY3VtZW50cy9odGRvY3MvSW50ZXJuYXRpb25hbFBheW1lbnRzUG9ydGFsL2Zyb250ZW5kL3ZpdGUuY29uZmlnLmpzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSdcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCdcblxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIHBsdWdpbnM6IFtyZWFjdCgpXSxcbiAgc2VydmVyOiB7XG4gICAgaHR0cHM6IHRydWUsIC8vIEVuYWJsZSBIVFRQUyB0byBtYXRjaCBiYWNrZW5kXG4gICAgaG9zdDogJzAuMC4wLjAnLFxuICAgIHBvcnQ6IDMwMDAsXG4gICAgc3RyaWN0UG9ydDogdHJ1ZSwgLy8gRG9uJ3QgYXV0by1pbmNyZW1lbnQgcG9ydCBpZiBvY2N1cGllZFxuICAgIHByb3h5OiB7XG4gICAgICAnL2FwaSc6IHtcbiAgICAgICAgdGFyZ2V0OiAnaHR0cHM6Ly9sb2NhbGhvc3Q6ODQ0MycsXG4gICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcbiAgICAgICAgc2VjdXJlOiBmYWxzZVxuICAgICAgfVxuICAgIH1cbiAgfSxcbiAgZXNidWlsZDoge1xuICAgIGxvYWRlcjogJ2pzeCcsXG4gICAgaW5jbHVkZTogL3NyY1xcLy4qXFwuW2p0XXN4PyQvLFxuICAgIGV4Y2x1ZGU6IFtdXG4gIH1cbn0pXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXlhLFNBQVMsb0JBQW9CO0FBQ3RjLE9BQU8sV0FBVztBQUdsQixJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTLENBQUMsTUFBTSxDQUFDO0FBQUEsRUFDakIsUUFBUTtBQUFBLElBQ04sT0FBTztBQUFBO0FBQUEsSUFDUCxNQUFNO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixZQUFZO0FBQUE7QUFBQSxJQUNaLE9BQU87QUFBQSxNQUNMLFFBQVE7QUFBQSxRQUNOLFFBQVE7QUFBQSxRQUNSLGNBQWM7QUFBQSxRQUNkLFFBQVE7QUFBQSxNQUNWO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNQLFFBQVE7QUFBQSxJQUNSLFNBQVM7QUFBQSxJQUNULFNBQVMsQ0FBQztBQUFBLEVBQ1o7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=

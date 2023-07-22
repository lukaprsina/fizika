// vite.config.ts
import solid from "file:///D:/dev/rust/fizika/web/node_modules/.pnpm/solid-start@0.2.27_@solidjs+meta@0.28.5_@solidjs+router@0.8.2_solid-js@1.7.8_solid-start-node_tphwjd3ndeluam3ca2whf2h34e/node_modules/solid-start/vite/plugin.js";
import { defineConfig } from "file:///D:/dev/rust/fizika/web/node_modules/.pnpm/vite@4.4.6_@types+node@20.4.4_sass@1.64.1/node_modules/vite/dist/node/index.js";
import copy from "file:///D:/dev/rust/fizika/web/node_modules/.pnpm/rollup-plugin-copy@3.4.0/node_modules/rollup-plugin-copy/dist/index.commonjs.js";
import suid from "file:///D:/dev/rust/fizika/web/node_modules/.pnpm/@suid+vite-plugin@0.1.4_vite@4.4.6/node_modules/@suid/vite-plugin/index.mjs";
import vercel from "file:///D:/dev/rust/fizika/web/node_modules/.pnpm/solid-start-vercel@0.2.27_solid-start@0.2.27_vite@4.4.6/node_modules/solid-start-vercel/index.js";
var vite_config_default = defineConfig(() => {
  return {
    plugins: [
      suid(),
      solid({ ssr: true, adapter: vercel({ edge: false }) }),
      copy({
        targets: [
          {
            src: "node_modules/mathlive/dist/fonts",
            dest: "public/node_modules/.vite/deps"
          },
          {
            src: "node_modules/mathlive/dist/sounds",
            dest: "public/node_modules/.vite/deps"
          },
          {
            src: "node_modules/mathlive/dist/mathlive-fonts.css",
            dest: "public/node_modules/.vite/deps"
          },
          {
            src: "node_modules/mathlive/dist/mathlive-static.css",
            dest: "public/node_modules/.vite/deps"
          }
        ]
      })
    ],
    ssr: { external: ["@prisma/client"] }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFxkZXZcXFxccnVzdFxcXFxmaXppa2FcXFxcd2ViXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJEOlxcXFxkZXZcXFxccnVzdFxcXFxmaXppa2FcXFxcd2ViXFxcXHZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9EOi9kZXYvcnVzdC9maXppa2Evd2ViL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHNvbGlkIGZyb20gXCJzb2xpZC1zdGFydC92aXRlXCI7XG5pbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IGNvcHkgZnJvbSAncm9sbHVwLXBsdWdpbi1jb3B5J1xuaW1wb3J0IHN1aWQgZnJvbSBcIkBzdWlkL3ZpdGUtcGx1Z2luXCI7XG5pbXBvcnQgdmVyY2VsIGZyb20gXCJzb2xpZC1zdGFydC12ZXJjZWxcIjtcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKCgpID0+IHtcbiAgcmV0dXJuIHtcbiAgICBwbHVnaW5zOiBbXG4gICAgICBzdWlkKCksXG4gICAgICBzb2xpZCh7IHNzcjogdHJ1ZSwgYWRhcHRlcjogdmVyY2VsKHsgZWRnZTogZmFsc2UgfSkgfSksXG4gICAgICBjb3B5KHtcbiAgICAgICAgdGFyZ2V0czogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIHNyYzogJ25vZGVfbW9kdWxlcy9tYXRobGl2ZS9kaXN0L2ZvbnRzJyxcbiAgICAgICAgICAgIGRlc3Q6ICdwdWJsaWMvbm9kZV9tb2R1bGVzLy52aXRlL2RlcHMnXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBzcmM6ICdub2RlX21vZHVsZXMvbWF0aGxpdmUvZGlzdC9zb3VuZHMnLFxuICAgICAgICAgICAgZGVzdDogJ3B1YmxpYy9ub2RlX21vZHVsZXMvLnZpdGUvZGVwcydcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIHNyYzogJ25vZGVfbW9kdWxlcy9tYXRobGl2ZS9kaXN0L21hdGhsaXZlLWZvbnRzLmNzcycsXG4gICAgICAgICAgICBkZXN0OiAncHVibGljL25vZGVfbW9kdWxlcy8udml0ZS9kZXBzJ1xuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgc3JjOiAnbm9kZV9tb2R1bGVzL21hdGhsaXZlL2Rpc3QvbWF0aGxpdmUtc3RhdGljLmNzcycsXG4gICAgICAgICAgICBkZXN0OiAncHVibGljL25vZGVfbW9kdWxlcy8udml0ZS9kZXBzJ1xuICAgICAgICAgIH0sXG4gICAgICAgIF1cbiAgICAgIH0pXG4gICAgXSxcbiAgICBzc3I6IHsgZXh0ZXJuYWw6IFtcIkBwcmlzbWEvY2xpZW50XCJdIH0sXG4gIH07XG59KTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBOFAsT0FBTyxXQUFXO0FBQ2hSLFNBQVMsb0JBQW9CO0FBQzdCLE9BQU8sVUFBVTtBQUNqQixPQUFPLFVBQVU7QUFDakIsT0FBTyxZQUFZO0FBRW5CLElBQU8sc0JBQVEsYUFBYSxNQUFNO0FBQ2hDLFNBQU87QUFBQSxJQUNMLFNBQVM7QUFBQSxNQUNQLEtBQUs7QUFBQSxNQUNMLE1BQU0sRUFBRSxLQUFLLE1BQU0sU0FBUyxPQUFPLEVBQUUsTUFBTSxNQUFNLENBQUMsRUFBRSxDQUFDO0FBQUEsTUFDckQsS0FBSztBQUFBLFFBQ0gsU0FBUztBQUFBLFVBQ1A7QUFBQSxZQUNFLEtBQUs7QUFBQSxZQUNMLE1BQU07QUFBQSxVQUNSO0FBQUEsVUFDQTtBQUFBLFlBQ0UsS0FBSztBQUFBLFlBQ0wsTUFBTTtBQUFBLFVBQ1I7QUFBQSxVQUNBO0FBQUEsWUFDRSxLQUFLO0FBQUEsWUFDTCxNQUFNO0FBQUEsVUFDUjtBQUFBLFVBQ0E7QUFBQSxZQUNFLEtBQUs7QUFBQSxZQUNMLE1BQU07QUFBQSxVQUNSO0FBQUEsUUFDRjtBQUFBLE1BQ0YsQ0FBQztBQUFBLElBQ0g7QUFBQSxJQUNBLEtBQUssRUFBRSxVQUFVLENBQUMsZ0JBQWdCLEVBQUU7QUFBQSxFQUN0QztBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==

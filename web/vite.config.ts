import solid from "solid-start/vite";
import { defineConfig } from "vite";
import copy from 'rollup-plugin-copy'
import suid from "@suid/vite-plugin";
// import vercel from "solid-start-vercel";

export default defineConfig(() => {
  return {
    plugins: [
      suid(),
      solid({
        ssr: true, /* adapter: vercel({
          edge: false, excludes: [
            "/public/gradivo",
            "/gradivo",
            "public/gradivo",
            "gradivo"
          ]
        }) */
      }),
      copy({
        targets: [
          {
            src: 'node_modules/mathlive/dist/fonts',
            dest: 'public/node_modules/.vite/deps'
          },
          {
            src: 'node_modules/mathlive/dist/sounds',
            dest: 'public/node_modules/.vite/deps'
          },
          {
            src: 'node_modules/mathlive/dist/mathlive-fonts.css',
            dest: 'public/node_modules/.vite/deps'
          },
          {
            src: 'node_modules/mathlive/dist/mathlive-static.css',
            dest: 'public/node_modules/.vite/deps'
          },
        ]
      })
    ],
    ssr: { external: ["@prisma/client"] },
  };
});

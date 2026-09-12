const esbuild = require("esbuild");

esbuild.buildSync({
  entryPoints: ["plasma-background.jsx"],
  bundle: true,
  nodePaths: (process.env.NODE_PATH || "").split(require("path").delimiter).filter(Boolean),
  minify: true,
  define: { "process.env.NODE_ENV": '"production"' },
  outfile: "plasma-background.js",
});

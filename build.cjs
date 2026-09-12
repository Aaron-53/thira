const esbuild = require("esbuild");

esbuild.buildSync({
  entryPoints: ["plasma-background.jsx"],
  bundle: true,
  minify: true,
  define: { "process.env.NODE_ENV": '"production"' },
  outfile: "plasma-background.js",
});

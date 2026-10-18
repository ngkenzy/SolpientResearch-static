/** Static export: `npm run build` writes plain HTML/CSS into `out/`. */
const nextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;

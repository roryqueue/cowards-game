/** @type {import("next").NextConfig} */
const nextConfig = {
  serverExternalPackages: ["pg"],
  transpilePackages: [
    "@cowards/persistence",
    "@cowards/replay",
    "@cowards/runtime-js",
    "@cowards/spec",
  ],
}

export default nextConfig

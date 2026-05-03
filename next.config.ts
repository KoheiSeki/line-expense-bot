import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	allowedDevOrigins: ["curler-pedigree-squire.ngrok-free.dev"],
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "profile.line-scdn.net",
			},
		],
	},
};

export default nextConfig;

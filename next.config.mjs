/** @type {import('next').NextConfig} */
const nextConfig = {
    // self-contained server bundle for the Docker image (.next/standalone)
    output: "standalone",
    async redirects() {
        return [{ source: "/login", destination: "/auth/login", permanent: false }];
    },
};

export default nextConfig;

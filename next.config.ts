import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';
 
const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: ["assets.aceternity.com", "media.licdn.com"],
  },
};
 
const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
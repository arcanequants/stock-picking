import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  async redirects() {
    return [
      /**
       * /es/privacy and /es/terms were real, indexed pages before the routing
       * migration (they lived in src/app/es/). Spanish is now unprefixed, and
       * next-intl already 307s any /es/* path to its canonical form — but a
       * 307 is a *temporary* redirect, and for two URLs Google has in its
       * index the permanent 308 consolidates them faster and passes signals
       * without ambiguity.
       */
      { source: "/es/privacy", destination: "/privacy", permanent: true },
      { source: "/es/terms", destination: "/terms", permanent: true },
    ];
  },
};

export default withNextIntl(nextConfig);

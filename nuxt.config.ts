import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  modules: ['nuxt-auth-utils', 'shadcn-nuxt'],
  // No global CSS: marketing, Tap Page and admin each load their own styles (spec §3 "Style isolation").
  // Tailwind is imported only by app/layouts/admin.vue.
  css: [],
  // Keep whitespace exactly as authored so ported markup renders like the design files.
  vue: { compilerOptions: { whitespace: 'preserve' } },
  app: { head: { htmlAttrs: { lang: 'en' } } },
  vite: { plugins: [tailwindcss()] },
  shadcn: { prefix: '', componentDir: './app/components/ui' },
  routeRules: {
    '/admin': { ssr: false },
    '/admin/**': { ssr: false },
    '/_preview/**': { ssr: false },
  },
  runtimeConfig: {
    // Secure cookie by default; e2e runs over http://localhost and sets NUXT_SESSION_COOKIE_SECURE=false.
    session: { cookie: { secure: true } },
    public: { baseUrl: '' }, // NUXT_PUBLIC_BASE_URL — the host written on chips and QR codes
  },
})

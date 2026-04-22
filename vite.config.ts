import { fileURLToPath, URL } from 'node:url'
import { ServerOptions } from 'https'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig(async ({ mode }) => {
  Object.assign(process.env, loadEnv(mode, process.cwd(), ''))

  /** Read HTTPS cert and key, if their paths are specified in env. */
  async function getHttpsOptions(): Promise<ServerOptions | undefined> {
    if (process.env.DEV_HTTPS_KEY && process.env.DEV_HTTPS_CERT) {
      const fs = await import('fs')
      //console.log('getHttpsOptions:', fs.readFileSync(process.env.DEV_HTTPS_KEY))
      return {
        key: fs.readFileSync(process.env.DEV_HTTPS_KEY),
        cert: fs.readFileSync(process.env.DEV_HTTPS_CERT),
      }
    }
  }

  return {
    plugins: [vue(), vueDevTools()],
    base: '/karplabb/',
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      allowedHosts: ['karplabb.spraakbanken.gu.se'],
      host: 'karplabb.spraakbanken.gu.se',
      https: await getHttpsOptions(),
      port: 5173,
    },
  }
})

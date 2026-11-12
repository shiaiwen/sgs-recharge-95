import path from 'path'
import { defineConfig, type UserConfigExport } from '@tarojs/cli'
import devConfig from './dev'
import prodConfig from './prod'

/** 官方支付只接受 sanguosha.com 来源。本地代理把 Origin 改成官网域，避免 403。 */
const OFFICIAL_SITE_ORIGIN = 'https://web.sanguosha.com'

export default defineConfig<'vite'>(async (merge) => {
  const baseConfig: UserConfigExport<'vite'> = {
    projectName: 'sanguosha-recharge-miniprogram',
    date: '2026-9-8',
    designWidth: 750,
    deviceRatio: {
      640: 2.34 / 2,
      750: 1,
      375: 2,
      828: 1.81 / 2
    },
    sourceRoot: 'src',
    outputRoot: 'dist',
    plugins: [],
    defineConstants: {},
    alias: {
      '@': path.resolve(__dirname, '..', 'src')
    },
    copy: {
      patterns: [
        { from: 'src/assets/tabbar/', to: 'dist/assets/tabbar/' }
      ],
      options: {}
    },
    framework: 'react',
    compiler: 'vite',
    sassLoaderOption: {
      silenceDeprecations: ['legacy-js-api']
    },
    mini: {
      postcss: {
        pxtransform: {
          enable: true,
          config: {}
        },
        cssModules: {
          enable: false,
          config: {
            namingPattern: 'module',
            generateScopedName: '[name]__[local]___[hash:base64:5]'
          }
        }
      }
    },
    h5: {
      devServer: {
        port: 10087,
        host: '0.0.0.0',
        // 本地 H5 开发时把 /ol-payment 转到官方支付，和生产 Nginx 代理一致。
        proxy: {
          '/ol-payment': {
            target: 'https://ol-payment.sanguosha.com',
            changeOrigin: true,
            secure: true,
            rewrite: (requestPath: string) => requestPath.replace(/^\/ol-payment/, ''),
            configure: (proxy) => {
              proxy.on('proxyReq', (proxyReq) => {
                proxyReq.setHeader('Origin', OFFICIAL_SITE_ORIGIN)
                proxyReq.setHeader('Referer', `${OFFICIAL_SITE_ORIGIN}/`)
                proxyReq.removeHeader('cookie')
              })
            }
          }
        }
      },
      publicPath: '/',
      staticDirectory: 'static',
      postcss: {
        autoprefixer: {
          enable: true,
          config: {}
        },
        cssModules: {
          enable: false,
          config: {
            namingPattern: 'module',
            generateScopedName: '[name]__[local]___[hash:base64:5]'
          }
        }
      }
    }
  }

  if (process.env.NODE_ENV === 'development') {
    return merge({}, baseConfig, devConfig)
  }
  return merge({}, baseConfig, prodConfig)
})

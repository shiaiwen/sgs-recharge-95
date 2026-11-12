# 三国杀95折充值 - Easier to Be a Whale

Taro 4 + React 微信小程序骨架。

- 账号管理：本地添加 / 删除账号
- 充值：按账号或备注模糊匹配，输入元宝后选择微信 / 支付宝
- 微信支付：先创建订单，再根据订单号获取二维码

微信小程序发布前，需要确认 `ol-payment.sanguosha.com` 可以配置为小程序的
`request` 合法域名。

H5 通过本站 `/ol-payment` 代理官方支付，避免浏览器跨域。官方接口会校验 Origin，代理必须把来源改成 `web.sanguosha.com`，否则会 403。服务器 Nginx 需要加入
`deploy/nginx-ol-payment.conf` 里的那段配置，然后 `nginx -t && nginx -s reload`。

```bash
npm run dev:h5
```

微信小程序：

```bash
npm run dev:weapp
```

用微信开发者工具打开项目根目录，编译产物在 `dist/`。

**发布**

```bash
npm run build:h5
npm run deploy
```


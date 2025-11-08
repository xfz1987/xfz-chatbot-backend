# Backend 部署到 Cloudflare Workers 指南

本文档将指导你一步步将后端 API 部署到 Cloudflare Workers。

## 前提条件

- ✅ 已安装 Node.js 和 npm
- ✅ 已安装 wrangler CLI
- ✅ 拥有 Cloudflare 账户
- ✅ 拥有 OpenAI API Key

## 第一步: 登录 Cloudflare

在终端执行:

```bash
npx wrangler login
```

这会打开浏览器,登录你的 Cloudflare 账户并授权。

验证登录状态:

```bash
npx wrangler whoami
```

## 第二步: 配置生产环境的 Secret

设置 OpenAI API Key (生产环境):

```bash
npx wrangler secret put OPENAI_API_KEY
```

执行后会提示你输入 API Key,粘贴你的 OpenAI API Key 并回车。

> **注意**: Secret 是加密存储的,不会出现在代码或配置文件中。

## 第三步: 检查配置文件

查看 `wrangler.toml` 文件,确认配置正确:

```toml
name = "xfz-chatbot-backend"
main = "src/index.ts"
compatibility_date = "2024-01-01"
```

可选: 如果想自定义 Worker 名称,修改 `name` 字段。

## 第四步: 部署到 Cloudflare Workers

执行部署命令:

```bash
npm run deploy
```

或者直接使用:

```bash
wrangler deploy
```

部署成功后,你会看到类似输出:

```
✨ Success! Uploaded to Cloudflare Workers
   https://xfz-chatbot-backend.your-subdomain.workers.dev
```

**记录这个 URL!** 你需要在前端配置中使用它。

## 第五步: 测试部署的 API

### 测试 1: Hello Query

```bash
curl -X POST https://xfz-chatbot-backend.your-subdomain.workers.dev/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ hello }"}'
```

预期响应:

```json
{ "data": { "hello": "Hello from Cloudflare Workers!" } }
```

### 测试 2: Chat Mutation

```bash
curl -X POST https://xfz-chatbot-backend.your-subdomain.workers.dev/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"mutation { chat(message: \"你好\") { message timestamp } }"}'
```

预期响应:

```json
{
  "data": {
    "chat": {
      "message": "你好!我是...",
      "timestamp": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

## 第六步: 配置自定义域名(可选)

### 6.1 在 Cloudflare Dashboard 配置

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 **Workers & Pages**
3. 选择你的 Worker (`xfz-chatbot-backend`)
4. 点击 **Triggers** 标签
5. 在 **Custom Domains** 部分点击 **Add Custom Domain**
6. 输入域名,如: `api.yourdomain.com`
7. 点击 **Add Custom Domain**

### 6.2 通过 wrangler.toml 配置

编辑 `wrangler.toml`:

```toml
name = "xfz-chatbot-backend"
main = "src/index.ts"
compatibility_date = "2024-01-01"

# 添加自定义域名路由
routes = [
  { pattern = "api.yourdomain.com/*", zone_name = "yourdomain.com" }
]
```

然后重新部署:

```bash
npm run deploy
```

## 第七步: 监控和日志

### 查看实时日志

```bash
npm run tail
```

或:

```bash
wrangler tail
```

### 在 Dashboard 查看

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 **Workers & Pages**
3. 选择 `xfz-chatbot-backend`
4. 查看 **Metrics** (请求数、错误率、响应时间等)
5. 查看 **Logs** (实时日志)

## 第八步: 更新部署

当你修改代码后:

```bash
# 1. 测试本地
npm run dev

# 2. 确认无误后部署
npm run deploy
```

## 版本管理和回滚

### 查看部署历史

```bash
wrangler deployments list
```

### 回滚到之前的版本

```bash
wrangler rollback [deployment-id]
```

## 环境变量管理

### 查看当前的 Secrets

```bash
wrangler secret list
```

### 更新 Secret

```bash
wrangler secret put OPENAI_API_KEY
```

### 删除 Secret

```bash
wrangler secret delete OPENAI_API_KEY
```

## 常见问题

### Q1: 部署失败,提示权限错误

**解决方案**: 重新登录

```bash
wrangler logout
wrangler login
```

### Q2: OpenAI API 调用超时

**原因**: Workers 有执行时间限制(免费版 10ms CPU time)

**解决方案**:

1. 升级到 Workers Paid Plan (无限 CPU time)
2. 优化请求,减少处理时间
3. 使用更快的模型 (gpt-4o-mini)

### Q3: CORS 错误

**解决方案**: 检查 `src/index.ts` 中的 CORS 配置:

```typescript
cors: {
  origin: 'https://your-frontend.pages.dev', // 改为你的前端域名
  credentials: true,
  methods: ['POST', 'GET', 'OPTIONS'],
}
```

### Q4: 如何查看错误日志?

实时日志:

```bash
wrangler tail --format pretty
```

只看错误:

```bash
wrangler tail --status error
```

### Q5: 部署后 GraphiQL 无法访问

**原因**: GraphiQL 应该只在开发环境启用

**解决方案**: 修改 `src/index.ts`,根据环境禁用:

```typescript
graphiql: false, // 生产环境设为 false
```

## 成本估算

### Workers 免费版额度

- 100,000 请求/天
- 每个请求 10ms CPU 时间

### Workers Paid Plan

- $5/月起
- 包含 1000 万请求
- 无限 CPU 时间
- 超出后 $0.50/百万请求

### OpenAI API 成本

使用 `gpt-4o-mini`:

- 输入: $0.15 / 1M tokens
- 输出: $0.60 / 1M tokens

平均每次对话 (约 500 tokens): **~$0.0004**

## 下一步

✅ 部署完成后,记录你的 Worker URL:

```
https://xfz-chatbot-backend.your-subdomain.workers.dev
```

📝 将这个 URL 配置到前端项目的环境变量中:

```
VITE_GRAPHQL_ENDPOINT=https://xfz-chatbot-backend.your-subdomain.workers.dev/graphql
```

🚀 然后继续部署前端到 Cloudflare Pages!

## 有用的命令汇总

```bash
# 登录
wrangler login

# 本地开发
npm run dev

# 部署
npm run deploy

# 查看日志
npm run tail

# 设置 Secret
wrangler secret put OPENAI_API_KEY

# 查看部署历史
wrangler deployments list

# 回滚
wrangler rollback [deployment-id]

# 删除 Worker
wrangler delete
```

## 参考链接

- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [Wrangler CLI 文档](https://developers.cloudflare.com/workers/wrangler/)
- [Workers 定价](https://developers.cloudflare.com/workers/platform/pricing/)
- [OpenAI API 文档](https://platform.openai.com/docs/)

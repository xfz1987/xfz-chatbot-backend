# XFZ Chatbot - 后端项目

基于 Cloudflare Workers 的 Serverless GraphQL API，集成 OpenAI 实现 AI 对话功能。

## 技术选型

### 核心技术
- **Cloudflare Workers** - 边缘计算 Serverless 平台
- **TypeScript** - 类型安全的 JavaScript 超集
- **Wrangler** - Cloudflare Workers 开发工具

### GraphQL 服务
- **GraphQL Yoga** - 轻量级 GraphQL 服务器
- **GraphQL** - 查询语言和类型系统

### AI 集成
- **OpenAI API** - GPT 模型接口
- **openai** - OpenAI 官方 Node.js SDK

## 项目结构

```
backend/
├── src/
│   └── index.ts          # Worker 入口文件
├── wrangler.toml         # Workers 配置文件
├── tsconfig.json         # TypeScript 配置
├── .dev.vars.example     # 开发环境变量示例
├── .gitignore            # Git 忽略文件
└── package.json          # 项目依赖
```

## 环境变量配置

### 开发环境

复制 `.dev.vars.example` 为 `.dev.vars`:

```bash
cp .dev.vars.example .dev.vars
```

编辑 `.dev.vars` 文件，添加你的 OpenAI API Key:

```
OPENAI_API_KEY=sk-your-openai-api-key-here
```

### 生产环境

使用 Wrangler 设置 Secret:

```bash
wrangler secret put OPENAI_API_KEY
```

按提示输入你的 OpenAI API Key。

## 开发指南

### 安装依赖

```bash
npm install
```

### 本地开发

启动本地开发服务器 (默认运行在 http://localhost:8787):

```bash
npm run dev
```

访问 GraphiQL 界面: http://localhost:8787/graphql

### 查看日志

实时查看 Worker 日志:

```bash
npm run tail
```

### 部署到生产环境

```bash
npm run deploy
```

## GraphQL API 说明

### Schema 定义

```graphql
type Query {
  hello: String!
}

type Mutation {
  chat(message: String!): ChatResponse!
}

type ChatResponse {
  message: String!
  timestamp: String!
}
```

### 查询示例

#### Hello 查询

```graphql
query {
  hello
}
```

响应:
```json
{
  "data": {
    "hello": "Hello from Cloudflare Workers!"
  }
}
```

#### Chat Mutation

```graphql
mutation {
  chat(message: "你好,介绍一下你自己") {
    message
    timestamp
  }
}
```

响应:
```json
{
  "data": {
    "chat": {
      "message": "你好!我是一个基于 GPT 的 AI 助手...",
      "timestamp": "2024-01-01T12:00:00.000Z"
    }
  }
}
```

## Wrangler 配置说明

### wrangler.toml 配置项

```toml
name = "xfz-chatbot-backend"        # Worker 名称
main = "src/index.ts"                # 入口文件
compatibility_date = "2024-01-01"    # 兼容性日期
```

### 自定义域名

编辑 `wrangler.toml` 添加:

```toml
routes = [
  { pattern = "api.yourdomain.com/*", zone_name = "yourdomain.com" }
]
```

部署后访问: https://api.yourdomain.com/graphql

## OpenAI 集成

### 支持的模型

当前配置使用 `gpt-3.5-turbo`，你可以修改为:
- `gpt-4` - 更强大但速度较慢
- `gpt-4-turbo` - 平衡性能和速度
- `gpt-3.5-turbo` - 快速且经济

### 修改模型

编辑 `src/index.ts`:

```typescript
const completion = await openai.chat.completions.create({
  model: 'gpt-4', // 修改为你想要的模型
  messages: [
    {
      role: 'user',
      content: message,
    },
  ],
});
```

### 添加系统提示词

```typescript
messages: [
  {
    role: 'system',
    content: '你是一个友好的 AI 助手...',
  },
  {
    role: 'user',
    content: message,
  },
]
```

## 部署流程

### 首次部署

1. 登录 Cloudflare:
```bash
wrangler login
```

2. 配置 Secret:
```bash
wrangler secret put OPENAI_API_KEY
```

3. 部署:
```bash
npm run deploy
```

4. 记录部署后的 URL:
```
https://xfz-chatbot-backend.your-subdomain.workers.dev
```

### 更新部署

修改代码后:
```bash
npm run deploy
```

### 回滚版本

查看历史版本:
```bash
wrangler deployments list
```

回滚到指定版本:
```bash
wrangler rollback [deployment-id]
```

## CORS 配置

当前配置允许所有来源 (`origin: '*'`)，生产环境建议限制为前端域名:

```typescript
cors: {
  origin: 'https://your-frontend.pages.dev',
  credentials: true,
  methods: ['POST', 'GET', 'OPTIONS'],
}
```

## 性能优化

### 请求限制

Workers 免费版限制:
- 每天 100,000 次请求
- CPU 时间 10ms/请求

### 优化建议

1. **缓存响应**: 使用 Cache API 缓存常见问题
2. **请求合并**: 批量处理多个查询
3. **超时控制**: 设置 OpenAI 请求超时
4. **错误处理**: 实现重试机制

### 实现缓存示例

```typescript
const cacheKey = new Request(url, { method: 'GET' });
const cache = caches.default;

let response = await cache.match(cacheKey);
if (!response) {
  // 调用 OpenAI
  response = await getAIResponse();
  await cache.put(cacheKey, response.clone());
}
```

## 监控和日志

### 查看实时日志

```bash
wrangler tail
```

### 过滤日志

```bash
wrangler tail --status error
wrangler tail --search "OpenAI"
```

### 生产监控

在 Cloudflare Dashboard 中:
1. 进入 **Workers & Pages**
2. 选择你的 Worker
3. 查看 **Metrics** 和 **Logs**

## 错误处理

### 常见错误

#### OpenAI API 错误
```typescript
try {
  const completion = await openai.chat.completions.create({...});
} catch (error) {
  if (error.status === 429) {
    // 速率限制
    return { message: '请求过于频繁,请稍后再试' };
  }
  if (error.status === 401) {
    // API Key 无效
    console.error('Invalid OpenAI API Key');
  }
  throw new Error('AI 服务暂时不可用');
}
```

#### CORS 错误

确保前后端域名匹配,检查 CORS 配置。

## 安全建议

1. **API Key 管理**
   - 使用 Wrangler Secrets 存储
   - 不要将 API Key 提交到 Git
   - 定期轮换 API Key

2. **请求验证**
   - 验证输入长度
   - 过滤敏感内容
   - 实现请求频率限制

3. **错误信息**
   - 不要暴露详细的错误信息给前端
   - 记录详细错误到日志

## 成本估算

### OpenAI 费用

GPT-3.5-Turbo 定价(示例):
- 输入: $0.0015 / 1K tokens
- 输出: $0.002 / 1K tokens

平均每次对话约 500 tokens,成本约 $0.001。

### Cloudflare Workers 费用

免费版额度:
- 100,000 请求/天
- 超出后: $0.50 / 百万请求

## 测试

### 使用 curl 测试

```bash
curl -X POST http://localhost:8787/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"mutation { chat(message: \"Hello\") { message timestamp } }"}'
```

### 使用 GraphiQL

访问: http://localhost:8787/graphql (开发环境)

## 相关链接

- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [Wrangler 文档](https://developers.cloudflare.com/workers/wrangler/)
- [GraphQL Yoga 文档](https://the-guild.dev/graphql/yoga-server)
- [OpenAI API 文档](https://platform.openai.com/docs/)

## 故障排查

### Worker 无法启动

- 检查 `wrangler.toml` 配置
- 确认 TypeScript 编译无误
- 查看 `wrangler dev` 错误信息

### OpenAI 调用失败

- 验证 API Key 是否正确设置
- 检查 OpenAI 账户余额
- 查看错误日志定位问题

### GraphQL 查询失败

- 验证 Schema 定义
- 检查 Resolver 实现
- 使用 GraphiQL 调试查询

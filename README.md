# XFZ Chatbot Backend

基于 Cloudflare Workers 的 Serverless GraphQL API,集成 OpenAI 实现 AI 对话功能。

## 技术栈

- **Cloudflare Workers** - 边缘计算 Serverless 平台
- **TypeScript** - 类型安全
- **GraphQL Yoga** - GraphQL 服务器
- **OpenAI API** - GPT 模型接口

## 快速开始

### 安装依赖

```bash
npm install
```

### 配置环境变量

```bash
cp .dev.vars.example .dev.vars
```

编辑 `.dev.vars` 文件,添加你的 OpenAI API Key:
```
OPENAI_API_KEY=sk-your-openai-api-key-here
```

### 启动开发服务器

```bash
npm run dev
```

访问 GraphiQL: http://localhost:8787/graphql

### 部署到生产环境

首先设置生产环境的 Secret:
```bash
wrangler secret put OPENAI_API_KEY
```

然后部署:
```bash
npm run deploy
```

## GraphQL API

### Schema

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

### 示例查询

```graphql
# Hello 查询
query {
  hello
}

# Chat Mutation
mutation {
  chat(message: "你好") {
    message
    timestamp
  }
}
```

## 项目结构

```
backend/
├── src/
│   └── index.ts          # Worker 入口
├── wrangler.toml         # Workers 配置
├── tsconfig.json         # TypeScript 配置
└── package.json          # 依赖管理
```

## 部署

### Cloudflare Workers

1. 登录 Cloudflare: `wrangler login`
2. 设置 Secret: `wrangler secret put OPENAI_API_KEY`
3. 部署: `npm run deploy`

部署完成后,记录 Worker URL 并在前端配置。

详细说明请查看 [PROJECT.md](PROJECT.md)

## 相关链接

- [前端仓库](https://github.com/YOUR_USERNAME/xfz-chatbot-frontend)
- [项目文档](PROJECT.md)
- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [OpenAI API 文档](https://platform.openai.com/docs/)

## License

MIT

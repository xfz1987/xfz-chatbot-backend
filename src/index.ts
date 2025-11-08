import { createYoga, createSchema } from "graphql-yoga";
import OpenAI from "openai";

// GraphQL Schema 定义
const schema = createSchema({
  typeDefs: /* GraphQL */ `
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
  `,
  resolvers: {
    Query: {
      hello: () => "Hello from Cloudflare Workers!",
    },
    Mutation: {
      chat: async (
        _parent,
        args: { message: string },
        context: { env: Env }
      ) => {
        const { message } = args;
        const { env } = context;

        // 初始化 OpenAI 客户端
        const openai = new OpenAI({
          apiKey: env.OPENAI_API_KEY,
        });

        try {
          console.log("Calling OpenAI API...");
          // 调用 OpenAI API (使用 gpt-4o-mini - 最便宜的模型)
          const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "user",
                content: message,
              },
            ],
          });

          const responseMessage =
            completion.choices[0]?.message?.content || "No response";
          console.log("OpenAI response:", responseMessage);

          return {
            message: responseMessage,
            timestamp: new Date().toISOString(),
          };
        } catch (error: any) {
          console.error("OpenAI API Error:", error);
          console.error("Error details:", {
            message: error.message,
            status: error.status,
            type: error.type,
          });
          throw new Error(
            `Failed to get response from AI: ${
              error.message || "Unknown error"
            }`
          );
        }
      },
    },
  },
});

// Cloudflare Workers 环境变量类型
export interface Env {
  OPENAI_API_KEY: string;
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    // 创建 GraphQL Yoga 实例
    const yoga = createYoga({
      schema,
      context: { env },
      // 配置 CORS - 允许所有来源访问
      cors: {
        origin: [
          "http://localhost:5173",
          "https://xfz-chatbot-frontend.pages.dev",
          "api.yideng.shop",
        ],
        credentials: true,
        allowedHeaders: ["Content-Type", "Authorization", "Accept"],
        methods: ["POST", "GET", "OPTIONS"],
      },
      // 启用 GraphiQL 界面 (开发环境)
      graphiql: true,
      landingPage: false,
      fetchAPI: {
        Request,
        Response,
      },
    });

    return yoga.fetch(request, env, ctx);
  },
};

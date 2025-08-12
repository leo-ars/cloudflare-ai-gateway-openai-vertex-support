## Cloudflare AI Gateway + Vertex Router Worker

This Worker forwards OpenAI-compatible chat requests through Cloudflare AI Gateway. If the `model` indicates Vertex (for example `vertex/gemini-1.5-pro`), it translates the request to Vertex `generateContent` and adapts the response back to OpenAI format.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/leo-ars/cloudflare-ai-gateway-vertex-support)

## Quick Deploy

Use the **Deploy to Cloudflare** button above for one-click deployment. It will:
- Fork this repository to your GitHub account
- Guide you through setting up the required environment variables
- Deploy the Worker to your Cloudflare account

## Manual Setup

### Local Development

1. Copy the example environment file:
```bash
cp .env.example .env.local
```

2. Fill in your values in `.env.local`:
```bash
ACCOUNT_ID=your_cloudflare_account_id
GATEWAY_ID=your_ai_gateway_name
VERTEX_PROJECT=your_gcp_project  # Optional, for Vertex AI
VERTEX_REGION=us-east4           # Optional, for Vertex AI
```

3. Install and run:
```bash
npm ci
npm run dev
```

### Production Deploy

```bash
npm run deploy
```

## Usage Examples

### OpenAI SDK (Recommended)

```javascript
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: "your-provider-api-key", // OpenAI, Cloudflare, or Vertex key
  baseURL: "https://your-worker.yourname.workers.dev", // Your deployed Worker URL
});

// Non-streaming
const response = await openai.chat.completions.create({
  model: "workers-ai/@cf/meta/llama-3.1-8b-instruct", // or openai/gpt-4o-mini, vertex/gemini-1.5-pro
  messages: [{ role: "user", content: "Hello!" }],
  temperature: 0.2,
});

console.log(response.choices[0].message.content);

// Streaming
const stream = await openai.chat.completions.create({
  model: "workers-ai/@cf/meta/llama-3.1-8b-instruct",
  messages: [{ role: "user", content: "Hello!" }],
  stream: true,
});

for await (const chunk of stream) {
  const content = chunk.choices[0]?.delta?.content;
  if (content) process.stdout.write(content);
}
```

### Direct API Calls

```bash
curl -X POST https://your-worker.yourname.workers.dev/v1/chat/completions \
  -H "Authorization: Bearer your-provider-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "workers-ai/@cf/meta/llama-3.1-8b-instruct",
    "messages": [{"role": "user", "content": "Hello!"}],
    "temperature": 0.2
  }'
```

### Supported Models

- **Anthropic**: `anthropic/claude-3-haiku`, `anthropic/claude-3-5-sonnet`
- **OpenAI**: `openai/gpt-4o-mini`, `openai/gpt-4o`, `openai/gpt-3.5-turbo`
- **Groq**: `groq/llama-3.1-70b-versatile`, `groq/mixtral-8x7b-32768`
- **Mistral**: `mistral/mistral-large-latest`, `mistral/mistral-small-latest`
- **Cohere**: `cohere/command-r-plus`, `cohere/command-light`
- **Perplexity**: `perplexity/llama-3.1-sonar-large-128k-online`
- **Workers AI**: `workers-ai/@cf/meta/llama-3.1-8b-instruct`
- **Google AI Studio**: `google-ai-studio/gemini-2.0-flash`, `google-ai-studio/gemini-1.5-pro`
- **Grok**: `grok/grok-beta`
- **DeepSeek**: `deepseek/deepseek-chat`
- **Cerebras**: `cerebras/llama3.1-8b`
- **Vertex AI**: `vertex/gemini-1.5-pro` (requires VERTEX_PROJECT and VERTEX_REGION)

All models supported by [Cloudflare AI Gateway's OpenAI-compatible endpoint](https://developers.cloudflare.com/ai-gateway/chat-completion/) work with this Worker.


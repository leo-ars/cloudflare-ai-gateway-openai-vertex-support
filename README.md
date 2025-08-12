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

### Usage with OpenAI SDK

Point your client at your Worker URL. For non-Vertex models use the provider-prefixed model; for Vertex use `vertex/<model>` or `google-vertex-ai/<model>`.

Examples:
- OpenAI: `openai/gpt-4o-mini`
- Workers AI: `workers-ai/@cf/meta/llama-3.1-8b-instruct`
- Vertex: `vertex/gemini-1.5-pro`

Set `Authorization: Bearer <provider_api_key>` where for Vertex it is your Vertex API key.


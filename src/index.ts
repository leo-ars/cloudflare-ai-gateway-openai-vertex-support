type Env = {
  ACCOUNT_ID: string;
  GATEWAY_ID: string;
  VERTEX_PROJECT: string;
  VERTEX_REGION: string;
};

export default {
  async fetch(request, env, ctx): Promise<Response> {
    const url = new URL(request.url);
    
    // Health check
    if (request.method === 'GET') {
      return new Response('Hello World!');
    }

    // Only handle POST to chat completions
    if (request.method !== 'POST' || !url.pathname.endsWith('/chat/completions')) {
      return Response.json({ error: { message: 'Not found' } }, { status: 404 });
    }

    try {
      const body = await request.json<any>();
      const model = body?.model?.trim();
      const auth = request.headers.get('authorization');
     const cfAigAuth = request.headers.get('cf-aig-authorization');
     if (!cfAigAuth) {
       return Response.json({ error: { message: 'Missing cf-aig-authorization header' } }, { status: 401 });
     }

      if (!model) {
        return Response.json({ error: { message: 'Missing model' } }, { status: 400 });
      }
      // Only require 'authorization' if cf-aig-authorization is missing
      if (!auth && !cfAigAuth) {
        return Response.json({ error: { message: 'Missing Authorization header' } }, { status: 401 });
      }
      if (!env.ACCOUNT_ID || !env.GATEWAY_ID) {
        return Response.json({ error: { message: 'Missing ACCOUNT_ID or GATEWAY_ID' } }, { status: 500 });
      }

      // Check if it's a Vertex model (simplified)
      const isVertex = model.toLowerCase().includes('vertex');
      
      if (isVertex) {
        if (!env.VERTEX_PROJECT || !env.VERTEX_REGION) {
          return Response.json({ error: { message: 'Missing VERTEX_PROJECT or VERTEX_REGION' } }, { status: 500 });
        }

        // Extract model name after "/" 
        const vertexModel = model.includes('/') ? model.split('/').slice(1).join('/') : model;
        
        // Build Vertex URL
        const vertexUrl = `https://gateway.ai.cloudflare.com/v1/${env.ACCOUNT_ID}/${env.GATEWAY_ID}/google-vertex-ai/v1/projects/${env.VERTEX_PROJECT}/locations/${env.VERTEX_REGION}/publishers/google/models/${vertexModel}:generateContent`;
        
        // Simple message transformation
        const messages = body.messages || [];
        const contents = messages
          .filter((m: any) => m.role !== 'system')
          .map((m: any) => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: typeof m.content === 'string' ? m.content : JSON.stringify(m.content) }]
          }));

        const vertexPayload = { contents };
        
        const resp = await fetch(vertexUrl, {
          method: 'POST',
            headers: {
              ...(auth ? { authorization: auth } : {}),
              'content-type': 'application/json',
              ...(cfAigAuth ? { 'cf-aig-authorization': cfAigAuth } : {})
            },
          body: JSON.stringify(vertexPayload),
        });

        if (!resp.ok) {
          return new Response(await resp.text().catch(() => 'Vertex error'), { status: resp.status });
        }

        // Convert Vertex response to OpenAI format
        const vertexJson = await resp.json<any>();
        const text = vertexJson?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        
        return Response.json({
          id: `chatcmpl_${crypto.randomUUID()}`,
          object: 'chat.completion',
          created: Math.floor(Date.now() / 1000),
          model,
          choices: [{ index: 0, message: { role: 'assistant', content: text }, finish_reason: 'stop' }],
        });
      }

      // Default: forward to AI Gateway compat endpoint
      const compatUrl = `https://gateway.ai.cloudflare.com/v1/${env.ACCOUNT_ID}/${env.GATEWAY_ID}/compat/chat/completions`;
      
      return fetch(compatUrl, {
        method: 'POST',
          headers: {
            ...(auth ? { authorization: auth } : {}),
            'content-type': 'application/json',
            ...(cfAigAuth ? { 'cf-aig-authorization': cfAigAuth } : {})
          },
        body: JSON.stringify(body),
      });

    } catch (err: any) {
      return Response.json({ error: { message: err?.message || 'Internal error' } }, { status: 500 });
    }
  },
} satisfies ExportedHandler<Env>;

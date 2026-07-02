export const runtime = 'edge';

const RESULTS_PER_PAGE = 10;
const STREAM_DELAY_MS = 150;

type SSEData =
  | { status: 'success'; id: number; name: string; description: string | null; stars: number; language: string | null; url: string }
  | { status: 'error'; message: string }
  | { status: 'done' };

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q');

  if (!query?.trim()) {
    return new Response(JSON.stringify({ error: 'Query parameter "q" is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      const sendEvent = (data: SSEData) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        const response = await fetch(`https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&per_page=${RESULTS_PER_PAGE}`, {
          headers: {
            'User-Agent': 'Nextjs-SSE-App', // GitHub requires a User-Agent in the public API
            'Accept': 'application/vnd.github.v3+json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          sendEvent({ status: 'error', message: `GitHub Error: ${errorData.message || 'Rate limit exceeded'}` });
          sendEvent({ status: 'done' });
          controller.close();
          return;
        }

        const data = await response.json();

        for (const repo of data.items || []) {
          await new Promise(resolve => setTimeout(resolve, STREAM_DELAY_MS));

          sendEvent({
            status: 'success',
            id: repo.id,
            name: repo.full_name,
            description: repo.description,
            stars: repo.stargazers_count,
            language: repo.language,
            url: repo.html_url,
          });
        }

        sendEvent({ status: 'done' });

      } catch (error) {
        console.error('GitHub API error:', error);
        sendEvent({ status: 'error', message: 'Internal server error' });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}

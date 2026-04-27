// src/app/api/search/route.ts
export const runtime = 'edge';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const destination = searchParams.get('destination') || 'Qualquer Lugar';

    const stream = new ReadableStream({
        async start(controller) {
            const encoder = new TextEncoder();

            // Função auxiliar para padronizar o envio no formato SSE
            const sendEvent = (data: any) => {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
            };

            try {
                // Simulando a busca em 3 provedores distintos com tempos de resposta variados
                const providers = [
                    { name: 'GOL', delay: 1000, price: 450 },
                    { name: 'LATAM', delay: 2500, price: 380 },
                    { name: 'AZUL', delay: 10000, price: 510 },
                ];

                for (const provider of providers) {
                    // Simula o tempo de latência da API externa da companhia aérea
                    await new Promise(resolve => setTimeout(resolve, provider.delay));

                    sendEvent({
                        status: 'success',
                        airline: provider.name,
                        price: provider.price,
                        destination: destination,
                        timestamp: new Date().toLocaleTimeString()
                    });
                }

                // Evento de controle para avisar o front-end que o processo terminou
                sendEvent({ status: 'done' });

            } catch (error) {
                console.error("Erro no processamento do stream:", error);
            } finally {
                // Fecha o canal de comunicação para liberar os recursos do servidor
                controller.close();
            }
        }
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
        },
    });
}
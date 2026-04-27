// src/app/page.tsx
'use client';

import { useState, useRef } from 'react';

// Tipagem para os dados recebidos
interface FlightResult {
  airline: string;
  price: number;
  destination: string;
  timestamp: string;
}

export default function Home() {
  const [destination, setDestination] = useState('');
  const [results, setResults] = useState<FlightResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Usamos useRef para guardar a instância da conexão e poder cancelá-la a qualquer momento
  const eventSourceRef = useRef<EventSource | null>(null);

  const startSearch = (e: React.FormEvent) => {
    e.preventDefault();

    if (!destination.trim()) return;

    // Reseta o estado para uma nova busca
    setResults([]);
    setIsSearching(true);

    // Se já houver uma conexão aberta (usuário clicou duas vezes), fechamos a anterior
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    // Abre a conexão persistente
    const eventSource = new EventSource(`/api/search?destination=${encodeURIComponent(destination)}`);
    eventSourceRef.current = eventSource;

    // Fica "escutando" as mensagens que o back-end está jorrando
    eventSource.onmessage = (event) => {
      const parsedData = JSON.parse(event.data);

      // Regra de negócio para encerrar a conexão corretamente
      if (parsedData.status === 'done') {
        eventSource.close();
        setIsSearching(false);
        return;
      }

      if (parsedData.status === 'success') {
        // Adiciona o novo voo à lista preservando os anteriores
        setResults((prev) => [...prev, parsedData]);
      }
    };

    // Tratamento de queda de conexão
    eventSource.onerror = () => {
      console.error("Conexão perdida ou encerrada abruptamente.");
      eventSource.close();
      setIsSearching(false);
    };
  };

  const cancelSearch = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    setIsSearching(false);
    setResults([]);
  };

  return (
    <main className="max-w-2xl mx-auto p-10 font-sans">
      <h1 className="text-3xl font-bold text-white mb-6">
        Streaming SSE
      </h1>

      <div className="flex gap-4 mb-8">
        <input
          type="text"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          placeholder="Ex: Rio de Janeiro"
          className="flex-1 border border-stone-500 bg-stone-700 rounded px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isSearching}
        />

        {isSearching ? (
          <button
            type="button"
            onClick={cancelSearch}
            className="bg-red-600 hover:bg-red-700 text-white font-medium px-6 py-2 rounded transition-colors"
          >
            Cancelar Busca
          </button>
        ) : (
          <button
            type="button"
            onClick={startSearch}
            className="bg-green-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded transition-colors disabled:opacity-50"
            disabled={!destination.trim()}
          >
            Buscar Voos
          </button>
        )}
      </div>

      {/* Indicador visual de processamento (sem travar a tela) */}
      {isSearching && (
        <div className="flex items-center gap-3 mb-6 text-white">
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          <span className="font-medium">Vasculhando companhias aéreas...</span>
        </div>
      )}

      {/* Renderização progressiva dos resultados */}
      <div className="space-y-4">
        {results.map((flight, index) => (
          <div
            key={index}
            className="border border-stone-800 bg-stone-800 rounded-lg p-5 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500"
          >
            <div className="flex justify-between items-center text-black">
              <div>
                <p className="text-sm text-gray-300">Destino: {flight.destination}</p>
                <p className="text-xl font-bold text-gray-200">{flight.airline}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-300">{flight.timestamp}</p>
                <p className="text-2xl font-bold text-green-600">
                  R$ {flight.price.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        ))}

        {!isSearching && results.length > 0 && (
          <p className="text-center text-sm text-gray-500 mt-8">Busca finalizada.</p>
        )}
      </div>
    </main>
  );
}
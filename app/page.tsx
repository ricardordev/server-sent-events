'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface RepoResult {
  id: number;
  name: string;
  description: string;
  stars: number;
  language: string;
  url: string;
}

export default function Home() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<RepoResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);

  // Cleanup EventSource on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const startSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();

    if (!query.trim()) return;

    // Reset state for a new search
    setResults([]);
    setErrorMsg(null);
    setIsSearching(true);

    // Close any existing connection before opening a new one
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const eventSource = new EventSource(`/api/search?q=${encodeURIComponent(query.trim())}`);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      const parsedData = JSON.parse(event.data);

      // Close the connection when the stream is done
      if (parsedData.status === 'done') {
        eventSource.close();
        setIsSearching(false);
        return;
      }

      // Handle backend errors (e.g. GitHub API rate limit)
      if (parsedData.status === 'error') {
        setErrorMsg(parsedData.message);
        eventSource.close();
        setIsSearching(false);
        return;
      }

      // Append new results preserving previous ones
      if (parsedData.status === 'success') {
        setResults((prev) => [...prev, parsedData]);
      }
    };

    // Handle connection drops
    eventSource.onerror = () => {
      console.error('Connection lost or closed unexpectedly.');
      eventSource.close();
      setIsSearching(false);
    };
  }, [query]);

  const cancelSearch = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    setIsSearching(false);
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 p-8 font-sans">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">GitHub Searcher (Server-Sent Events)</h1>

        <form onSubmit={startSearch} className="mb-8">
          <div className="flex gap-4">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. react, nextjs, express..."
              className="flex-1 px-4 py-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:border-blue-500 transition-colors"
              disabled={isSearching}
            />
            <button
              type="submit"
              disabled={isSearching || !query.trim()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isSearching ? 'Searching...' : 'Search'}
            </button>
            {isSearching && (
              <button
                type="button"
                onClick={cancelSearch}
                className="px-6 py-3 bg-zinc-700 text-white rounded-lg font-medium hover:bg-zinc-600 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        {errorMsg && (
          <div className="mb-6 p-4 bg-red-900/40 border border-red-500/50 rounded-lg text-red-200 text-sm">
            {errorMsg}
          </div>
        )}

        {isSearching && !errorMsg && (
          <div className="flex items-center gap-3 mb-6 text-white">
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span className="font-medium">Searching for repositories...</span>
          </div>
        )}

        <div className="space-y-4">
          {results.map((repo) => (
            <div
              key={repo.id}
              className="border border-zinc-800 bg-zinc-800 rounded-lg p-5 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1 pr-4">
                  <a href={repo.url} target="_blank" rel="noopener noreferrer" className="text-xl font-bold text-blue-400 hover:underline">
                    {repo.name}
                  </a>
                  <p className="text-sm text-gray-400 mt-2 line-clamp-2">
                    {repo.description || 'No description provided.'}
                  </p>
                </div>
                <div className="text-right flex flex-col items-end">
                  <p className="text-lg font-bold text-yellow-500 flex items-center gap-1">
                    ★ {repo.stars.toLocaleString()}
                  </p>
                  {repo.language && (
                    <span className="mt-2 text-xs font-semibold px-2 py-1 bg-stone-700 text-stone-300 rounded-md">
                      {repo.language}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}

          {!isSearching && results.length > 0 && (
            <div className="text-center pt-8 text-stone-500 text-sm">
              Search completed. Showing top 10 results.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
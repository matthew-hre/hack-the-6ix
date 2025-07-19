'use client';

import { useState } from 'react';

export default function VellumChat() {
  const [text, setText] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const ask = async () => {
    setLoading(true);
    setAnswer(null);

    const res = await fetch('/api/vellum', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userMessage: text }),
    });

    const { message } = await res.json();
    setAnswer(message);
    setLoading(false);
  };

  return (
    <div className="space-y-2">
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        className="w-full border rounded p-2"
        placeholder="Ask something…"
      />
      <button
        disabled={loading}
        onClick={ask}
        className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
      >
        {loading ? 'Thinking…' : 'Send'}
      </button>

      {answer && (
        <pre className="mt-4 bg-gray-100 p-4 rounded">{answer}</pre>
      )}
    </div>
  );
}


/*
VaxtaGo
Created by Dmitry Diev
AI Development Assistant: ChatGPT (OpenAI)
Copyright © 2026
*/

'use client';

import { useEffect, useState } from 'react';

export function SplashScreen() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      {/* Loading indicator */}
      {loading ? (
        <>
          <svg
            className="h-12 w-12 animate-spin text-blue-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8z"
            />
          </svg>
          <p className="mt-4 text-lg text-gray-600">Loading...</p>
        </>
      ) : (
        <div className="text-center">
          <h2 className="text-xl font-semibold">VaxtaGo</h2>
          <p className="text-gray-600">Ready to help you</p>
        </div>
      )}

      {/* Authorship signature at bottom */}
      <div className="mt-8 text-sm text-gray-600">
        © 2026 VaxtaGo
        <br />
        Made by Dmitry Diev • Built with ChatGPT
      </div>
    </div>
  );
}

export default SplashScreen;
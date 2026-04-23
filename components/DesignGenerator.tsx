'use client'

import type { TrendingTopic } from '@/lib/merch'

interface DesignGeneratorProps {
  topic: TrendingTopic
  onGenerate: (topic: TrendingTopic) => void
  loading: boolean
}

export default function DesignGenerator({
  topic,
  onGenerate,
  loading,
}: DesignGeneratorProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        ✨ Generate Design
      </h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Selected Topic
          </label>
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-gray-900 dark:text-white font-medium">{topic.title}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Source: {topic.source}
            </p>
          </div>
        </div>
        <button
          onClick={() => onGenerate(topic)}
          disabled={loading}
          className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold text-lg"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating AI Design...
            </span>
          ) : (
            '🎨 Generate T-Shirt Design'
          )}
        </button>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
          Our AI will create a unique T-shirt design based on this trending topic
        </p>
      </div>
    </div>
  )
}


'use client'

import type { TrendingTopic } from '@/lib/merch'

interface TrendingTopicsProps {
  topics: TrendingTopic[]
  loading: boolean
  onRefresh: () => void
  onSelectTopic: (topic: TrendingTopic) => void
}

export default function TrendingTopics({
  topics,
  loading,
  onRefresh,
  onSelectTopic,
}: TrendingTopicsProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          🔥 Trending Topics
        </h2>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {loading && topics.length === 0 ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading trending topics...</p>
        </div>
      ) : topics.length === 0 ? (
        <div className="text-center py-8 text-gray-600 dark:text-gray-400">
          No trending topics found. Click refresh to try again.
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {topics.map((topic) => (
            <div
              key={topic.id}
              onClick={() => onSelectTopic(topic)}
              className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    {topic.title}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                      {topic.source}
                    </span>
                    {topic.upvotes && (
                      <span>👍 {topic.upvotes.toLocaleString()}</span>
                    )}
                  </div>
                </div>
                <button className="ml-4 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors">
                  Generate
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}


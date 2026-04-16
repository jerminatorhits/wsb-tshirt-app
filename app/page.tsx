'use client'

import { useState } from 'react'
import TShirtPreview from '@/components/TShirtPreview'
import Checkout from '@/components/Checkout'

export interface GeneratedDesign {
  id: string
  topic: string
  imageUrl: string
  prompt: string
  createdAt: string
  message?: string
  isFallback?: boolean
}

// Color options - shared between components
export const COLORS = [
  { name: 'White', value: 'white', hex: '#FFFFFF' },
  { name: 'Black', value: 'black', hex: '#1a1a1a' },
  { name: 'Navy', value: 'navy', hex: '#1E3A5F' },
  { name: 'Gray', value: 'gray', hex: '#6B7280' },
  { name: 'Red', value: 'red', hex: '#DC2626' },
]

export type ColorOption = typeof COLORS[number]

export default function Home() {
  const [ticker, setTicker] = useState('')
  const [numberValue, setNumberValue] = useState('')
  const [optionsPosition, setOptionsPosition] = useState('')
  const [generatedDesign, setGeneratedDesign] = useState<GeneratedDesign | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [selectedColor, setSelectedColor] = useState<ColorOption>(COLORS[0])

  const createDesignImage = (tickerText: string, numberText: string, optionsText: string) => {
    const canvas = document.createElement('canvas')
    canvas.width = 1800
    canvas.height = 1800
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('Could not render design image')
    }

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    ctx.textAlign = 'center'
    ctx.fillStyle = '#111827'

    ctx.font = '900 280px system-ui, -apple-system, sans-serif'
    ctx.fillText(`$${tickerText}`, 900, 650)

    ctx.font = '900 420px system-ui, -apple-system, sans-serif'
    ctx.fillText(numberText, 900, 1100)

    if (optionsText) {
      ctx.font = '700 110px system-ui, -apple-system, sans-serif'
      ctx.fillStyle = '#374151'
      ctx.fillText(optionsText, 900, 1380)
    }

    return canvas.toDataURL('image/png')
  }

  const handleBuildDesign = () => {
    const cleanedTicker = ticker.trim().toUpperCase()
    const cleanedNumber = numberValue.trim()
    const cleanedOptions = optionsPosition.trim().toUpperCase()

    if (!cleanedTicker) {
      setErrorMessage('Ticker is required')
      return
    }

    if (!/^[A-Z]{1,6}$/.test(cleanedTicker)) {
      setErrorMessage('Ticker must be 1-6 letters')
      return
    }

    if (!cleanedNumber) {
      setErrorMessage('Number is required')
      return
    }

    try {
      const imageUrl = createDesignImage(cleanedTicker, cleanedNumber, cleanedOptions)
      const titleParts = [`$${cleanedTicker}`, cleanedNumber]
      if (cleanedOptions) titleParts.push(cleanedOptions)

      setGeneratedDesign({
        id: `text-design-${Date.now()}`,
        topic: titleParts.join(' '),
        imageUrl,
        prompt: `Ticker: ${cleanedTicker} | Number: ${cleanedNumber}${cleanedOptions ? ` | Options: ${cleanedOptions}` : ''}`,
        createdAt: new Date().toISOString(),
      })
      setErrorMessage(null)
    } catch (error) {
      console.error('Failed to build design:', error)
      setErrorMessage('Could not build design image. Please try again.')
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-2">
            📈 Stock T-Shirt Builder
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Build a print-ready shirt from ticker text in seconds
          </p>
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 rounded-lg bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="font-medium text-red-800 dark:text-red-200">{errorMessage}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 space-y-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Create Design
              </h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Stock Ticker
                </label>
                <input
                  type="text"
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value.toUpperCase())}
                  placeholder="TSLA"
                  maxLength={6}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Number
                </label>
                <input
                  type="text"
                  value={numberValue}
                  onChange={(e) => setNumberValue(e.target.value)}
                  placeholder="500"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Options Position (optional)
                </label>
                <input
                  type="text"
                  value={optionsPosition}
                  onChange={(e) => setOptionsPosition(e.target.value)}
                  placeholder="CALL 5/17 500"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <button
                onClick={handleBuildDesign}
                className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all font-semibold text-lg"
              >
                Build Shirt Design
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {generatedDesign && (
              <TShirtPreview
                design={generatedDesign}
                topic={generatedDesign.topic}
                selectedColor={selectedColor}
                onColorChange={setSelectedColor}
              />
            )}
          </div>

          <div className="space-y-6">
            {generatedDesign && (
              <Checkout
                design={generatedDesign}
                designTitle={generatedDesign.topic}
                selectedColor={selectedColor}
                onColorChange={setSelectedColor}
              />
            )}
          </div>
        </div>
      </div>
    </main>
  )
}


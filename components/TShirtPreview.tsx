'use client'

import { GeneratedDesign, COLORS, ColorOption } from '@/app/page'

interface TShirtPreviewProps {
  design: GeneratedDesign
  topic: string | null
  selectedColor: ColorOption
  onColorChange: (color: ColorOption) => void
}

export default function TShirtPreview({ design, topic, selectedColor, onColorChange }: TShirtPreviewProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        👕 T-Shirt Preview
      </h2>
      
      <div className="space-y-4">
        <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 flex items-center justify-center min-h-[400px]">
          <svg
            viewBox="0 0 400 480"
            className="w-full max-w-xs mx-auto"
            style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))' }}
          >
            <path
              d="M100 80 L60 100 L40 180 L80 180 L80 440 L320 440 L320 180 L360 180 L340 100 L300 80 L260 100 L260 60 C260 40 240 20 200 20 C160 20 140 40 140 60 L140 100 L100 80 Z"
              fill={selectedColor.hex}
              stroke={selectedColor.value === 'white' ? '#d1d5db' : selectedColor.hex}
              strokeWidth="2"
            />
            <ellipse
              cx="200"
              cy="55"
              rx="35"
              ry="18"
              fill={selectedColor.value === 'white' ? '#f3f4f6' : selectedColor.hex}
              style={{ filter: selectedColor.value !== 'white' ? 'brightness(0.85)' : 'none' }}
            />
            <defs>
              <clipPath id="shirtClip">
                <rect x="115" y="100" width="170" height="170" rx="4" />
              </clipPath>
            </defs>
            <image
              href={design.imageUrl}
              x="115"
              y="100"
              width="170"
              height="170"
              clipPath="url(#shirtClip)"
              preserveAspectRatio="xMidYMid meet"
            />
          </svg>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            T-Shirt Color
          </label>
          <div className="flex gap-3">
            {COLORS.map((c) => (
              <button
                key={c.value}
                onClick={() => onColorChange(c)}
                className={`w-10 h-10 rounded-full border-4 transition-all ${
                  selectedColor.value === c.value
                    ? 'border-blue-600 scale-110 shadow-lg'
                    : 'border-gray-300 dark:border-gray-600 hover:scale-105'
                }`}
                style={{ backgroundColor: c.hex }}
                title={c.name}
              />
            ))}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Selected: {selectedColor.name}
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {topic || design.topic}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {design.prompt}
          </p>
        </div>

        <div>
          <button
            onClick={() => window.open(design.imageUrl, '_blank')}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            📥 Download Design
          </button>
        </div>
      </div>
    </div>
  )
}

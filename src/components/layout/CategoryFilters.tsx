'use client'

import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { PlaceEntry, CategoryPrimary, ConfidenceLevel } from '@/types/places'
import {
  MAIN_CATEGORIES,
  CONFIDENCE_LEVELS,
  getCategoryColor,
  getCategoryIcon,
  getCategoryLabel,
  getConfidenceColor,
  getConfidenceLabel,
} from '@/lib/categories'
import { cn } from '@/lib/cn'

interface CategoryFiltersProps {
  activeCategory: CategoryPrimary | null
  onCategoryChange: (category: CategoryPrimary | null) => void
  activeConfidence: ConfidenceLevel | null
  onConfidenceChange: (confidence: ConfidenceLevel | null) => void
  places: PlaceEntry[]
}

export function CategoryFilters({
  activeCategory,
  onCategoryChange,
  activeConfidence,
  onConfidenceChange,
  places,
}: CategoryFiltersProps) {

  const hasActiveFilter = activeCategory || activeConfidence

  // Count places per category
  const countByCategory = (cat: CategoryPrimary) =>
    places.filter((p) => p.categoryPrimary === cat).length

  const countByConfidence = (level: ConfidenceLevel) =>
    places.filter((p) => p.confidenceLevel === level).length

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Active filter indicator + clear */}
      {hasActiveFilter && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="flex items-center gap-2"
        >
          <span className="text-[10px] text-white/25 tracking-wider uppercase">Filtered:</span>
          {activeCategory && (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px]"
              style={{ color: getCategoryColor(activeCategory), backgroundColor: `${getCategoryColor(activeCategory)}15` }}
            >
              {getCategoryIcon(activeCategory)} {getCategoryLabel(activeCategory)}
            </span>
          )}
          {activeConfidence && (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px]"
              style={{ color: getConfidenceColor(activeConfidence), backgroundColor: `${getConfidenceColor(activeConfidence)}15` }}
            >
              {getConfidenceLabel(activeConfidence)}
            </span>
          )}
          <button
            onClick={() => { onCategoryChange(null); onConfidenceChange(null) }}
            className="text-white/25 hover:text-white/50 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </motion.div>
      )}

      {/* Category chips — scrollable on mobile */}
      <div className="flex md:flex-wrap md:justify-center gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {MAIN_CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat
          const color = getCategoryColor(cat)
          const count = countByCategory(cat)
          if (count === 0) return null
          return (
            <button
              key={cat}
              onClick={() => onCategoryChange(isActive ? null : cat)}
              className={cn(
                'glass-light rounded-full px-3 py-1 text-xs tracking-wide transition-all duration-300 flex items-center gap-1.5',
                isActive
                  ? 'ring-1 text-white/90'
                  : 'text-white/40 hover:text-white/70',
              )}
              style={isActive ? { borderColor: color, color } : undefined}
            >
              <span>{getCategoryIcon(cat)}</span>
              <span>{getCategoryLabel(cat)}</span>
              <span className="text-[9px] opacity-50">{count}</span>
            </button>
          )
        })}
      </div>

      {/* Confidence chips */}
      <div className="flex flex-wrap justify-center gap-1.5">
        {CONFIDENCE_LEVELS.map((level) => {
          const isActive = activeConfidence === level
          const color = getConfidenceColor(level)
          const count = countByConfidence(level)
          if (count === 0) return null
          return (
            <button
              key={level}
              onClick={() => onConfidenceChange(isActive ? null : level)}
              className={cn(
                'rounded-full px-2.5 py-0.5 text-[10px] tracking-wider uppercase transition-all duration-300 border border-transparent flex items-center gap-1',
                isActive
                  ? 'text-white/90 border-current'
                  : 'text-white/25 hover:text-white/50',
              )}
              style={isActive ? { color } : undefined}
            >
              <span>{getConfidenceLabel(level)}</span>
              <span className="text-[8px] opacity-50">{count}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

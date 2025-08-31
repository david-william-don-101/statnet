"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"

interface DataPoint {
  value: number
  timestamp: number
  isSpike?: boolean
}

const Sparkline = ({
  data,
  color = "#3b82f6",
  spikeColor = "#ef4444",
  width = 60,
  height = 20,
  unit,
  maxValue,
}: {
  data: DataPoint[]
  color?: string
  spikeColor?: string
  width?: number
  height?: number
  unit?: string
  maxValue?: number
}) => {
  // Ensure there are at least two data points to draw a line
  if (data.length < 2) {
    return null;
  }

  // Calculate dynamic min and max values from the data
  const values = data.map(p => p.value);
  const dataMin = Math.min(...values);
  let dataMax = Math.max(...values);

  let displayMin: number;
  let displayMax: number;

  // If the unit is a percentage, ensure the display range is 0-100
  if (unit === "%" && maxValue !== undefined) {
    displayMin = 0;
    displayMax = maxValue;
  } else if (maxValue !== undefined) {
    // For non-percentage units, if maxValue is provided, use it as the upper bound
    // And set displayMin to 0 for these cases (like memory/disk usage in bytes)
    displayMin = 0;
    displayMax = maxValue;
  } else {
    // Default behavior: add padding to min/max for better visualization
    const padding = (dataMax - dataMin) * 0.1 || 1; // 10% padding or 1 if range is 0
    displayMin = dataMin - padding;
    displayMax = dataMax + padding;
  }

  const points = data.map((point, index) => ({
    x: (index / (data.length - 1)) * width,
    y: height - ((point.value - displayMin) / (displayMax - displayMin)) * height,
    isSpike: point.isSpike,
  }))

  const path = points.reduce((acc, point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`
    return `${acc} L ${point.x} ${point.y}`
  }, "")

  const hasSpikes = points.some((p) => p.isSpike)

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={hasSpikes ? spikeColor : color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={hasSpikes ? spikeColor : color} stopOpacity={0.1} />
        </linearGradient>
      </defs>

      <path
        d={`${path} L ${width} ${height} L 0 ${height} Z`}
        fill={`url(#gradient-${color})`}
      />

      <path
        d={path}
        fill="none"
        stroke={hasSpikes ? spikeColor : color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Spike indicators */}
      {points.map((point, index) =>
        point.isSpike ? (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r={2}
            fill={spikeColor}
          />
        ) : null,
      )}
    </svg>
  )
}

const ResourceCard = ({
  icon: Icon,
  label,
  value,
  data,
  color,
  unit = "%",
  maxValue = 100,
  valueDisplay, // Optional formatted display value
}: {
  icon: any
  label: string
  value: number
  data: DataPoint[]
  color: string
  unit?: string
  maxValue?: number
  valueDisplay?: string
}) => {
  const [isHovered, setIsHovered] = useState(false)
  const hasSpikes = data.some((d) => d.isSpike)


  return (
    <motion.div
      className="flex items-center gap-2 p-1.5 rounded-lg transition-colors hover:bg-muted/50"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <motion.div
        className="flex items-center justify-center w-7 h-7 rounded-md bg-muted"
        animate={{
          backgroundColor: hasSpikes ? "#fef2f2" : undefined,
          scale: isHovered ? 1.1 : 1,
        }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        <Icon className={`w-4 h-4 ${hasSpikes ? "text-red-500" : "text-muted-foreground"}`} />
      </motion.div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-muted-foreground">{label}</span>
          <motion.span
            className={`text-xs font-mono ${hasSpikes ? "text-red-500" : "text-foreground"}`}
            animate={{ color: hasSpikes ? "#ef4444" : undefined }}
          >
            {valueDisplay !== undefined ? valueDisplay : `${value.toFixed(1)} ${unit}`}
          </motion.span>
        </div>
        <div className="mt-1">
          <Sparkline data={data} color={color} width={270} unit={unit} maxValue={maxValue} />
        </div>
      </div>
    </motion.div>
  )
}

export { Sparkline, ResourceCard }

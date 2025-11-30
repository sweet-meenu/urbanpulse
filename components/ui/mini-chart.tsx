import React from 'react'

type Point = { label: string; value: number }

interface MiniChartProps {
  data: Point[]
  height?: number
}

const MiniChart: React.FC<MiniChartProps> = ({ data, height = 120 }) => {
  const max = Math.max(...data.map(d => d.value), 1)
  const padding = 8
  const barWidth = Math.max(24, Math.floor((100 - padding * 2) / Math.max(1, data.length)))

  return (
    <div className="w-full">
      <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="w-full h-[120px]">
        {data.map((d, i) => {
          const x = padding + i * (barWidth + 4)
          const barH = (d.value / max) * (height - 30)
          const y = height - barH - 18
          return (
            <g key={i}>
              <rect x={x} y={y} width={barWidth} height={barH} rx={3} fill="#7c3aed" opacity={0.95} />
              <text x={x + barWidth / 2} y={height - 6} fontSize={5} fill="#94a3b8" textAnchor="middle">
                {d.label}
              </text>
              <text x={x + barWidth / 2} y={y - 4} fontSize={6} fill="#0f172a" fontWeight={600} textAnchor="middle">
                {Math.round(d.value)}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

export default MiniChart

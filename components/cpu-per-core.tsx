"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Cpu, ChevronDown } from "lucide-react"
import { ResourceCard } from "@/components/ui/resource-display"
import { useWebSocket } from "@/components/websocket-provider"
import { DataPoint } from "@/types"

export default function CpuPerCore() {
  const { combinedData } = useWebSocket()
  const [isExpanded, setIsExpanded] = useState(false)
  const [coreData, setCoreData] = useState<Record<string, DataPoint[]>>({})

  useEffect(() => {
    const maxPoints = 7
    if (combinedData?.systemInfo?.cpuPerCore) {
      const timestamp = Date.now()
      const newCoreData: Record<string, DataPoint[]> = {}

      combinedData.systemInfo.cpuPerCore.forEach((usage, index) => {
        const coreKey = `core${index}`
        const dataPoint: DataPoint = { value: usage, timestamp }

        if (!coreData[coreKey]) {
          newCoreData[coreKey] = [dataPoint]
        } else {
          newCoreData[coreKey] = [...coreData[coreKey], dataPoint].slice(-maxPoints)
        }
      })

      setCoreData(newCoreData)
    }
  }, [combinedData])

  const cpuCores = combinedData?.systemInfo?.cpuCores || 0
  const cores = Array.from({ length: cpuCores }, (_, i) => i)

  if (cpuCores === 0) {
    return null
  }

  return (
    <motion.div
      className="flex items-center justify-center mb-4"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <Card className="w-full max-w-2xl bg-background/95 backdrop-blur-sm border border-border shadow-lg">
        <motion.div
          className="p-3 cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
          whileHover={{ backgroundColor: "hsl(var(--muted) / 0.5)" }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
              >
                <Cpu className="w-4 h-4 text-muted-foreground" />
              </motion.div>
              <span className="text-sm font-medium">Per-Core CPU Usage</span>
            </div>
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="text-muted-foreground"
            >
              <ChevronDown className="h-4 w-4"/>
            </motion.div>
          </div>
        </motion.div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="overflow-hidden"
            >
              <div className="px-3 pb-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {cores.map((coreIndex) => {
                    const coreKey = `core${coreIndex}`
                    const data = coreData[coreKey] || [{ value: 0, timestamp: Date.now() }]
                    const currentValue = data[data.length - 1]?.value || 0

                    return (
                      <ResourceCard
                        key={coreIndex}
                        icon={Cpu}
                        label={`Core ${coreIndex}`}
                        value={currentValue}
                        data={data}
                        color="#1e90ff"
                        unit="%"
                        valueDisplay={`${currentValue.toFixed(1)} %`}
                        maxValue={100}
                      />
                    )
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  )
}
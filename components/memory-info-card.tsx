"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Layers, RefreshCw, ChartPie, CircleDashed, CircleDotDashed, ChevronDown } from "lucide-react"
import { ResourceCard } from "@/components/ui/resource-display"
import { useWebSocket } from "@/components/websocket-provider"
import { DataPoint } from "@/types"
import { formatMemorySize } from "@/lib/formatters"

export default function MemoryInfoCard() {
  const { combinedData } = useWebSocket();
  const [isExpanded, setIsExpanded] = useState(false);

  const [memoryData, setMemoryData] = useState<{
    used: DataPoint[];
    free: DataPoint[];
    buffers: DataPoint[];
    cached: DataPoint[];
    swapUsed: DataPoint[];
    swapFree: DataPoint[];
  }>({
    used: [{ value: 0, timestamp: Date.now() }],
    free: [{ value: 0, timestamp: Date.now() }],
    buffers: [{ value: 0, timestamp: Date.now() }],
    cached: [{ value: 0, timestamp: Date.now() }],
    swapUsed: [{ value: 0, timestamp: Date.now() }],
    swapFree: [{ value: 0, timestamp: Date.now() }],
  });

  useEffect(() => {
    const maxPoints = 7;
    if (combinedData?.systemInfo?.memoryInfo) {
      const memoryInfo = combinedData.systemInfo.memoryInfo;
      const timestamp = Date.now();

      setMemoryData(prev => ({
        used: [...prev.used, { value: memoryInfo.usedPercent, timestamp }].slice(-maxPoints),
        free: [...prev.free, { value: 100 - memoryInfo.usedPercent, timestamp }].slice(-maxPoints), // Calculate free percentage
        buffers: [...prev.buffers, { value: (memoryInfo.buffers / memoryInfo.total) * 100, timestamp }].slice(-maxPoints),
        cached: [...prev.cached, { value: (memoryInfo.cached / memoryInfo.total) * 100, timestamp }].slice(-maxPoints),
        swapUsed: [...prev.swapUsed, { value: (memoryInfo.swapUsed / memoryInfo.swapTotal) * 100, timestamp }].slice(-maxPoints),
        swapFree: [...prev.swapFree, { value: (memoryInfo.swapFree / memoryInfo.swapTotal) * 100, timestamp }].slice(-maxPoints),
      }));
    }
  }, [combinedData]);

  const currentMemoryUsed = memoryData.used[memoryData.used.length - 1]?.value || 0;
  const currentMemoryFree = memoryData.free[memoryData.free.length - 1]?.value || 0;
  const currentBuffers = memoryData.buffers[memoryData.buffers.length - 1]?.value || 0;
  const currentCached = memoryData.cached[memoryData.cached.length - 1]?.value || 0;

  const totalMemory = (combinedData?.systemInfo.memoryInfo?.total || 0) / (1024 * 1024);
  const swapTotal = (combinedData?.systemInfo.memoryInfo?.swapTotal || 0) / (1024 * 1024);
  const swapUsed = (combinedData?.systemInfo.memoryInfo?.swapUsed || 0) / (1024 * 1024);
  const swapFree = (combinedData?.systemInfo.memoryInfo?.swapFree || 0) / (1024 * 1024);

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
              <Layers className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Memory</span>
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 px-3 pb-3">
          <ResourceCard icon={RefreshCw} label="Usage" value={currentMemoryUsed} data={memoryData.used} color="#ff6347" unit="%" valueDisplay={`${currentMemoryUsed.toFixed(1)} %`} maxValue={100} />
          <ResourceCard icon={ChartPie} label="Free" value={currentMemoryFree} data={memoryData.free} color="#3cb371" unit="%" valueDisplay={`${currentMemoryFree.toFixed(1)} %`} maxValue={100} />
          <ResourceCard icon={CircleDashed} label="Buffered" value={currentBuffers} data={memoryData.buffers} color="#ffa500" unit="%" valueDisplay={`${currentBuffers.toFixed(1)} %`} maxValue={100} />
          <ResourceCard icon={CircleDotDashed} label="Cached" value={currentCached} data={memoryData.cached} color="#00ced1" unit="%" valueDisplay={`${currentCached.toFixed(1)} %`} maxValue={100} />
          {swapTotal > 0 && (
            <>
              <ResourceCard icon={RefreshCw} label="Swap Usage" value={(swapUsed / swapTotal) * 100} data={memoryData.swapUsed} color="#ff6347" unit="%" valueDisplay={`${((swapUsed / swapTotal) * 100).toFixed(1)} %`} maxValue={100} />
              <ResourceCard icon={ChartPie} label="Swap Free" value={(swapFree / swapTotal) * 100} data={memoryData.swapFree} color="#3cb371" unit="%" valueDisplay={`${((swapFree / swapTotal) * 100).toFixed(1)} %`} maxValue={100} />
            </>
          )}
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="overflow-hidden"
            >
              <div className="px-3 pb-3 border-t border-border">
                <div className="mt-3 mb-2">
                  <span className="text-xs font-medium text-muted-foreground">Memory Details</span>
                  <div className="mt-1 space-y-1 text-sm text-foreground">
                    <div className="flex justify-between py-1.5 px-2 rounded-md hover:bg-muted/50 transition-colors">
                      <span>Total Memory</span>
                      <span className="font-mono text-muted-foreground">{formatMemorySize(totalMemory)}</span>
                    </div>
                    {swapTotal > 0 && (
                      <>
                        <div className="flex justify-between py-1.5 px-2 rounded-md hover:bg-muted/50 transition-colors">
                          <span>Max Swap</span>
                          <span className="font-mono text-muted-foreground">{formatMemorySize(swapTotal)}</span>
                        </div>
                        <div className="flex justify-between py-1.5 px-2 rounded-md hover:bg-muted/50 transition-colors">
                          <span>Swap Used</span>
                          <span className="font-mono text-muted-foreground">{formatMemorySize(swapUsed)}</span>
                        </div>
                        <div className="flex justify-between py-1.5 px-2 rounded-md hover:bg-muted/50 transition-colors">
                          <span>Swap Free</span>
                          <span className="font-mono text-muted-foreground">{formatMemorySize(swapFree)}</span>
                        </div>
                      </>
                    )}
                    {swapTotal === 0 && (
                      <div className="flex justify-between py-1.5 px-2 rounded-md hover:bg-muted/50 transition-colors">
                        <span>Swap</span>
                        <span className="font-mono text-muted-foreground">Disabled</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}
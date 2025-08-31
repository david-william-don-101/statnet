"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Database, DatabaseZap, DatabaseBackup, ChevronDown } from "lucide-react"
import { ResourceCard } from "@/components/ui/resource-display"
import { useWebSocket } from "@/components/websocket-provider"
import { DataPoint } from "@/types"
import { formatBytes } from "@/lib/formatters"

export default function DiskInfoCard() {
  const { combinedData } = useWebSocket();
  const [isExpanded, setIsExpanded] = useState(false);

  const [diskData, setDiskData] = useState<{
    usageRoot: DataPoint[];
    freeRoot: DataPoint[];
  }>({
    usageRoot: [{ value: 0, timestamp: Date.now() }],
    freeRoot: [{ value: 0, timestamp: Date.now() }],
  });

  useEffect(() => {
    const maxPoints = 7;
    if (combinedData?.systemInfo?.diskInfo) {
      const diskInfo = combinedData.systemInfo.diskInfo;
      const timestamp = Date.now();

      setDiskData(prev => ({
        usageRoot: [...prev.usageRoot, { value: diskInfo.usedPercent, timestamp }].slice(-maxPoints),
        freeRoot: [...prev.freeRoot, { value: diskInfo.free, timestamp }].slice(-maxPoints),
      }));
    }
  }, [combinedData]);

  const currentUsageRoot = diskData.usageRoot[diskData.usageRoot.length - 1]?.value || 0;
  const currentFreeRoot = diskData.freeRoot[diskData.freeRoot.length - 1]?.value || 0;

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
              <Database className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Storage</span>
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
          <ResourceCard icon={DatabaseZap} label="Usage (root)" value={currentUsageRoot} data={diskData.usageRoot} color="#ff6347" unit="%" valueDisplay={`${currentUsageRoot.toFixed(1)} %`} maxValue={100} />
          <ResourceCard icon={DatabaseBackup} label="Free (root)" value={currentFreeRoot} data={diskData.freeRoot} color="#3cb371" unit="B" valueDisplay={formatBytes(currentFreeRoot)} maxValue={combinedData?.systemInfo.diskInfo?.total || 0} />
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
                  <span className="text-xs font-medium text-muted-foreground">Disk Details</span>
                  <div className="mt-1 space-y-1 text-sm text-foreground">
                    <div className="flex justify-between py-1.5 px-2 rounded-md hover:bg-muted/50 transition-colors">
                      <span>Total Storage of Root</span>
                      <span className="font-mono text-muted-foreground">{formatBytes(combinedData?.systemInfo.diskInfo?.total || 0)}</span>
                    </div>
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
"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Split, ArrowDown, ArrowUp, ChevronDown } from "lucide-react"
import { ResourceCard } from "@/components/ui/resource-display"
import { useWebSocket } from "@/components/websocket-provider"
import { DataPoint } from "@/types"
import { formatBytes, formatNetworkSpeed } from "@/lib/formatters"

export default function NetworkInfoCard() {
  const { combinedData } = useWebSocket();
  const [isExpanded, setIsExpanded] = useState(false);

  const [networkData, setNetworkData] = useState<{
    networkIn: DataPoint[];
    networkOut: DataPoint[];
  }>({
    networkIn: [{ value: 0, timestamp: Date.now() }],
    networkOut: [{ value: 0, timestamp: Date.now() }],
  });

  useEffect(() => {
    const maxPoints = 7;
    if (combinedData?.systemInfo?.networkInfo) {
      const networkInfo = combinedData.systemInfo.networkInfo;
      const timestamp = Date.now();

      setNetworkData(prev => ({
        networkIn: [...prev.networkIn, { value: combinedData.systemInfo.bytesRecvPerSecond, timestamp }].slice(-maxPoints),
        networkOut: [...prev.networkOut, { value: combinedData.systemInfo.bytesSentPerSecond, timestamp }].slice(-maxPoints),
      }));
    }
  }, [combinedData]);

  const currentNetworkIn = networkData.networkIn[networkData.networkIn.length - 1]?.value || 0;
  const currentNetworkOut = networkData.networkOut[networkData.networkOut.length - 1]?.value || 0;

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
              <Split className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Network</span>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 px-3 pb-3">
          <ResourceCard icon={ArrowDown} label="Inbound" value={currentNetworkIn} data={networkData.networkIn} color="#ff6347" unit="B/s" valueDisplay={formatNetworkSpeed(currentNetworkIn)} maxValue={Math.max(...networkData.networkIn.map(d => d.value), 1) * 1.15} />
          <ResourceCard icon={ArrowUp} label="Outbound" value={currentNetworkOut} data={networkData.networkOut} color="#3cb371" unit="B/s" valueDisplay={formatNetworkSpeed(currentNetworkOut)} maxValue={Math.max(...networkData.networkOut.map(d => d.value), 1) * 1.15} />
        </div>

        
      </Card>
    </motion.div>
  );
}
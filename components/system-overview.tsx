"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Cog, ArrowDownUp, Fan, Layers, Database, ChevronDown } from "lucide-react"
import { ResourceCard } from "@/components/ui/resource-display"
import { useWebSocket } from "@/components/websocket-provider"
import { ResourceData } from "@/types"
import { formatNetworkSpeed, formatUptime, formatMemorySize, formatDiskSize, formatBytes } from "@/lib/formatters"

export default function SystemOverview() {
  const { combinedData } = useWebSocket();
  const [resourceData, setResourceData] = useState<ResourceData>({
    cpu: [{ value: 0, timestamp: Date.now() - 1000 }, { value: 0, timestamp: Date.now() }],
    network: [{ value: 0, timestamp: Date.now() - 1000 }, { value: 0, timestamp: Date.now() }],
    memory: [{ value: 0, timestamp: Date.now() - 1000, totalMemory: 0 }, { value: 0, timestamp: Date.now(), totalMemory: 0 }],
    disk: [{ value: 0, timestamp: Date.now() - 1000 }, { value: 0, timestamp: Date.now() }],
  })

  const currentMemoryUsage = resourceData.memory[resourceData.memory.length - 1]?.value || 0; // Already percentage

  
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    const maxPoints = 7; // Keep last 8 data points for the graph

    if (combinedData) {
      // Update resource data
      setResourceData(prev => ({
        cpu: [...prev.cpu, combinedData.systemInfo.resourceData.cpu[0]].slice(-maxPoints),
        network: [...prev.network, combinedData.systemInfo.resourceData.network[0]].slice(-maxPoints),
        memory: [...prev.memory, combinedData.systemInfo.resourceData.memory[0]].slice(-maxPoints),
        disk: [...prev.disk, combinedData.systemInfo.resourceData.disk[0]].slice(-maxPoints),
      }));
      
    }
  }, [combinedData]);

  const currentCpu = resourceData.cpu[resourceData.cpu.length - 1]?.value || 0;
  const currentNetwork = resourceData.network[resourceData.network.length - 1]?.value || 0;
  const currentMemory = resourceData.memory[resourceData.memory.length - 1]?.value || 0;
  const currentDisk = resourceData.disk[resourceData.disk.length - 1]?.value || 0;

  const totalMemory = resourceData.memory[resourceData.memory.length - 1]?.totalMemory || 0;
  const totalDisk = resourceData.disk[resourceData.disk.length - 1]?.total || 0;

  return (
    <motion.div
      className="flex items-center justify-center mb-4 pt-20"
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
                <Fan className="w-4 h-4 text-muted-foreground" />
              </motion.div>
              <span className="text-sm font-medium">System Overview</span>
              
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
          <ResourceCard icon={Cog} label="Compute" value={currentCpu} data={resourceData.cpu} color="#1e90ff" maxValue={100} />
          <ResourceCard
            icon={ArrowDownUp}
            label="Network"
            value={currentNetwork}
            data={resourceData.network}
            color="#8b5cf6"
            unit=""
            valueDisplay={formatNetworkSpeed(currentNetwork)}
            maxValue={Math.max(...resourceData.network.map(d => d.value), 1) * 1.2}
          />
          <ResourceCard
            icon={Layers}
            label="Memory"
            value={currentMemory}
            data={resourceData.memory.map(d => ({ value: d.value, timestamp: d.timestamp }))}
            color="#00ced1"
            unit="%" // Display percentage symbol
            valueDisplay={`${currentMemoryUsage.toFixed(1)} %`} // Show the percentage directly
            maxValue={100}
          />
          <ResourceCard
            icon={Database}
            label="Disk"
            value={currentDisk}
            data={resourceData.disk}
            color="#f59e0b"
            unit="%"
            valueDisplay={`${currentDisk.toFixed(1)} %`} // Show the percentage directly
            maxValue={100}
          />
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
                  <span className="text-xs font-medium text-muted-foreground">System Details</span>
                  <div className="mt-1 space-y-1 text-sm text-foreground">
                    <div className="flex justify-between py-1.5 px-2 rounded-md hover:bg-muted/50 transition-colors">
                      <span>Uptime</span>
                      <span className="font-mono text-muted-foreground">{formatUptime(combinedData?.systemInfo.uptime || 0)}</span>
                    </div>
                    <div className="flex justify-between py-1.5 px-2 rounded-md hover:bg-muted/50 transition-colors">
                      <span>CPU Cores</span>
                      <span className="font-mono text-muted-foreground">{combinedData?.systemInfo.cpuCores || 0}</span>
                    </div>
                    <div className="flex justify-between py-1.5 px-2 rounded-md hover:bg-muted/50 transition-colors">
                      <span>Memory</span>
                      <span className="font-mono text-muted-foreground">{formatMemorySize(combinedData?.systemInfo.totalRAM || 0)}</span>
                    </div>
                    <div className="flex justify-between py-1.5 px-2 rounded-md hover:bg-muted/50 transition-colors">
                      <span>Storage</span>
                      <span className="font-mono text-muted-foreground">{formatBytes(combinedData?.systemInfo.totalDisk || 0)}</span>
                    </div>
                    <div className="flex justify-between py-1.5 px-2 rounded-md hover:bg-muted/50 transition-colors">
                      <span>Active Containers</span>
                      <span className="font-mono text-muted-foreground">{combinedData?.systemInfo.runningContainers || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  )
}


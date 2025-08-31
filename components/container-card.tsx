"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Cog, Layers, Box, ChevronDown, ArrowDown, ArrowUp } from "lucide-react"
import { ResourceCard } from "@/components/ui/resource-display"
import { cn } from "@/lib/utils"
import { Container } from "@/types"
import { formatNetworkSpeed, formatBytes, formatUptime, formatMemorySize, formatRelativeTime } from "@/lib/formatters"

interface ContainerCardProps {
  container: Container
}

export default function ContainerCard({ container }: ContainerCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const isOffline = container.status === "stopped" || container.status === "exited";

  const getStatusColorClass = (status: string) => {
    switch (status) {
      case "running":
        return "text-green-500";
      case "stopped":
      case "exited":
        return "text-red-500";
      case "restarting":
        return "text-yellow-500";
      default:
        return "text-muted-foreground";
    }
  };

  const currentCpuValue = container.cpuUsage[container.cpuUsage.length - 1]?.value || 0;
  const currentRamValue = container.ramUsage[container.ramUsage.length - 1]?.value || 0;
  const currentNetworkRxValue = container.networkRxBytes[container.networkRxBytes.length - 1]?.value || 0;
  const currentNetworkTxValue = container.networkTxBytes[container.networkTxBytes.length - 1]?.value || 0;

  const maxNetworkValue = Math.max(
    ...container.networkRxBytes.map(d => d.value),
    ...container.networkTxBytes.map(d => d.value),
    1 // Ensure a minimum max value of 1 to avoid division by zero or issues with empty data
  ) * 1.2; // Add a 20% buffer

  return (
    <motion.div
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="w-full max-w-2xl"
    >
      <Card className="w-full bg-background/95 backdrop-blur-sm border border-border shadow-lg">
        <motion.div
          className="p-3 cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
          whileHover={{ backgroundColor: "hsl(var(--muted) / 0.5)" }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Box className={cn("w-4 h-4", getStatusColorClass(container.status))} />
              <span className="text-sm font-medium">{container.name}</span>
            </div>
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="text-muted-foreground"
            >
              <ChevronDown className="h-4 w-4" />
            </motion.div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            <ResourceCard
              icon={Cog}
              label="CPU"
              value={currentCpuValue}
              data={container.cpuUsage}
              color={isOffline ? "#808080" : "#1e90ff"} // Grey if offline, else blue
              unit="%"
            />
            <ResourceCard
              icon={Layers}
              label="Memory"
              value={currentRamValue}
              data={container.ramUsage.map(d => ({ value: d.value, timestamp: d.timestamp }))} // Map to DataPoint[]
              color={isOffline ? "#808080" : "#00ced1"} // Grey if offline, else teal
              unit="MB"
              valueDisplay={formatMemorySize(currentRamValue)}
              maxValue={container.ramUsage[container.ramUsage.length - 1]?.totalMemory || 100} // Use totalMemory from the latest data point
            />
            <ResourceCard
              icon={ArrowDown}
              label="Inbound"
              value={currentNetworkRxValue}
              data={container.networkRxBytes}
              color={isOffline ? "#808080" : "#8b5cf6"} // Grey if offline, else purple
              unit="B/s"
              valueDisplay={formatNetworkSpeed(currentNetworkRxValue)}
              maxValue={maxNetworkValue}
            />
            <ResourceCard
              icon={ArrowUp}
              label="Outbound"
              value={currentNetworkTxValue}
              data={container.networkTxBytes}
              color={isOffline ? "#808080" : "#8b5cf6"} // Grey if offline, else purple
              unit="B/s"
              valueDisplay={formatNetworkSpeed(currentNetworkTxValue)}
              maxValue={maxNetworkValue}
            />
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
              <div className="px-3 pb-3 border-t border-border">
                <div className="mt-3 mb-2">
                  <span className="text-xs font-medium text-muted-foreground">Container Details</span>
                  <div className="mt-1 space-y-1 text-sm text-foreground">
                    <div className="flex justify-between py-1.5 px-2 rounded-md hover:bg-muted/50 transition-colors">
                      <span>Status</span>
                      <span className="font-mono text-muted-foreground capitalize">{container.status}</span>
                    </div>
                    <div className="flex justify-between py-1.5 px-2 rounded-md hover:bg-muted/50 transition-colors">
                      <span>{isOffline ? "Last online" : "Uptime"}</span>
                      <span className="font-mono text-muted-foreground">
                        {isOffline && container.finishedAt
                          ? formatRelativeTime(container.finishedAt)
                          : formatUptime(container.uptime || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5 px-2 rounded-md hover:bg-muted/50 transition-colors">
                      <span>Inbound</span>
                      <span className="font-mono text-muted-foreground">{formatBytes(container.totalRxBytes || 0)}</span>
                    </div>
                    <div className="flex justify-between py-1.5 px-2 rounded-md hover:bg-muted/50 transition-colors">
                      <span>Outbound</span>
                      <span className="font-mono text-muted-foreground">{formatBytes(container.totalTxBytes || 0)}</span>
                    </div>
                    <div className="flex justify-between py-1.5 px-2 rounded-md hover:bg-muted/50 transition-colors">
                      <span>Block Read</span>
                      <span className="font-mono text-muted-foreground">{formatBytes(container.blockRead || 0)}</span>
                    </div>
                    <div className="flex justify-between py-1.5 px-2 rounded-md hover:bg-muted/50 transition-colors">
                      <span>Block Write</span>
                      <span className="font-mono text-muted-foreground">{formatBytes(container.blockWrite || 0)}</span>
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


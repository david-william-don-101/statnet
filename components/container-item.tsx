"use client"

import { motion } from "framer-motion"
import { Container } from "@/types"
import { formatMemorySize } from "@/lib/formatters"

export const ContainerItem = ({ container, index }: { container: Container, index: number }) => {
    const statusColor =
        container.status === "running" ? "bg-green-500" : (container.status === "stopped" || container.status === "exited") ? "bg-red-500" : "bg-yellow-500"

    const currentCpuValue = container.cpuUsage[container.cpuUsage.length - 1]?.value || 0;
    const currentRamValue = container.ramUsage[container.ramUsage.length - 1]?.value || 0;

    return (
        <motion.div
            key={container.id}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{
                delay: index * 0.05,
                type: "spring",
                stiffness: 300,
                damping: 30,
            }}
        >
            <div className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${statusColor}`} />
                    <span className="text-sm truncate">{container.name}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="font-mono">{currentCpuValue.toFixed(1)}% CPU</span>
                    <span className="font-mono">{formatMemorySize(currentRamValue)} RAM</span>
                </div>
            </div>
        </motion.div>
    )
}

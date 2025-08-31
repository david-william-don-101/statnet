"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Cog, Eclipse, Loader, Radiation, UserRoundCog, ChevronDown, Cpu } from "lucide-react"
import { ResourceCard } from "@/components/ui/resource-display"
import { useWebSocket } from "@/components/websocket-provider"
import { DataPoint } from "@/types"

export default function CpuInfoCard() {
  const { combinedData } = useWebSocket();
  const [isExpanded, setIsExpanded] = useState(false);

  const [cpuData, setCpuData] = useState<{
    ioWait: DataPoint[];
    steal: DataPoint[];
    user: DataPoint[];
    system: DataPoint[];
  }>({
    ioWait: [{ value: 0, timestamp: Date.now() }],
    steal: [{ value: 0, timestamp: Date.now() }],
    user: [{ value: 0, timestamp: Date.now() }],
    system: [{ value: 0, timestamp: Date.now() }],
  });

  const [coreData, setCoreData] = useState<Record<string, DataPoint[]>>({})

  useEffect(() => {
    const maxPoints = 7;
    if (combinedData?.systemInfo?.cpuInfo?.cpuTimes) {
      const cpuTimes = combinedData.systemInfo.cpuInfo.cpuTimes;
      const timestamp = Date.now();

      setCpuData(prev => ({
        ioWait: [...prev.ioWait, { value: cpuTimes.iowait, timestamp }].slice(-maxPoints),
        steal: [...prev.steal, { value: cpuTimes.steal, timestamp }].slice(-maxPoints),
        user: [...prev.user, { value: cpuTimes.user, timestamp }].slice(-maxPoints),
        system: [...prev.system, { value: cpuTimes.system, timestamp }].slice(-maxPoints),
      }));
    }

    // Handle per-core data
    if (combinedData?.systemInfo?.cpuPerCore) {
      const timestamp = Date.now();
      const newCoreData: Record<string, DataPoint[]> = {};

      combinedData.systemInfo.cpuPerCore.forEach((usage, index) => {
        const coreKey = `core${index}`;
        const dataPoint: DataPoint = { value: usage, timestamp };

        if (!coreData[coreKey]) {
          newCoreData[coreKey] = [dataPoint];
        } else {
          newCoreData[coreKey] = [...coreData[coreKey], dataPoint].slice(-maxPoints);
        }
      });

      setCoreData(newCoreData);
    }
  }, [combinedData]);

  const currentIoWait = cpuData.ioWait[cpuData.ioWait.length - 1]?.value || 0;
  const currentSteal = cpuData.steal[cpuData.steal.length - 1]?.value || 0;
  const currentUser = cpuData.user[cpuData.user.length - 1]?.value || 0;
  const currentSystem = cpuData.system[cpuData.system.length - 1]?.value || 0;

  const cpuCores = combinedData?.systemInfo?.cpuCores || 0;
  // Limit displayed cores to prevent overcrowding (max 12 cores for display)
  const maxDisplayedCores = Math.min(cpuCores, 12);
  const cores = Array.from({ length: maxDisplayedCores }, (_, i) => i);

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
              <Cog className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Compute</span>
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
          <ResourceCard icon={Eclipse} label="IO Wait" value={currentIoWait} data={cpuData.ioWait} color="#ff6347" unit="%" valueDisplay={`${currentIoWait.toFixed(1)} %`} maxValue={100} />
          <ResourceCard icon={Loader} label="Steal" value={currentSteal} data={cpuData.steal} color="#ffa500" unit="%" valueDisplay={`${currentSteal.toFixed(1)} %`} maxValue={100} />
          <ResourceCard icon={UserRoundCog} label="User" value={currentUser} data={cpuData.user} color="#3cb371" unit="%" valueDisplay={`${currentUser.toFixed(1)} %`} maxValue={100} />
          <ResourceCard icon={Radiation} label="System" value={currentSystem} data={cpuData.system} color="#00ced1" unit="%" valueDisplay={`${currentSystem.toFixed(1)} %`} maxValue={100} />

          {cores.map((coreIndex) => {
            const coreKey = `core${coreIndex}`;
            const data = coreData[coreKey] || [{ value: 0, timestamp: Date.now() }];
            const currentValue = data[data.length - 1]?.value || 0;

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
            );
          })}
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
                    <span className="text-xs font-medium text-muted-foreground">CPU Details</span>
                    <div className="mt-1 space-y-1 text-sm text-foreground">
                      <div className="flex justify-between py-1.5 px-2 rounded-md hover:bg-muted/50 transition-colors">
                        <span>Model</span>
                        <span className="font-mono text-muted-foreground">{combinedData?.systemInfo.cpuInfo?.modelName || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between py-1.5 px-2 rounded-md hover:bg-muted/50 transition-colors">
                        <span>Cores</span>
                        <span className="font-mono text-muted-foreground">{combinedData?.systemInfo.cpuInfo?.cores || 0}</span>
                      </div>
                      <div className="flex justify-between py-1.5 px-2 rounded-md hover:bg-muted/50 transition-colors">
                        <span>Threads</span>
                        <span className="font-mono text-muted-foreground">{combinedData?.systemInfo.cpuInfo?.threads || 0}</span>
                      </div>
                      <div className="flex justify-between py-1.5 px-2 rounded-md hover:bg-muted/50 transition-colors">
                        <span>Clock Speed</span>
                        <span className="font-mono text-muted-foreground">{combinedData?.systemInfo.cpuInfo?.mhz ? `${combinedData.systemInfo.cpuInfo.mhz.toFixed(2)} MHz` : 'N/A'}</span>
                      </div>
                      <div className="flex justify-between py-1.5 px-2 rounded-md hover:bg-muted/50 transition-colors">
                        <span>Cache Size</span>
                        <span className="font-mono text-muted-foreground">{combinedData?.systemInfo.cpuInfo?.cacheSize ? `${combinedData.systemInfo.cpuInfo.cacheSize} KB` : 'N/A'}</span>
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
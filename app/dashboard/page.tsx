"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cpu, MemoryStick, Network, HardDrive, ArrowDown, ArrowUp } from "lucide-react";
import { useWebSocket } from "@/components/websocket-provider";
import { formatMemorySize, formatNetworkSpeed, formatDiskSize } from "@/lib/formatters";
import GaugeComponent from 'react-gauge-component'
import { ResourceCard } from "@/components/ui/resource-display";

export default function DashboardPage() {
  const { combinedData } = useWebSocket();

  const cpuData = combinedData?.systemInfo?.resourceData?.cpu || [];
  const memoryData = combinedData?.systemInfo?.resourceData?.memory || [];
  const networkData = combinedData?.systemInfo?.resourceData?.network || [];
  const diskData = combinedData?.systemInfo?.resourceData?.disk || [];

  const cpuUsage = cpuData[cpuData.length - 1]?.value || 0;
  const memoryUsage = memoryData[memoryData.length - 1]?.value || 0;
  const totalMemory = memoryData[memoryData.length - 1]?.totalMemory || 0;
  const networkRx = networkData[networkData.length - 1]?.rx || 0;
  const networkTx = networkData[networkData.length - 1]?.tx || 0;
  const diskUsage = diskData[diskData.length - 1]?.used || 0;
  const totalDisk = diskData[diskData.length - 1]?.total || 0;

  return (
    <div className="container mx-auto py-10">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CPU</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <GaugeComponent
              value={cpuUsage}
              maxValue={100}
              type="semicircle"
              arc={{ colorArray: ['#00FF00', '#FF0000'], subArcs: [{ limit: 10 }, { limit: 30 }, {}, {}, {}] }}
              pointer={{ type: "arrow", length: 0.8, width: 15, color: "#FFFFFF" }}
              labels={{ valueLabel: { formatTextValue: value => `${value.toFixed(2)}%` } }}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory</CardTitle>
            <MemoryStick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <GaugeComponent
              value={memoryUsage}
              maxValue={totalMemory}
              type="semicircle"
              arc={{ colorArray: ['#00FF00', '#FF0000'], subArcs: [{ limit: totalMemory * 0.1 }, { limit: totalMemory * 0.3 }, {}, {}, {}] }}
              pointer={{ type: "arrow", length: 0.8, width: 15, color: "#FFFFFF" }}
              labels={{ valueLabel: { formatTextValue: value => `${formatMemorySize(value)}` } }}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Network Inbound</CardTitle>
            <ArrowDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <GaugeComponent
              value={networkRx}
              maxValue={1000000000}
              type="semicircle"
              arc={{ colorArray: ['#00FF00', '#FF0000'], subArcs: [{ limit: 100000000 }, { limit: 300000000 }, {}, {}, {}] }}
              pointer={{ type: "arrow", length: 0.8, width: 15, color: "#FFFFFF" }}
              labels={{ valueLabel: { formatTextValue: value => `${formatNetworkSpeed(value)}` } }}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Network Outbound</CardTitle>
            <ArrowUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <GaugeComponent
              value={networkTx}
              maxValue={1000000000}
              type="semicircle"
              arc={{ colorArray: ['#00FF00', '#FF0000'], subArcs: [{ limit: 100000000 }, { limit: 300000000 }, {}, {}, {}] }}
              pointer={{ type: "arrow", length: 0.8, width: 15, color: "#FFFFFF" }}
              labels={{ valueLabel: { formatTextValue: value => `${formatNetworkSpeed(value)}` } }}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disk</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <GaugeComponent
              value={diskUsage}
              maxValue={totalDisk}
              type="semicircle"
              arc={{ colorArray: ['#00FF00', '#FF0000'], subArcs: [{ limit: totalDisk * 0.1 }, { limit: totalDisk * 0.3 }, {}, {}, {}] }}
              pointer={{ type: "arrow", length: 0.8, width: 15, color: "#FFFFFF" }}
              labels={{ valueLabel: { formatTextValue: value => `${formatDiskSize(value)}` } }}
            />
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2 pt-4">
        <ResourceCard icon={Cpu} label="CPU Usage" value={cpuUsage} data={cpuData} color="#1e90ff" maxValue={100} />
        <ResourceCard icon={MemoryStick} label="Memory Usage" value={memoryUsage} data={memoryData} color="#00ced1" valueDisplay={`${formatMemorySize(memoryUsage)} / ${formatMemorySize(totalMemory)}`} maxValue={totalMemory} />
        <ResourceCard icon={Network} label="Network Usage" value={networkRx + networkTx} data={networkData.map(d => ({...d, value: d.rx + d.tx}))} color="#8b5cf6" unit="B/s" valueDisplay={formatNetworkSpeed(networkRx + networkTx)} maxValue={Math.max(...networkData.map(d => d.rx + d.tx), 1) * 1.15} />
        <ResourceCard icon={HardDrive} label="Disk Usage" value={diskUsage} data={diskData} color="#f59e0b" unit="bytes" valueDisplay={`${formatDiskSize(diskUsage)} / ${formatDiskSize(totalDisk)}`} maxValue={totalDisk} />
      </div>
    </div>
  );
}

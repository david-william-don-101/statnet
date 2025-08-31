package system

import (
	"fmt"
	"log"
	"os"
	"path/filepath"
	"sync"
	"time"

	"backend/pkg/metrics"
	"github.com/shirou/gopsutil/v3/cpu"
	"github.com/shirou/gopsutil/v3/disk"
	"github.com/shirou/gopsutil/v3/host"
	"github.com/shirou/gopsutil/v3/mem"
	psnet "github.com/shirou/gopsutil/v3/net"
)

var (
	prevCPUTimes       map[string]float64
	prevNetStats       map[string]psnet.IOCountersStat
	prevPerCoreTimes   []cpu.TimesStat
	systemMetricsMutex sync.Mutex // Mutex to protect prevCPUTimes and prevNetStats
)

func init() {
	prevCPUTimes = make(map[string]float64)
	prevNetStats = make(map[string]psnet.IOCountersStat)
}

// getDirectorySize calculates the total size of a directory in MB
func getDirectorySize(dirPath string) (float64, error) {
	var totalSize int64 = 0 // Declare and initialize totalSize

	// Check if the path exists and is a directory
	info, err := os.Stat(dirPath)
	if os.IsNotExist(err) {
		return 0, nil // Return 0 size if directory doesn't exist
	} else if err != nil {
		return 0, fmt.Errorf("error stating directory %s: %w", dirPath, err)
	} else if !info.IsDir() {
		return 0, nil // Return 0 size if it's a file or symlink
	}

	err = filepath.Walk(dirPath, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return nil // Continue walking even if there's an error with one path
		}
		if !info.IsDir() {
			totalSize += info.Size()
		}
		return nil
	})
	if err != nil {
		return 0, fmt.Errorf("failed to walk directory %s: %w", dirPath, err)
	}
	return float64(totalSize) / (1024 * 1024), nil // Convert bytes to MB

}

func GetCoolifyDiskUsage() (metrics.DataPoint, error) {
	coolifyPaths := []string{
		"/var/lib/docker/volumes/coolify-db",
		"/var/lib/docker/volumes/coolify-redis",
		"/data/coolify",
	}

	var totalCoolifySizeMB float64
	for _, p := range coolifyPaths {
		size, err := getDirectorySize(p)
		if err != nil {
			continue
		}
		totalCoolifySizeMB += size
	}
	return metrics.DataPoint{Value: totalCoolifySizeMB, Timestamp: time.Now().UnixMilli()}, nil
}

func GetSystemInfo(runningContainers int) (metrics.SystemInfoResponse, error) {
	timestamp := time.Now().UnixMilli()

	var cpuUsage float64
	var perCoreUsage []float64
	currentCPUTimes, err := cpu.Times(true) // Get per-core times
	if err != nil {
		log.Printf("failed to get CPU times: %v", err)
		cpuUsage = 0.0 // Default to 0 if CPU times cannot be retrieved
	} else {
		systemMetricsMutex.Lock()
		defer systemMetricsMutex.Unlock()

		if len(prevCPUTimes) > 0 {
			// Calculate average CPU usage across all cores
			// This avoids the blocking time.Second in cpu.Percent
			totalPrev := prevCPUTimes["total"]
			idlePrev := prevCPUTimes["idle"]

			// Sum all cores for total system usage
			var totalCurrent, idleCurrent float64
			for _, coreTimes := range currentCPUTimes {
				totalCurrent += coreTimes.User + coreTimes.Nice + coreTimes.System +
					coreTimes.Idle + coreTimes.Iowait + coreTimes.Irq +
					coreTimes.Softirq + coreTimes.Steal + coreTimes.Guest +
					coreTimes.GuestNice
				idleCurrent += coreTimes.Idle
			}

			cpuDelta := totalCurrent - totalPrev
			idleDelta := idleCurrent - idlePrev

			if cpuDelta > 0 {
				usage := (1 - (idleDelta / cpuDelta)) * 100
				// Cap at 100% to prevent any calculation errors
				if usage > 100 {
					usage = 100
				} else if usage < 0 {
					usage = 0
				}
				cpuUsage = usage
			}
		}

		// Update prevCPUTimes for the next iteration (sum all cores)
		var totalPrev, idlePrev float64
		for _, coreTimes := range currentCPUTimes {
			totalPrev += coreTimes.User + coreTimes.Nice + coreTimes.System +
				coreTimes.Idle + coreTimes.Iowait + coreTimes.Irq +
				coreTimes.Softirq + coreTimes.Steal + coreTimes.Guest +
				coreTimes.GuestNice
			idlePrev += coreTimes.Idle
		}
		prevCPUTimes["total"] = totalPrev
		prevCPUTimes["idle"] = idlePrev

		// Calculate per-core CPU usage
		if len(prevPerCoreTimes) > 0 && len(currentCPUTimes) == len(prevPerCoreTimes) {
			perCoreUsage = make([]float64, len(currentCPUTimes))
			for i := 0; i < len(currentCPUTimes); i++ {
				prevTotal := prevPerCoreTimes[i].User + prevPerCoreTimes[i].Nice + prevPerCoreTimes[i].System +
					prevPerCoreTimes[i].Idle + prevPerCoreTimes[i].Iowait + prevPerCoreTimes[i].Irq +
					prevPerCoreTimes[i].Softirq + prevPerCoreTimes[i].Steal + prevPerCoreTimes[i].Guest +
					prevPerCoreTimes[i].GuestNice

				currTotal := currentCPUTimes[i].User + currentCPUTimes[i].Nice + currentCPUTimes[i].System +
					currentCPUTimes[i].Idle + currentCPUTimes[i].Iowait + currentCPUTimes[i].Irq +
					currentCPUTimes[i].Softirq + currentCPUTimes[i].Steal + currentCPUTimes[i].Guest +
					currentCPUTimes[i].GuestNice

				totalDelta := currTotal - prevTotal
				idleDelta := currentCPUTimes[i].Idle - prevPerCoreTimes[i].Idle

				if totalDelta > 0 {
					usage := (1 - (idleDelta / totalDelta)) * 100
					// Cap at 100% to prevent any calculation errors
					if usage > 100 {
						usage = 100
					} else if usage < 0 {
						usage = 0
					}
					perCoreUsage[i] = usage
				} else {
					perCoreUsage[i] = 0
				}
			}
		} else {
			// First run or mismatched core count, initialize with zeros
			perCoreUsage = make([]float64, len(currentCPUTimes))
			for i := range perCoreUsage {
				perCoreUsage[i] = 0
			}
		}

		// Store current per-core times for next iteration
		prevPerCoreTimes = currentCPUTimes
	}

	// Memory Usage
	vmem, err := mem.VirtualMemory()
	if err != nil {
		return metrics.SystemInfoResponse{}, fmt.Errorf("failed to get virtual memory: %w", err)
	}
	memUsage := vmem.UsedPercent
	totalMemoryMB := float64(vmem.Total) / (1024 * 1024)

	// Network Usage (simplified, showing total bytes transferred)
	netIOCounters, err := psnet.IOCounters(false)
	if err != nil {
		return metrics.SystemInfoResponse{}, fmt.Errorf("failed to get network IO counters: %w", err)
	}

	var totalRxBytes, totalTxBytes uint64
	for _, stat := range netIOCounters {
		totalRxBytes += stat.BytesRecv
		totalTxBytes += stat.BytesSent
	}

	var bytesRecvPerSecond, bytesSentPerSecond float64
	if prevNetStats["total"].BytesRecv != 0 || prevNetStats["total"].BytesSent != 0 {
		rxDiff := totalRxBytes - prevNetStats["total"].BytesRecv
		txDiff := totalTxBytes - prevNetStats["total"].BytesSent
		// Assuming a 1-second interval for simplicity
		bytesRecvPerSecond = float64(rxDiff)
		bytesSentPerSecond = float64(txDiff)
	}
	prevNetStats["total"] = psnet.IOCountersStat{BytesRecv: totalRxBytes, BytesSent: totalTxBytes}

	// Disk Usage (root partition)
	var diskUsage float64
	var diskTotalMB float64
	diskUsageStat, err := disk.Usage("/")
	if err != nil {
		log.Printf("failed to get disk usage: %v\n", err)
		diskUsage = 0.0
		diskTotalMB = 0.0
	} else {
		diskUsage = diskUsageStat.UsedPercent
		diskTotalMB = float64(diskUsageStat.Total) / (1024 * 1024) // Total disk space in MB
	}

	// Uptime
	bootTime, err := host.BootTime()
	if err != nil {
		return metrics.SystemInfoResponse{}, fmt.Errorf("failed to get boot time: %w", err)
	}
	uptime := time.Now().Unix() - int64(bootTime)

	cpuCoresLogical, err := cpu.Counts(true)
	if err != nil {
		return metrics.SystemInfoResponse{}, fmt.Errorf("failed to get logical CPU cores: %w", err)
	}

	// Total RAM
	totalRAMMB := float64(vmem.Total) / (1024 * 1024)

	// Total Disk
	totalDiskBytes := diskUsageStat.Total

	coolifyDisk, err := GetCoolifyDiskUsage()
	if err != nil {
		// Set to a default or zero value if there's an error
		coolifyDisk = metrics.DataPoint{Value: 0, Timestamp: timestamp}
	}

	cpuInfoDetailed, err := GetCPUInfo()
	if err != nil {
		return metrics.SystemInfoResponse{}, fmt.Errorf("failed to get CPU info: %w", err)
	}

	memoryInfoDetailed, err := GetMemoryInfo()
	if err != nil {
		return metrics.SystemInfoResponse{}, fmt.Errorf("failed to get memory info: %w", err)
	}

	diskInfoDetailed, err := GetDiskInfo()
	if err != nil {
		return metrics.SystemInfoResponse{}, fmt.Errorf("failed to get disk info: %w", err)
	}

	networkInfoDetailed, err := GetNetworkInfo()
	if err != nil {
		return metrics.SystemInfoResponse{}, fmt.Errorf("failed to get network info: %w", err)
	}

	return metrics.SystemInfoResponse{
		ResourceData: metrics.ResourceData{
			CPU:     []metrics.DataPoint{{Value: cpuUsage, Timestamp: timestamp}},
			Network: []metrics.DataPoint{{Value: bytesRecvPerSecond + bytesSentPerSecond, Timestamp: timestamp}},
			Memory:  []metrics.MemoryDataPoint{{Value: memUsage, Timestamp: timestamp, TotalMemory: totalMemoryMB}},
			Disk:    []metrics.DataPoint{{Value: diskUsage, Timestamp: timestamp, Total: diskTotalMB}},
		},
		CoolifyDiskUsage:   coolifyDisk,
		Uptime:             uint64(uptime),
		CPUCores:           int32(cpuCoresLogical),
		TotalRAM:           totalRAMMB,
		TotalDisk:          float64(totalDiskBytes),
		RunningContainers:  runningContainers,
		CPUInfo:            cpuInfoDetailed,
		MemoryInfo:         memoryInfoDetailed,
		DiskInfo:           diskInfoDetailed,
		NetworkInfo:        networkInfoDetailed,
		BytesRecvPerSecond: bytesRecvPerSecond,
		BytesSentPerSecond: bytesSentPerSecond,
		CPUPerCore:         perCoreUsage,
	}, nil
}

func GetCPUInfo() (map[string]interface{}, error) {
	cpuInfo, err := cpu.Info()
	if err != nil {
		return nil, fmt.Errorf("failed to get CPU info: %w", err)
	}
	if len(cpuInfo) == 0 {
		return nil, fmt.Errorf("no CPU info found")
	}

	cpuCoresPhysical, err := cpu.Counts(false)
	if err != nil {
		return nil, fmt.Errorf("failed to get physical CPU cores: %w", err)
	}

	cpuCoresLogical, err := cpu.Counts(true)
	if err != nil {
		return nil, fmt.Errorf("failed to get logical CPU cores: %w", err)
	}

	// Get CPU times for detailed breakdown
	cpuTimes, err := cpu.Times(false) // per-CPU times, not aggregated
	if err != nil {
		return nil, fmt.Errorf("failed to get CPU times: %w", err)
	}

	// Get CPU percentages for detailed breakdown

	// Aggregate CPU times for overall system
	totalCpuTime := cpuTimes[0].User + cpuTimes[0].Nice + cpuTimes[0].System + cpuTimes[0].Idle +
		cpuTimes[0].Iowait + cpuTimes[0].Irq + cpuTimes[0].Softirq + cpuTimes[0].Steal +
		cpuTimes[0].Guest + cpuTimes[0].GuestNice

	cpuDetails := map[string]interface{}{
		"modelName": cpuInfo[0].ModelName,
		"cores":     cpuCoresPhysical,
		"threads":   cpuCoresLogical,
		"mhz":       cpuInfo[0].Mhz,
		"cacheSize": cpuInfo[0].CacheSize,
		"cpuTimes": map[string]float64{
			"user":      cpuTimes[0].User / totalCpuTime * 100,
			"system":    cpuTimes[0].System / totalCpuTime * 100,
			"idle":      cpuTimes[0].Idle / totalCpuTime * 100,
			"nice":      cpuTimes[0].Nice / totalCpuTime * 100,
			"iowait":    cpuTimes[0].Iowait / totalCpuTime * 100,
			"irq":       cpuTimes[0].Irq / totalCpuTime * 100,
			"softirq":   cpuTimes[0].Softirq / totalCpuTime * 100,
			"steal":     cpuTimes[0].Steal / totalCpuTime * 100,
			"guest":     cpuTimes[0].Guest / totalCpuTime * 100,
			"guestNice": cpuTimes[0].GuestNice / totalCpuTime * 100,
		},
	}

	return cpuDetails, nil
}

func GetMemoryInfo() (map[string]interface{}, error) {
	vmem, err := mem.VirtualMemory()
	if err != nil {
		return nil, fmt.Errorf("failed to get virtual memory: %w", err)
	}

	swap, err := mem.SwapMemory()
	if err != nil {
		return nil, fmt.Errorf("failed to get swap memory: %w", err)
	}

	memoryDetails := map[string]interface{}{
		"total":           vmem.Total,
		"available":       vmem.Available,
		"used":            vmem.Used,
		"free":            vmem.Free,
		"usedPercent":     float64(vmem.Used) / float64(vmem.Total) * 100, // Calculate dynamically
		"buffers":         vmem.Buffers,
		"cached":          vmem.Cached,
		"swapTotal":       swap.Total,
		"swapUsed":        swap.Used,
		"swapFree":        swap.Free,
		"swapUsedPercent": swap.UsedPercent,
	}

	return memoryDetails, nil
}

func GetDiskInfo() (map[string]interface{}, error) {
	// For root partition
	diskUsage, err := disk.Usage("/")
	if err != nil {
		return nil, fmt.Errorf("failed to get disk usage for root: %w", err)
	}

	diskDetails := map[string]interface{}{
		"path":        diskUsage.Path,
		"total":       diskUsage.Total,
		"free":        diskUsage.Free,
		"used":        diskUsage.Used,
		"usedPercent": diskUsage.UsedPercent,
	}

	return diskDetails, nil
}

func GetNetworkInfo() (map[string]interface{}, error) {
	netStat, err := psnet.IOCounters(true) // per-interface
	if err != nil {
		return nil, fmt.Errorf("failed to get network IO counters: %w", err)
	}

	var totalBytesSent uint64
	var totalBytesRecv uint64
	for _, stat := range netStat {
		totalBytesSent += stat.BytesSent
		totalBytesRecv += stat.BytesRecv
	}

	networkDetails := map[string]interface{}{
		"totalBytesSent":  totalBytesSent,
		"totalBytesRecv":  totalBytesRecv,
		"tcpConnections":  0,
		"httpConnections": 0,
		"sshConnections":  0,
	}

	return networkDetails, nil
}

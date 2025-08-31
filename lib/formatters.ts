export const formatNetworkSpeed = (bytes: number) => {
  const units = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
  let i = 0;
  while (bytes >= 1024 && i < units.length - 1) {
    bytes /= 1024;
    i++;
  }
  return `${bytes.toFixed(1)} ${units[i]}`;
};

export const formatBytes = (bytes: number) => {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;
  while (bytes >= 1024 && i < units.length - 1) {
    bytes /= 1024;
    i++;
  }
  return `${bytes.toFixed(1)} ${units[i]}`;
};

export const formatUptime = (seconds: number) => {
  const days = Math.floor(seconds / (3600 * 24));
  seconds %= (3600 * 24);
  const hours = Math.floor(seconds / 3600);
  seconds %= 3600;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  let uptimeString = "";
  if (days > 0) uptimeString += `${days}d `;
  if (hours > 0) uptimeString += `${hours}h `;
  if (minutes > 0) uptimeString += `${minutes}m `;
  if (remainingSeconds > 0 || uptimeString === "") uptimeString += `${remainingSeconds}s`;
  return uptimeString.trim();
};

export const formatMemorySize = (mb: number) => {
  if (mb >= 1000) {
    return `${(mb / 1024).toFixed(1)} GB`;
  } else {
    return `${mb.toFixed(1)} MB`;
  }
};

export const formatDiskSize = (mb: number) => {
  if (mb >= 1000) {
    return `${(mb / 1024).toFixed(1)} GB`;
  } else {
    return `${mb.toFixed(1)} MB`;
  }
};

export const formatRelativeTime = (timestamp: number) => {
  const now = Date.now();
  const seconds = Math.floor((now - timestamp) / 1000);

  if (seconds < 60) {
    return `${seconds} seconds ago`;
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes} minutes ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} hours ago`;
  }

  const days = Math.floor(hours / 24);
  if (days < 30) {
    return `${days} days ago`;
  }

  const months = Math.floor(days / 30);
  if (months < 12) {
    return `${months} months ago`;
  }

  const years = Math.floor(months / 12);
  return `${years} years ago`;
};

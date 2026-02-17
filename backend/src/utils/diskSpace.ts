import os from "node:os";
import checkDiskSpace from "check-disk-space";

export async function freeDiskSpace(): Promise<number> {
  const platform = os.platform();
  const path = platform === "win32" ? "C:" : "/";

  const disk = await (checkDiskSpace as any)(path);

  return disk.free
}

export function toGB (byte: number) {
  return (byte / 1024 ** 3).toFixed(2)
}
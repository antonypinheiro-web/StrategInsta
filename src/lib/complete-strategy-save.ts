// Legacy bridge until saving and credit accounting share a server transaction.
export async function completeStrategySave(
  persist: () => Promise<void>,
  recordUsage: () => Promise<void>,
): Promise<void> {
  await persist();
  await recordUsage();
}

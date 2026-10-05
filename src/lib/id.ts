/** Collision-resistant id for client-generated records (logs, task entries). */
export function createId(): string {
  return crypto.randomUUID();
}

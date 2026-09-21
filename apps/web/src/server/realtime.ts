import { EventEmitter } from "node:events";

// In-process pub/sub standing in for a Redis/WS-backed realtime layer
// (ARCHITECTURE.md §0, §9). Swap this module's implementation for a
// Redis pub/sub-backed one to scale beyond a single Node process; the
// publish(appInstanceId, event) / subscribe(appInstanceId, handler) contract
// stays the same for every call site.

export interface RealtimeEvent {
  type: string; // e.g. "data.created" | "data.updated" | "data.deleted" | "spec.updated"
  entityType?: string;
  payload: unknown;
  at: string;
}

const emitter = new EventEmitter();
emitter.setMaxListeners(0);

export function publish(appInstanceId: string, event: RealtimeEvent) {
  emitter.emit(appInstanceId, event);
}

export function subscribe(appInstanceId: string, handler: (event: RealtimeEvent) => void): () => void {
  emitter.on(appInstanceId, handler);
  return () => emitter.off(appInstanceId, handler);
}

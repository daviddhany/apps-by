"use client";

import { useEffect, useRef } from "react";

export function useAppRealtime(appInstanceId: string, onEvent: () => void) {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    const source = new EventSource(`/api/apps/${appInstanceId}/events`);
    source.onmessage = () => onEventRef.current();
    source.onerror = () => {
      // EventSource auto-reconnects; nothing to do here beyond letting it retry.
    };
    return () => source.close();
  }, [appInstanceId]);
}

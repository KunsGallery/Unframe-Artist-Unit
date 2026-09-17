"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "./auth-provider";
import { recordEngagement, type EngagementTarget } from "./engagements";

export function EngagementBeacon({ targetType, targetId, source }: { targetType: EngagementTarget; targetId: string; source?: string }) {
  const { user } = useAuth();
  const recorded = useRef(false);

  useEffect(() => {
    if (!user || recorded.current) return;
    recorded.current = true;
    void recordEngagement({ actorUid: user.uid, action: "view", targetType, targetId, source });
  }, [source, targetId, targetType, user]);

  return null;
}

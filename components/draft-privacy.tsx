"use client";

import { useEffect } from "react";

const DRAFT_PREFIX = "summer-os:checkin-draft:";
const OWNER_KEY = "summer-os:draft-owner";

export function clearSummerOsDrafts() {
  for (let index = localStorage.length - 1; index >= 0; index -= 1) {
    const key = localStorage.key(index);
    if (key?.startsWith(DRAFT_PREFIX)) localStorage.removeItem(key);
  }
  localStorage.removeItem(OWNER_KEY);
}

export function DraftPrivacyGuard({ userId }: { userId?: string }) {
  useEffect(() => {
    if (!userId) return;
    const previous = localStorage.getItem(OWNER_KEY);
    if (previous && previous !== userId) clearSummerOsDrafts();
    localStorage.setItem(OWNER_KEY, userId);
  }, [userId]);
  return null;
}

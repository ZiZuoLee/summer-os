import type { getSettingsProfile } from "@/lib/data/sections";

export type AwaitedReturn = Awaited<ReturnType<typeof getSettingsProfile>>;

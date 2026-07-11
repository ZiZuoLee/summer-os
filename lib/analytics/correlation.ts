export interface PairedObservation {
  x: number | null | undefined;
  y: number | null | undefined;
}

export type CorrelationResult =
  | {
      available: false;
      reason: "INSUFFICIENT_DATA" | "NO_VARIANCE";
      sampleCount: number;
    }
  | {
      available: true;
      coefficient: number;
      sampleCount: number;
      strength: "WEAK" | "MODERATE" | "STRONG";
      disclaimer: string;
    };

export function calculateCorrelation(
  pairs: PairedObservation[],
): CorrelationResult {
  const valid = pairs.filter(
    (pair): pair is { x: number; y: number } =>
      typeof pair.x === "number" &&
      Number.isFinite(pair.x) &&
      typeof pair.y === "number" &&
      Number.isFinite(pair.y),
  );
  if (valid.length < 10) {
    return {
      available: false,
      reason: "INSUFFICIENT_DATA",
      sampleCount: valid.length,
    };
  }

  const meanX = valid.reduce((sum, pair) => sum + pair.x, 0) / valid.length;
  const meanY = valid.reduce((sum, pair) => sum + pair.y, 0) / valid.length;
  let numerator = 0;
  let squaredX = 0;
  let squaredY = 0;
  for (const pair of valid) {
    const deltaX = pair.x - meanX;
    const deltaY = pair.y - meanY;
    numerator += deltaX * deltaY;
    squaredX += deltaX ** 2;
    squaredY += deltaY ** 2;
  }
  const denominator = Math.sqrt(squaredX * squaredY);
  if (denominator === 0)
    return {
      available: false,
      reason: "NO_VARIANCE",
      sampleCount: valid.length,
    };

  const coefficient = numerator / denominator;
  const absolute = Math.abs(coefficient);
  return {
    available: true,
    coefficient: Number(coefficient.toFixed(3)),
    sampleCount: valid.length,
    strength:
      absolute >= 0.7 ? "STRONG" : absolute >= 0.4 ? "MODERATE" : "WEAK",
    disclaimer: "相关性不代表因果关系，也不构成健康或学习建议。",
  };
}

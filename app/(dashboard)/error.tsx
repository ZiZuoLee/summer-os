"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function DashboardError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Card className="mx-auto mt-16 max-w-xl border-danger/20">
      <CardContent className="grid min-h-72 place-items-center text-center">
        <div>
          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-danger-soft text-danger">
            <AlertTriangle className="size-6" />
          </span>
          <h1 className="mt-5 text-xl font-semibold">这一页暂时没有跟上节奏</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            你的数据没有丢失。可以重新载入，或稍后再试。
          </p>
          <Button className="mt-6" onClick={reset}>
            <RotateCcw className="size-4" />
            重新载入
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

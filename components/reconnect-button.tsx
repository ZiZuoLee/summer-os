"use client";

import { RotateCw } from "lucide-react";

import { Button } from "./ui/button";

export function ReconnectButton() {
  return (
    <Button onClick={() => window.location.reload()}>
      <RotateCw aria-hidden="true" className="size-4" />
      重新连接
    </Button>
  );
}

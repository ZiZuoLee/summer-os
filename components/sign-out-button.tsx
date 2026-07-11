"use client";

import { LogOut } from "lucide-react";
import { clearSummerOsDrafts } from "@/components/draft-privacy";
import { Button } from "@/components/ui/button";

export function SignOutButton({
  action,
}: {
  action: (formData: FormData) => void | Promise<void>;
}) {
  return (
    <form action={action} onSubmit={clearSummerOsDrafts}>
      <Button
        type="submit"
        variant="ghost"
        size="icon"
        aria-label="退出登录"
        title="退出登录"
      >
        <LogOut aria-hidden="true" className="size-4" />
      </Button>
    </form>
  );
}

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthForm } from "@/app/(auth)/_components/auth-form";
import type { AuthActionState } from "@/app/(auth)/actions";
import { expectNoA11yViolations } from "@/tests/helpers/accessibility";

const { browserEnv } = vi.hoisted(() => ({
  browserEnv: { turnstileSiteKey: "" },
}));

vi.mock("@/lib/env", () => ({ publicEnv: browserEnv }));

vi.mock("@marsidev/react-turnstile", () => ({
  Turnstile: ({
    onSuccess,
    onExpire,
  }: {
    onSuccess: (token: string) => void;
    onExpire: () => void;
  }) => (
    <div data-testid="turnstile-widget">
      <button type="button" onClick={() => onSuccess("verified-token")}>
        通过验证
      </button>
      <button type="button" onClick={onExpire}>
        令牌过期
      </button>
    </div>
  ),
}));

const fields = [
  { name: "email", label: "邮箱", type: "email" },
  { name: "password", label: "密码", type: "password" },
];

function Wrapper({ children }: { children: ReactNode }) {
  return <main>{children}</main>;
}

describe("AuthForm", () => {
  beforeEach(() => {
    browserEnv.turnstileSiteKey = "";
  });

  it("renders labeled controls and the safe local Turnstile fallback", async () => {
    const action = vi.fn(async (): Promise<AuthActionState> => ({
      status: "idle",
    }));
    const { container } = render(
      <AuthForm action={action} fields={fields} submitLabel="登录" turnstile />,
      { wrapper: Wrapper },
    );

    expect(screen.getByLabelText("邮箱")).toHaveAttribute("type", "email");
    expect(screen.getByLabelText("密码")).toHaveAttribute("type", "password");
    expect(screen.getByText("本地环境：安全验证将在部署后启用")).toBeVisible();
    expect(screen.queryByTestId("turnstile-widget")).not.toBeInTheDocument();
    await expectNoA11yViolations(container);
  });

  it("submits a completed Turnstile token and clears it on expiry", async () => {
    browserEnv.turnstileSiteKey = "test-site-key";
    const user = userEvent.setup();
    const seenTokens: string[] = [];
    const action = vi.fn(
      async (
        _state: AuthActionState,
        data: FormData,
      ): Promise<AuthActionState> => {
        seenTokens.push(String(data.get("turnstileToken")));
        return { status: "success", message: "请求已安全提交" };
      },
    );
    render(
      <AuthForm action={action} fields={fields} submitLabel="继续" turnstile />,
    );

    await user.click(screen.getByRole("button", { name: "通过验证" }));
    await user.type(screen.getByLabelText("邮箱"), "person@example.com");
    await user.type(screen.getByLabelText("密码"), "ExamplePassword1");
    await user.click(screen.getByRole("button", { name: "继续" }));

    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
    expect(seenTokens).toEqual(["verified-token"]);
    expect(screen.getByRole("status")).toHaveTextContent("请求已安全提交");

    await user.click(screen.getByRole("button", { name: "令牌过期" }));
    expect(
      document.querySelector<HTMLInputElement>('input[name="turnstileToken"]'),
    ).toHaveValue("");
  });

  it("announces server field errors and generic authentication errors", async () => {
    const user = userEvent.setup();
    const action = vi.fn(async (): Promise<AuthActionState> => ({
      status: "error",
      message: "邮箱或密码不正确，请重试。",
      fieldErrors: { email: ["请输入有效的邮箱地址"] },
    }));
    render(<AuthForm action={action} fields={fields} submitLabel="登录" />);

    await user.click(screen.getByRole("button", { name: "登录" }));

    expect(await screen.findByText("请输入有效的邮箱地址")).toHaveAttribute(
      "id",
      "email-error",
    );
    expect(screen.getByLabelText("邮箱")).toHaveAttribute(
      "aria-describedby",
      "email-error",
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "邮箱或密码不正确，请重试。",
    );
  });

  it("requires both signup acknowledgements in the rendered contract", () => {
    const action = vi.fn(async (): Promise<AuthActionState> => ({
      status: "idle",
    }));
    render(
      <AuthForm
        action={action}
        fields={fields}
        submitLabel="创建账号"
        signupConsent
      />,
    );

    expect(
      screen.getByRole("checkbox", { name: /已满 18 周岁/ }),
    ).toBeVisible();
    expect(
      screen.getByRole("checkbox", { name: /不提供医疗建议/ }),
    ).toBeVisible();
    expect(screen.getByRole("link", { name: "隐私说明" })).toHaveAttribute(
      "href",
      "/privacy",
    );
  });
});

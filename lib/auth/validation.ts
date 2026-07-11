import { z } from "zod";

const email = z.string().trim().email("请输入有效的邮箱地址").max(254);
const password = z
  .string()
  .min(12, "密码至少需要 12 个字符")
  .max(72, "密码不能超过 72 个字符")
  .regex(/[a-z]/, "密码需要包含小写字母")
  .regex(/[A-Z]/, "密码需要包含大写字母")
  .regex(/[0-9]/, "密码需要包含数字");

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "请输入密码"),
});

export const signupSchema = z
  .object({
    displayName: z.string().trim().min(1, "请输入昵称").max(40),
    email,
    password,
    passwordConfirm: z.string(),
    ageConfirmed: z.literal("on", { error: "需要确认已满 18 周岁" }),
    disclaimerAccepted: z.literal("on", { error: "需要阅读并同意健康提示" }),
    turnstileToken: z.string().optional(),
  })
  .refine((value) => value.password === value.passwordConfirm, {
    path: ["passwordConfirm"],
    message: "两次输入的密码不一致",
  });

export const forgotPasswordSchema = z.object({
  email,
  turnstileToken: z.string().optional(),
});

export const updatePasswordSchema = z
  .object({ password, passwordConfirm: z.string() })
  .refine((value) => value.password === value.passwordConfirm, {
    path: ["passwordConfirm"],
    message: "两次输入的密码不一致",
  });

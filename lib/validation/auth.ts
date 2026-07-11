import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("请输入有效邮箱地址")
  .max(254);

export const passwordSchema = z
  .string()
  .min(12, "密码至少需要 12 个字符")
  .max(128, "密码不能超过 128 个字符")
  .regex(/[a-z]/, "密码需要包含小写字母")
  .regex(/[A-Z]/, "密码需要包含大写字母")
  .regex(/\d/, "密码需要包含数字")
  .regex(/[^\p{L}\p{N}]/u, "密码需要包含符号");

export const signUpSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    isAdult: z.literal(true, { error: "Summer OS 公测仅面向 18 岁及以上用户" }),
    healthDisclaimerAccepted: z.literal(true, { error: "请确认一般健康提示" }),
    turnstileToken: z.string().min(1, "请完成人机验证").max(2048),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "两次输入的密码不一致",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "请输入密码").max(128),
  turnstileToken: z.string().min(1, "请完成人机验证").max(2048).optional(),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
  turnstileToken: z.string().min(1, "请完成人机验证").max(2048),
});

export const resetPasswordSchema = z
  .object({ password: passwordSchema, confirmPassword: z.string() })
  .refine((value) => value.password === value.confirmPassword, {
    message: "两次输入的密码不一致",
    path: ["confirmPassword"],
  });

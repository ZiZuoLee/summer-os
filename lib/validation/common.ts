import { isValidTimezone, parseDateOnly } from "@/lib/seed";
import { z } from "zod";

export const dateOnlySchema = z.string().refine(
  (value) => {
    try {
      parseDateOnly(value);
      return true;
    } catch {
      return false;
    }
  },
  { message: "请输入有效日期（YYYY-MM-DD）" },
);

export const timezoneSchema = z
  .string()
  .trim()
  .min(1, "请选择时区")
  .refine(isValidTimezone, "请选择有效的 IANA 时区");

export const httpsUrlSchema = z
  .string()
  .trim()
  .max(2048)
  .url("请输入有效链接")
  .refine((value) => new URL(value).protocol === "https:", "仅支持 HTTPS 链接");

export const optionalHttpsUrlSchema = z
  .union([httpsUrlSchema, z.literal(""), z.null(), z.undefined()])
  .transform((value) => (value ? value : null));

export const idempotencyKeySchema = z.string().uuid("无效的请求标识");

export const shortTextSchema = z.string().trim().max(500);
export const notesSchema = z.string().trim().max(4000).nullable().optional();

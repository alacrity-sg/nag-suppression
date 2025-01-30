import {z} from "zod";

export const SuppressionSchema = z.record(z.string(), z.object({
    rules_to_suppress: z.array(z.object({
        id: z.string(),
        reason: z.string(),
        error: z.string().optional()
    }))
}))
export type SuppressionSchemaType = z.infer<typeof SuppressionSchema>;

export const WhitelistSchema = z.object({
    rules_to_suppress: z.array(z.object({
        id: z.string(),
        reason: z.string(),
        error: z.string().optional()
    }))
})
export type WhitelistSchemaType = z.infer<typeof WhitelistSchema>;
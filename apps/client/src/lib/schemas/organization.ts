import { z } from 'zod';

// Validation schema - shared between client and server
export const createOrganizationSchema = z.object({
  name: z
    .string()
    .min(2, 'Organization name must be at least 2 characters')
    .max(100, 'Organization name must not exceed 100 characters')
    .trim(),
  domain: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/.test(val),
      'Please enter a valid domain (e.g., example.com)'
    ),
});

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;

export type CreateOrganizationResult =
  | { success: true; organizationId: string; organizationName: string }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

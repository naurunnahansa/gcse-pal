import { z } from 'zod';

// Domain types
export const Domain = z.enum(['public', 'product', 'customer', 'operational']);
export type Domain = z.infer<typeof Domain>;

// Document entity schema
export const DocumentSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  domain: Domain,
  title: z.string(),
  url: z.string().url().optional(),
  metadata: z.record(z.any()).optional(),
  createdAt: z.date(),
});

export type Document = z.infer<typeof DocumentSchema>;
export type NewDocument = Omit<Document, 'id' | 'createdAt'>;

// Chunk entity schema
export const ChunkSchema = z.object({
  id: z.string().uuid(),
  documentId: z.string().uuid(),
  content: z.string(),
  embedding: z.array(z.number()).length(1536), // text-embedding-3-small dimensions
  metadata: z.record(z.any()).optional(),
  createdAt: z.date(),
});

export type Chunk = z.infer<typeof ChunkSchema>;
export type NewChunk = Omit<Chunk, 'id' | 'createdAt'>;

// Search result types
export const SearchResultSchema = z.object({
  chunk: ChunkSchema,
  document: DocumentSchema,
  similarity: z.number(),
});

export type SearchResult = z.infer<typeof SearchResultSchema>;

// Query parameters
export const SearchParamsSchema = z.object({
  tenantId: z.string().uuid(),
  domain: Domain.optional(),
  query: z.string(),
  limit: z.number().min(1).max(100).default(10),
  threshold: z.number().min(0).max(1).default(0.7),
});

export type SearchParams = z.infer<typeof SearchParamsSchema>;

import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { pool } from "../db";
import { embed } from "ai";
import { google } from "@ai-sdk/google";

export const berkshireSearchTool = createTool({
  id: "search",
  description: "Search Berkshire Hathaway shareholder letters using semantic search",

  inputSchema: z.object({
    query: z.string(),
  }),

  outputSchema: z.object({
    results: z.array(
      z.object({
        content: z.string(),
        source: z.string(),
        year: z.string(),
      })
    ),
  }),

  execute: async ({ query }) => {
    const embeddingResult = await embed({
      model: google.embedding("text-embedding-004"),
      value: query,
    });

    const vector = `[${embeddingResult.embedding.join(",")}]`;

    const res = await pool.query(
      `
      SELECT content, metadata->>'source' as source, metadata->>'year' as year
      FROM documents
      ORDER BY embedding <-> $1::vector
      LIMIT 15
      `,
      [vector]
    );

    return {
      results: res.rows.map(r => ({
        content: r.content,
        source: r.source,
        year: r.year,
      })),
    };
  },
});

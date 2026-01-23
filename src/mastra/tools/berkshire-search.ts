import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { pool } from "../db";
import { embed } from "ai";
import { google } from "@ai-sdk/google";

function toPgVector(vec: number[]): string {
  return `[${vec.join(",")}]`;
}



export const berkshireSearchTool = createTool({
  id: "search",
  description: "Hybrid semantic + keyword search over Berkshire letters",

  inputSchema: z.object({
    query: z.string(),
    topK: z.number().min(1).max(20).default(12),
    year: z.string().optional(),
  }),

  outputSchema: z.object({
    results: z.array(
      z.object({
        chunkId: z.string(),
        content: z.string(),
        score: z.number(),
        source: z.string(),
        year: z.string(),
      })
    ),
  }),

  execute: async ({ query, topK, year }) => {
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      throw new Error("GOOGLE_GENERATIVE_AI_API_KEY not set");
    }

    const embeddingResult = await embed({
      model: google.embedding("text-embedding-004"),
      value: query,
    });

    const vector = toPgVector(embeddingResult.embedding);

    const params: any[] = [vector, query, topK];
    let filterSQL = "";

    if (year) {
      params.push(year);
      filterSQL = `AND metadata->>'year' = $4`;
    }

    const sql = `
      SELECT 
        id,
        content,
        metadata->>'source' AS source,
        metadata->>'year' AS year,
        (embedding <-> $1::vector) AS score
      FROM documents
      WHERE 
        (
          embedding <-> $1::vector < 1.4
          OR to_tsvector('english', content) @@ plainto_tsquery('english', $2)
        )
        ${filterSQL}
      ORDER BY 
        (embedding <-> $1::vector) ASC
      LIMIT $3;
    `;

    const res = await pool.query(sql, params);
    console.log("====== Berkshire Search Debug ======");
    console.log("Query:", query);
    console.log("Results found:", res.rows.length);

    if (res.rows.length > 0) {
        console.log("First result sample:", {
            id: res.rows[0].id,
            year: res.rows[0].year,
            source: res.rows[0].source,
            contentPreview: res.rows[0].content.slice(0, 200),
            score: res.rows[0].score,
        });
    }

    console.log("====================================");





    return {
      results: res.rows.map((r) => ({
        chunkId: r.id,
        content: r.content.slice(0, 1500), // limit noise for LLM
        score: Number(r.score),
        source: r.source ?? "unknown",
        year: r.year ?? "unknown",
      })),
    };
  },
});

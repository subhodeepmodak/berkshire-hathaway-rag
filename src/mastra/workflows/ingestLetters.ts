import fs from "fs";
import path from "path";
import { createRequire } from "module";
import { z } from "zod";
import { embed } from "ai";
import { google } from "@ai-sdk/google";
import { pool } from "../db.js";
import { createStep, createWorkflow } from "@mastra/core/workflows";

const require = createRequire(import.meta.url);
const pdfParse: (buffer: Buffer) => Promise<{ text: string }> = require("pdf-parse");

const LETTERS_DIR = path.join(process.cwd(), "data", "letters");

/* ---------- helpers ---------- */

function chunkText(text: string, chunkSize = 500, overlap = 100)
 {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = start + chunkSize;
    chunks.push(text.slice(start, end));
    start = end - overlap;
  }

  return chunks;
}

// ✅ Correct pgvector formatter
function toPgVector(vec: number[]): string {
  if (!Array.isArray(vec) || vec.length === 0) {
    throw new Error("Invalid embedding vector");
  }

  const clean = vec.map(v => Number(v).toString());
  return `[${clean.join(",")}]`;
}

/* ---------- schemas ---------- */

const pdfFileSchema = z.object({
  file: z.string(),
  filePath: z.string(),
});

const parsedDocSchema = z.object({
  filename: z.string(),
  text: z.string(),
});

const ingestionResultSchema = z.object({
  inserted: z.number(),
});

/* ---------- steps ---------- */

const loadPdfs = createStep({
  id: "load-pdfs",
  description: "Loads PDF files from data/letters folder",
  outputSchema: z.array(pdfFileSchema),

  execute: async () => {
    const files = fs.readdirSync(LETTERS_DIR).filter(f => f.endsWith(".pdf"));

    if (!files.length) throw new Error("No PDF files found in data/letters");

    return files.map(file => ({
      file,
      filePath: path.join(LETTERS_DIR, file),
    }));
  },
});

const parsePdfs = createStep({
  id: "parse-pdfs",
  description: "Parses PDFs into raw text",
  inputSchema: z.array(pdfFileSchema),
  outputSchema: z.array(parsedDocSchema),

  execute: async ({ inputData }) => {
    if (!inputData) throw new Error("No input PDFs provided");

    const docs = [];

    for (const item of inputData) {
      const buffer = fs.readFileSync(item.filePath);
      const parsed = await pdfParse(buffer);

      docs.push({
        filename: item.file,
        text: parsed.text,
      });
    }

    return docs;
  },
});

const embedAndStore = createStep({
  id: "embed-and-store",
  description: "Chunks, embeds, and stores documents into Postgres (pgvector)",
  inputSchema: z.array(parsedDocSchema),
  outputSchema: ingestionResultSchema,

  execute: async ({ inputData }) => {
    if (!inputData) throw new Error("No parsed documents provided");

    let totalInserted = 0;

    for (const doc of inputData) {
      const yearMatch = doc.filename.match(/\d{4}/);
      const year = yearMatch ? yearMatch[0] : "unknown";

      const chunks = chunkText(doc.text);

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i].trim();
        if (!chunk) continue;

        const embeddingResult = await embed({
          model: google.embedding("text-embedding-004"),
          value: chunk,
        });

        const vector = toPgVector(embeddingResult.embedding);
        const id = `${doc.filename}-${i}`;

        await pool.query(
          `
          INSERT INTO documents (id, content, embedding, metadata)
          VALUES ($1, $2, $3::vector, $4)
          ON CONFLICT (id) DO NOTHING
          `,
          [
            id,
            chunk,
            vector,
            {
              source: doc.filename,
              year,
              type: "berkshire_shareholder_letter",
            },
          ]
        );

        totalInserted++;
      }
    }

    return { inserted: totalInserted };
  },
});

/* ---------- workflow ---------- */

const ingestLettersWorkflow = createWorkflow({
  id: "ingest-letters",
  inputSchema: z.object({}).optional(),
  outputSchema: ingestionResultSchema,
})
  .then(loadPdfs)
  .then(parsePdfs)
  .then(embedAndStore);

ingestLettersWorkflow.commit();

export { ingestLettersWorkflow };

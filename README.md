# 📊 Berkshire Hathaway Shareholder Letters RAG System

A production-grade **Retrieval-Augmented Generation (RAG)** system built using **Mastra**, **PostgreSQL + pgvector**, and **Google Gemini embeddings** to answer questions strictly from Berkshire Hathaway shareholder letters with full citation support.

---

## 🚀 Features

- 📄 PDF ingestion & chunking pipeline  
- 🧠 Vector embeddings using `text-embedding-004` (Gemini)  
- 🗄️ PostgreSQL + pgvector semantic storage  
- 🔎 Hybrid retrieval (vector similarity + full-text search)  
- 🤖 Grounded AI agent with tool-forced retrieval  
- 📌 Source-aware answers with citations (year + filename)  
- 🧵 Memory + thread support via Mastra  
- 🧪 Mastra Studio UI for debugging and testing

---

## 🧱 Architecture Overview

PDF Letters
│
▼
PDF Parser
│
▼
Chunking
│
▼
Gemini Embeddings
│
▼
Postgres (pgvector)
│
▼
Hybrid Search Tool
│
▼
Berkshire Agent (Mastra)
│
▼
Cited Answer

---

## 🛠️ Tech Stack

- Mastra – Agent orchestration & workflows
- PostgreSQL (Neon) – Database
- pgvector – Vector similarity search
- Google Gemini API – Embeddings + LLM
- TypeScript
- pdf-parse
- Zod

---

## 📂 Project Structure

src/
agents/
berkshire-agent.ts
weather-agent.ts
tools/
berkshire-search.ts
weather-tool.ts
workflows/
ingest-letters.ts
db.ts

data/
letters/ ← PDF shareholder letters

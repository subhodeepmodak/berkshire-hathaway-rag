import { Mastra } from "@mastra/core/mastra";
import { PinoLogger } from "@mastra/loggers";
import { LibSQLStore } from "@mastra/libsql";
import { Observability, DefaultExporter } from "@mastra/observability";

import { weatherWorkflow } from "./workflows/weather-workflow";
import { ingestLettersWorkflow } from "./workflows/ingestLetters";

import { weatherAgent } from "./agents/weather-agent";
import { berkshireAgent } from "./agents/berkshire-agent";

export const mastra = new Mastra({
  // ✅ Register workflows
  workflows: {
    weatherWorkflow,
    ingestLettersWorkflow,
  },

  // ✅ Register agents (THIS is what makes them appear in Studio)
  agents: {
    weatherAgent,
    berkshireAgent,
  },

  // ✅ Storage
  storage: new LibSQLStore({
    id: "mastra-storage",
    url: ":memory:",
  }),

  // ✅ Logger
  logger: new PinoLogger({
    name: "Mastra",
    level: "info",
  }),

  // ✅ Observability
  observability: new Observability({
    configs: {
      default: {
        serviceName: "mastra",
        exporters: [new DefaultExporter()],
      },
    },
  }),
});

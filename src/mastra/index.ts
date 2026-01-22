import { Mastra } from "@mastra/core/mastra";
import { PinoLogger } from "@mastra/loggers";
import { LibSQLStore } from "@mastra/libsql";
import { Observability, DefaultExporter } from "@mastra/observability";

import { PgVector } from "@mastra/pg";     // **correct**
import { google } from "@ai-sdk/google";


import { weatherWorkflow } from "./workflows/weather-workflow";
import { ingestLettersWorkflow } from "./workflows/ingestLetters";
import { weatherAgent } from "./agents/weather-agent";

export const mastra = new Mastra({
  workflows: {
    weatherWorkflow,
    ingestLettersWorkflow,
  },

  agents: {
    weatherAgent,
  },

  storage: new LibSQLStore({
    id: "mastra-storage",
    url: ":memory:",
  }),

  logger: new PinoLogger({
    name: "Mastra",
    level: "info",
  }),

  observability: new Observability({
    configs: {
      default: {
        serviceName: "mastra",
        exporters: [new DefaultExporter()],
      },
    },
  }),
});

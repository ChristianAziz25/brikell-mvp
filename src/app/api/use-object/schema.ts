import { z } from 'zod';

// Schema matching the response from combinedRAG.ts
export const ragResponseSchema = z.object({
  response: z.string().describe('Natural language response to the user question'),
  keyInsights: z.array(z.string()).optional().describe('Key insights or data points from the results'),
});


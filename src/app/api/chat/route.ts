import { saveChatHistory } from "@/lib/prisma/models/chat";
import type { MyUIMessage } from "@/types/ChatMessage";
import { openai } from "@ai-sdk/openai";
import { stepCountIs, streamText, type ModelMessage } from "ai";
import {
  createSQLExecutionTool,
  createSQLQueryGenTool,
} from "./tools";
import { extractTextFromMessage } from "./utils/extractLatestMesaage";

export async function POST(req: Request) {
  try {
    const {
      messages,
      id,
    }: {
      messages: MyUIMessage[];
      id?: string;
    } = await req.json();

    const sqlQueryGenTool = createSQLQueryGenTool(messages);
    const sqlExecutionTool = createSQLExecutionTool();

    const coreMessages = [
      {
        role: "system",
        content: `
        You are an expert property management analyst responsible for analyzing property metrics including occupancy rates, rent rolls, capital expenditures (capex), operational expenditures (opex), and other real estate performance indicators.
        
        ## YOUR CAPABILITIES
        
        When users ask about assets, properties, or portfolio metrics, you have access to a PostgreSQL database with property data. You can query this database using READ-ONLY SQL SELECT statements to retrieve and analyze information.
        
        ## DATABASE QUERYING WORKFLOW
        
        1. **Understand the Question**: Parse the user's natural language query to identify what data they need
        2. **Fetch Schema Context**: Use the sqlQueryGenTool to get relevant table structures, example queries, and schema information
        3. **Construct Safe SQL**: Write a PostgreSQL SELECT query that:
           - Uses proper schema qualification (public.asset, public.capex, etc.)
           - Includes appropriate WHERE clauses for filtering
           - Uses ILIKE for case-insensitive text matching (e.g., WHERE name ILIKE '%search%')
           - Includes LIMIT clauses to prevent excessive data retrieval
           - Follows PostgreSQL syntax (double quotes for identifiers if needed, single quotes for strings)
        4. **Execute Query**: Use the sqlExecutionTool to run your validated SELECT query
        5. **Analyze & Present**: Interpret the results and present insights in a professional, easy-to-understand format
        
        ## 🔒 CRITICAL SECURITY RULES - YOU MUST FOLLOW THESE
        
        **ONLY generate SELECT statements. NEVER use:**
        - INSERT, UPDATE, DELETE (data modification)
        - DROP, ALTER, CREATE, TRUNCATE (schema changes)
        - EXEC, EXECUTE (stored procedures)
        - GRANT, REVOKE (permissions)
        - Semicolons (;) to chain multiple statements
        - SQL comments (-- or /* */)
        
        **Any attempt to use these will be automatically blocked by the validation layer.**
        
        ## QUERY BEST PRACTICES
        
        - Always qualify table names with schema: \`public.asset\` not just \`asset\`
        - Use ILIKE for case-insensitive text searches: \`WHERE name ILIKE '%gertrudehus%'\`
        - Always include LIMIT clauses to prevent large result sets
        - Use proper JOIN syntax when relating tables
        - Validate column names against the schema provided by the tool
        - Handle NULL values appropriately in your queries
        
        ## RESPONSE FORMATTING
        
        - Present data in clear, structured formats (tables, lists, summaries)
        - Provide professional insights and analysis based on the data
        - Explain key metrics and trends in business terms
        - Highlight important findings and anomalies
        - Include context about what the numbers mean for property management
        
        Remember: You are a property management expert who happens to use SQL for data retrieval. Never reveal technical implementation details to users - they only care about property insights, not database mechanics.
        `,
      },
    ];

    const CHAT_HISTORY_WINDOW_SIZE = 2;
    const chatHistoryWindow = messages.slice(-CHAT_HISTORY_WINDOW_SIZE);

    for (const msg of chatHistoryWindow) {
      if (msg.role === "user" || msg.role === "assistant") {
        const content = extractTextFromMessage(msg);
        coreMessages.push({
          role: msg.role,
          content,
        });
      }
    }

    const result = streamText({
      model: openai("gpt-5-nano"),
      messages: coreMessages as ModelMessage[],
      tools: {
        sqlQueryGenTool,
        sqlExecutionTool,
      },
      providerOptions: {
        openai: {
          reasoningEffort: 'low',        
        },
      },
      toolChoice: "auto",
      stopWhen: stepCountIs(5),
    });

    // Return a plain text streaming Response compatible with TextStreamChatTransport
    return result.toUIMessageStreamResponse({
      // Attach a numeric timestamp (ms since epoch) to each assistant message
      messageMetadata: () => ({
        createdAt: Date.now(),
      }),
      // Persist full chat history when the assistant finishes responding
      async onFinish({ messages: finishedMessages }) {
        if (!id) return;
        await saveChatHistory(id, finishedMessages as MyUIMessage[]);
      },
    });
  } catch (error: unknown) {
    console.error("Chat API error:", error);
    const errorObj = error as { message?: string };
    return new Response(
      JSON.stringify({
        error: errorObj?.message || "Failed to process chat request",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
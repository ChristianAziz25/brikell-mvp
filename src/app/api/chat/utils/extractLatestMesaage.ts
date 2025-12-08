import { UIMessage } from "ai";

type BasicMessagePart =
  | string
  | {
      type?: string;
      text?: string;
      [key: string]: unknown;
    };

type BasicMessage = {
  role?: string;
  content?: string | BasicMessagePart[];
  parts?: BasicMessagePart[];
  [key: string]: unknown;
};

export function extractTextFromMessage(message: BasicMessage | UIMessage): string {
    // Handle UIMessage format
    if ('parts' in message && Array.isArray(message.parts)) {
      return message.parts
        .map((part) =>
          typeof part === 'string'
            ? part
            : typeof part === 'object' && 'text' in part && typeof part.text === 'string'
              ? part.text
              : '',
        )
        .join(' ')
        .trim();
    }
  
    // Handle BasicMessage format
    if (typeof (message as BasicMessage).content === 'string') {
      return (message as BasicMessage).content as string;
    }
  
    const basicMsg = message as BasicMessage;
    if (Array.isArray(basicMsg.content)) {
      return basicMsg.content
        .map((part: BasicMessagePart) =>
          typeof part === 'string'
            ? part
            : typeof part === 'object' && part && 'text' in part && typeof part.text === 'string'
              ? part.text
              : '',
        )
        .join(' ')
        .trim();
    }
  
    if (Array.isArray(basicMsg.parts)) {
      return basicMsg.parts
        .map((part: BasicMessagePart) =>
          typeof part === 'string'
            ? part
            : typeof part === 'object' && part && 'text' in part && typeof part.text === 'string'
              ? part.text
              : '',
        )
        .join(' ')
        .trim();
    }
  
    return '';
  }
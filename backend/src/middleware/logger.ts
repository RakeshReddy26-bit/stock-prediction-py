import morgan from 'morgan';
import { StreamOptions } from 'morgan';
import { Request, Response } from 'express';

// Custom token for request body
morgan.token('body', (req: Request) => JSON.stringify(req.body));

// Custom token for response body
morgan.token('response-body', (req: Request, res: Response) => {
  const oldWrite = res.write;
  const oldEnd = res.end;
  const chunks: Buffer[] = [];

  res.write = function (chunk: any) {
    chunks.push(Buffer.from(chunk));
    return oldWrite.apply(res, arguments as any);
  };

  res.end = function (chunk: any) {
    if (chunk) {
      chunks.push(Buffer.from(chunk));
    }
    const body = Buffer.concat(chunks).toString('utf8');
    (res as any).responseBody = body;
    return oldEnd.apply(res, arguments as any);
  };

  return '';
});

// Custom format
const format = ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time ms\nRequest Body: :body\nResponse Body: :response-body';

// Stream configuration
const stream: StreamOptions = {
  write: (message: string) => {
    console.log(message.trim());
  },
};

// Export the logger middleware
export const logger = morgan(format, { stream }); 
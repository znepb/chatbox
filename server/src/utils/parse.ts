import { Request, Response } from "express";
import { WebSocket } from "ws";
import { ZodType } from "zod";

export function parseHTTP(
  req: Request,
  res: Response,
  data: ZodType
): [boolean, Object?] {
  const result = data.safeParse(req.body);

  if (result.success) {
    return [true];
  } else {
    res.status(400);
    return [
      false,
      {
        error: result.error,
      },
    ];
  }
}

export function parseWebsocket(
  ws: WebSocket,
  content: Object,
  data: ZodType
): [boolean, Object?] {
  const result = data.safeParse(content);

  if (result.success) {
    return [true];
  } else {
    return [
      false,
      {
        error: result.error,
      },
    ];
  }
}

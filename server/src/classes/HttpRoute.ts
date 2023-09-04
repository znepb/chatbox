import { Request, Response } from "express";

export type HttpExecuteReturn =
  | Promise<number | object | void>
  | number
  | object
  | void;

export default interface HttpRoute {
  httpPath: string;
  httpMethod: "get" | "post" | "put" | "delete" | "any" | string;

  httpExecute(req: Request, res: Response): HttpExecuteReturn;
}

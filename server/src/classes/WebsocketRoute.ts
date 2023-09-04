import { WebSocket } from "ws";
import { HttpExecuteReturn } from "./HttpRoute";
import { WSData } from "../types";

export type WSResult = { success: boolean; data?: any; error?: any };

export default interface WebsocketRoute {
  wsAction: string;

  wsExecute(
    websocket: WebSocket,
    data: any,
    clientInfo: WSData
  ): WSResult | Promise<WSResult>;
}

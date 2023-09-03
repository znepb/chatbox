import { Request, Response } from "express";
import Route from "../../classes/HttpRoute";
import { Server } from "../..";
import HttpRoute from "../../classes/HttpRoute";
import WebsocketRoute from "../../classes/WebsocketRoute";
import { WebSocket } from "ws";
import { WSData } from "../../types";

export class Index implements HttpRoute, WebsocketRoute {
  public httpPath = "/";
  public httpMethod = "any";
  public wsAction = "";

  public httpExecute(req: Request, res: Response): Object {
    return {
      status: "ok",
      time: new Date().toISOString(),
      uptimeSeconds: Math.round((new Date().getTime() - Server.upSince) / 1000),
    };
  }

  public wsExecute(websocket: WebSocket, data: any, clientInfo: WSData) {
    return {
      success: true,
      data: {
        time: new Date().toISOString(),
        uptimeSeconds: Math.round(
          (new Date().getTime() - Server.upSince) / 1000
        ),
      },
    };
  }
}

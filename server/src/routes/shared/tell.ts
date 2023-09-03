import { Request, Response } from "express";
import { Server } from "../..";
import z from "zod";
import { parseHTTP, parseWebsocket } from "../../utils/parse";
import { TELL } from "../../utils/licenseCapabilities";
import { WebSocket } from "ws";
import sendMessage, { Data } from "../../utils/sendMessage";
import WebsocketRoute from "../../classes/WebsocketRoute";
import HttpRoute from "../../classes/HttpRoute";
import hasCapabilities from "../../utils/hasCapabilities";
import { WSData } from "../../types";

export class Tell implements WebsocketRoute, HttpRoute {
  public httpPath = "/tell";
  public httpMethod = "post";
  public wsAction = "tell";

  private async execute(user: string, capabilities: string[], data: Data) {
    sendMessage(user, data, capabilities);
  }

  public async httpExecute(req: Request, res: Response): Promise<Object> {
    if (req.headers.authorization == undefined) return 401;

    const auth = req.headers.authorization.replace("Bearer ", "");
    const { success: capabilitySuccess, data: capabilityData } =
      await hasCapabilities(auth, [TELL]);

    if (capabilitySuccess == false) return 403;

    const { ownerID, capabilities } = capabilityData;

    const [success, error] = parseHTTP(
      req,
      res,
      z.object({
        user: z.string(),
        message: z.string(),
        formatting: z.string().optional(),
        prefix: z.string().optional(),
        hidePrefix: z.boolean().optional(),
      })
    );

    if (ownerID == null) return 404;
    if (success == false) return error || {};

    const username = await Server.usernameCache.get(ownerID);

    if (username == null) return 500;

    this.execute(username, capabilities, req.body);

    return 200;
  }

  public async wsExecute(websocket: WebSocket, data: Data, clientInfo: WSData) {
    const [success, error] = parseWebsocket(
      websocket,
      data,
      z.object({
        message: z.string(),
        formatting: z.string().optional(),
        prefix: z.string().optional(),
        hidePrefix: z.boolean().optional(),
      })
    );

    if (success == false) {
      return {
        success: false,
        error,
      };
    }

    const license = clientInfo?.license;

    const { success: capabilitySuccess, data: capabilityData } =
      await hasCapabilities(license, [TELL]);

    if (capabilitySuccess == false) {
      return {
        success: false,
        error: capabilityData,
      };
    }

    const { ownerID, capabilities } = capabilityData;

    const username = await Server.usernameCache.get(ownerID);

    if (username == null) {
      return {
        success: false,
        error: "No username, something has gone terribly wrong",
      };
    }

    this.execute(username, capabilities, data);

    return { success: true };
  }
}

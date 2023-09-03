import { Request, Response } from "express";
import Route from "../../classes/HttpRoute";
import { Server } from "../..";
import z from "zod";
import { SAY } from "../../utils/licenseCapabilities";
import { WebSocket } from "ws";
import sendMessage, { Data } from "../../utils/sendMessage";
import getOnlinePlayers from "../../utils/getOnlinePlayers";
import WebsocketRoute from "../../classes/WebsocketRoute";
import HttpRoute from "../../classes/HttpRoute";
import { parseHTTP, parseWebsocket } from "../../utils/parse";
import hasCapabilities from "../../utils/hasCapabilities";
import { WSData } from "../../types";

export class Say implements WebsocketRoute, HttpRoute {
  public httpPath = "/say";
  public httpMethod = "post";
  public wsAction = "say";

  private async execute(
    user: string,
    capabilities: string[],
    data: Omit<Data, "user">
  ) {
    (await getOnlinePlayers()).forEach(async (player) => {
      sendMessage(
        user,
        {
          ...data,
          user: player,
        },
        capabilities
      );
    });
  }

  public async httpExecute(req: Request, res: Response): Promise<Object> {
    if (req.headers.authorization == undefined) return 401;

    const auth = req.headers.authorization.replace("Bearer ", "");
    const { success: capabilitySuccess, data: capabilityData } =
      await hasCapabilities(auth, [SAY]);

    if (capabilitySuccess == false) return 403;

    const { ownerID, capabilities } = capabilityData;

    const [success, error] = parseHTTP(
      req,
      res,
      z.object({
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

  public async wsExecute(
    websocket: WebSocket,
    data: Omit<Data, "user">,
    clientInfo: WSData
  ) {
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
      await hasCapabilities(license, [SAY]);

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

import { Request, Response } from "express";
import { Server } from "../..";
import z from "zod";
import { parseHTTP, parseWebsocket } from "../../utils/parse";
import { LIST_PLAYERS, TELL } from "../../utils/licenseCapabilities";
import { WebSocket } from "ws";
import sendMessage, { Data } from "../../utils/sendMessage";
import WebsocketRoute from "../../classes/WebsocketRoute";
import HttpRoute from "../../classes/HttpRoute";
import hasCapabilities from "../../utils/hasCapabilities";
import { WSData } from "../../types";
import getOnlinePlayers from "../../utils/getOnlinePlayers";

export class ListPlayers implements WebsocketRoute, HttpRoute {
  public httpPath = "/players";
  public httpMethod = "get";
  public wsAction = "players";

  private async execute(user: string, capabilities: string[], data: Data) {
    return await getOnlinePlayers();
  }

  public async httpExecute(req: Request, res: Response): Promise<Object> {
    if (req.headers.authorization == undefined) return 401;

    const auth = req.headers.authorization.replace("Bearer ", "");
    const { success: capabilitySuccess, data: capabilityData } =
      await hasCapabilities(auth, [LIST_PLAYERS]);

    if (capabilitySuccess == false) return 403;

    const { ownerID, capabilities } = capabilityData;

    if (ownerID == null) return 404;

    const username = await Server.usernameCache.get(ownerID);

    if (username == null) return 500;

    const result = await this.execute(username, capabilities, req.body);
    return result;
  }

  public async wsExecute(websocket: WebSocket, data: Data, clientInfo: WSData) {
    const license = clientInfo?.license;

    const { success: capabilitySuccess, data: capabilityData } =
      await hasCapabilities(license, [LIST_PLAYERS]);

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

    const result = this.execute(username, capabilities, data);
    websocket.send(
      JSON.stringify({
        type: "RES",
        action: "list-players",
        data: result,
      })
    );

    return { success: true };
  }
}

import z from "zod";
import { parseWebsocket } from "../../../utils/parse";
import dispatchIfCapable from "../../../utils/dispatchIfCapable";
import { RECEIVE } from "../../../utils/licenseCapabilities";
import WebsocketRoute from "../../../classes/WebsocketRoute";
import { WebSocket } from "ws";
import { WSData } from "../../../types";

export class DispatchMessage implements WebsocketRoute {
  public wsAction = "dispatch-message";

  public async wsExecute(
    websocket: WebSocket,
    data: {
      username: string;
      timestamp: number;
      sentBy: string;
      message: string;
    },
    clientInfo: WSData
  ) {
    const [success, error] = parseWebsocket(
      websocket,
      data,
      z.object({
        sentBy: z.string().uuid(),
        username: z.string(),
        timestamp: z.number(),
        message: z.string(),
      })
    );

    if (success == false) return { success: false, data: error };
    if (clientInfo.type != "server")
      return { success: false, data: "Invalid client type" };

    dispatchIfCapable(
      RECEIVE,
      JSON.stringify({
        type: "REQ",
        action: "message",
        data: {
          username: data.username,
          timestamp: data.timestamp,
          uuid: data.sentBy,
          message: data.message,
        },
      })
    );

    return { success: true };
  }
}

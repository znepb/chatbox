import { Server } from "../../..";
import z from "zod";
import { COMMANDS } from "../../../utils/licenseCapabilities";
import dispatchIfCapable from "../../../utils/dispatchIfCapable";
import getOnlinePlayers from "../../../utils/getOnlinePlayers";
import WebsocketRoute, { WSResult } from "../../../classes/WebsocketRoute";
import { WebSocket } from "ws";
import { WSData } from "../../../types";
import { parseWebsocket } from "../../../utils/parse";

export class DispatchCommand implements WebsocketRoute {
  public wsAction = "dispatch-command";

  public async wsExecute(
    websocket: WebSocket,
    data: {
      sentBy: string;
      username: string;
      timestamp: number;
      message: string;
    },
    clientInfo: WSData
  ): Promise<WSResult> {
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

    // https://stackoverflow.com/questions/16261635/javascript-split-string-by-space-but-ignore-space-in-quotes-notice-not-to-spli
    const args = data.message.match(/(?:[^\s"]+|"[^"]*")+/g);

    if (args == null) return { success: true };
    const command = args.shift();
    if (command == null) return { success: true };

    dispatchIfCapable(
      COMMANDS,
      JSON.stringify({
        type: "REQ",
        action: "command",
        data: {
          command: command.replace("\\", ""),
          args,
          username: data.username,
          timestamp: data.timestamp,
          uuid: data.sentBy,
        },
      })
    );

    new Promise(async () => {
      (await getOnlinePlayers()).forEach(async (player) => {
        if (player == "") return;

        const userData = await Server.prisma.user.findFirst({
          where: {
            username: player,
          },
        });

        if (userData?.cbspyEnrolled) {
          Server.wsServer.sendToServer({
            action: "send-message",
            type: "REQ",
            data: {
              player,
              message: [
                {
                  text: `${userData.username}: `,
                  color: "dark_gray",
                  hoverEvent: {
                    action: "show_text",
                    contents: [
                      {
                        text: `Chatbox spy message. Use /cbspy to disable.`,
                        color: "white",
                      },
                    ],
                  },
                },
                {
                  text: data.message,
                  color: "gray",
                },
              ],
            },
          });
        }
      });
    });

    return { success: true };
  }
}

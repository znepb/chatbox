import { debug, info, success } from "./utils/log";
import { Data, RawData, WebSocket, WebSocketServer } from "ws";
import { regexUuid } from "./utils/regex";
import WebsocketRoute from "./classes/WebsocketRoute";
import { warn } from "console";
import { WSData } from "./types";
import { v4 as uuidv4 } from "uuid";
import { Server } from ".";

interface Packet {
  type: "REQ" | "RES";
  action: string;
  success?: boolean; // only present if RES
  error?: any; // only present if RES
  data?: any;
}

interface RequestPacket {
  type: "REQ";
  action: string;
  data: any;
}

interface ResponsePacket {
  type: "RES";
  action: string;
  success: boolean;
  error?: any;
  data?: any;
}

interface PendingResponse {
  action: string;
  resolve: (data: Data) => void;
}

export default class WebsocketServer {
  public wss: WebSocketServer;
  public wsClients = new Map<string, WebSocket>();
  public wsData = new Map<string, WSData>();
  public wsRoutes: WebsocketRoute[] = [];
  public serverData?: WSData;

  private pendingPromises: PendingResponse[] = [];

  constructor(config: { wsPort: number }) {
    this.wss = new WebSocketServer({ port: config.wsPort });

    this.wss.on("connection", (ws, req) => {
      let uuid: string | undefined;

      if (req.headers.authorization == undefined)
        return ws.close(1008, "Invalid auth");
      if (
        req.headers.authorization.replace("Bearer ", "") ==
        process.env.SUPER_ADMIN_TOKEN
      ) {
        uuid = uuidv4();
        this.wsClients.set(uuid, ws);
        this.wsData.set(uuid, {
          type: "server",
          connected: true,
          expires: null,
          license: null,
          ws: ws,
          id: uuid,
        });
        this.serverData = this.wsData.get(uuid);
      } else {
        uuid = req.headers.authorization.match(regexUuid)?.[0];
        if (uuid == undefined) return ws.close(1008, "Invalid auth");
        this.wsClients.set(uuid, ws);
        this.wsData.set(uuid, {
          type: "client",
          connected: true,
          expires: null,
          license: this.wsData.get(uuid)?.license || null,
          ws: ws,
          id: uuid,
        });

        async () => {
          ws.send(
            JSON.stringify({
              type: "NFO",
              action: "welcome",
              data: {
                id: uuid,
                capabilities: await Server.uuidLicenseCache.getCapabilities(
                  this.wsData.get(uuid!)!.license!
                ),
              },
            })
          );
        };
      }

      info(
        `WebSocket connection ${
          req.socket.remoteAddress
        } opened (authenticated as ${this.wsData.get(uuid)?.type})`
      );

      ws.on("message", (data) => {
        try {
          const json = JSON.parse(data.toString());
          if (json) {
            this.wsRoutes.forEach((route) => {
              if (
                route.wsAction == json.action &&
                json.type == "REQ" &&
                this.wsData.get(uuid!) != undefined
              ) {
                route.wsExecute(ws, json.data, this.wsData.get(uuid!)!);
              } else if (json.type == "RES") {
                this.pendingPromises.forEach((promise, idx) => {
                  if (promise.action == json.action) {
                    promise.resolve(data);
                    this.pendingPromises.splice(idx, 1);
                  }
                });
              }
            });
          }
        } catch (e) {}
      });

      ws.on("close", () => {
        if (uuid) {
          this.wsClients.delete(uuid);
          this.wsData.delete(uuid);
        }
        info(`WebSocket connection ${req.socket.remoteAddress} closed`);
      });

      ws.on("error", () => {
        if (uuid) {
          this.wsClients.delete(uuid);
          this.wsData.delete(uuid);
        }
        warn(`WebSocket connection ${req.socket.remoteAddress} errored`);
      });
    });

    this.wss.on("listening", () => {
      success("WebSocket listening on port 8080");
    });
  }

  public sendToClient(
    uuid: string,
    packet: RequestPacket
  ): Promise<ResponsePacket | undefined> {
    const ws = this.wsClients.get(uuid);

    if (ws) {
      return new Promise((resolve, reject) => {
        ws.send(JSON.stringify(packet));
        this.pendingPromises.push({
          action: packet.action,
          resolve: (data: Data) => {
            const json = JSON.parse(data.toString());
            if (json.type == "RES" && json.action == packet.action) {
              resolve(json);
            }
          },
        });
      });
    } else {
      return Promise.resolve(undefined);
    }
  }

  public sendToServer(
    packet: RequestPacket
  ): Promise<ResponsePacket | undefined> {
    if (this.serverData == undefined) return Promise.resolve(undefined);
    return this.sendToClient(this.serverData.id, packet);
  }

  public addRoute(route: WebsocketRoute) {
    debug("Adding Websocket Route", route.wsAction);
    this.wsRoutes.push(route);
  }
}

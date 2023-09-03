import { WebSocket } from "ws";
import { Server } from "../.";
import { regexUuid } from "./regex";
import { info } from "console";

export default function dispatchIfCapable(capability: string, data: string) {
  Server.wsServer.wsClients.forEach(async (client, uuid) => {
    const wsData = Server.wsServer.wsData.get(uuid);
    if (wsData == undefined || wsData.license == undefined) return;

    const capabilities = await Server.uuidLicenseCache.getCapabilities(
      wsData.license
    );
    if (capabilities == undefined) return;

    if (
      client.readyState !== WebSocket.OPEN ||
      !capabilities.find((c) => c == capability)
    )
      return;

    client.send(data);
  });
}

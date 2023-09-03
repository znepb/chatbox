import { info } from "console";
import { Server } from "..";

export default function getOnlinePlayers(): Promise<string[]> {
  return new Promise((resolve, reject) => {
    Server.wsServer
      .sendToServer({
        action: "get-online-players",
        type: "REQ",
        data: {},
      })
      .then((response) => {
        if (response) {
          if (response.error == undefined) {
            resolve(response.data);
          } else {
            resolve([]);
          }
        } else {
          resolve([]);
        }
      });
  });
}

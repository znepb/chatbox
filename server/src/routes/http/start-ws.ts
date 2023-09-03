import { Request, Response } from "express";
import Route from "../../classes/HttpRoute";
import { Server } from "../..";
import { v4 as uuidv4 } from "uuid";
import HttpRoute from "../../classes/HttpRoute";
import { info } from "console";

export class StartWS implements HttpRoute {
  public httpPath = "/start-ws";
  public httpMethod = "get";

  public async httpExecute(req: Request, res: Response): Promise<Object> {
    const auth = req.headers.authorization?.replace("Bearer ", "");
    if (!auth) return 401;

    // Normal user auth
    const license = await Server.prisma.license.findUnique({
      where: {
        id: auth,
      },
    });

    if (license) {
      const id = uuidv4();
      const expires = new Date().getTime() + 1000 * 60 * 30;

      Server.wsServer.wsData.set(id, {
        type: "client",
        connected: false,
        expires: expires,
        license: auth,
        ws: null,
        id: id,
      });

      setTimeout(() => {
        if (Server.wsServer.wsData.get(id)?.connected == false)
          Server.wsServer.wsData.delete(id);
      }, 1000 * 60 * 31);

      return { id, expires };
    }

    return 401;
  }
}

import { Request, Response } from "express";
import { Server } from "../../..";
import SuperAdminAuthenticator from "../../../auth/SuperAdminAuthenticator";
import z from "zod";
import { v4 as uuidv4 } from "uuid";
import {
  TELL,
  LIST_PLAYERS,
  MARKDOWN,
  FORMAT,
  RECEIVE,
  COMMANDS,
  JOIN_LEAVE,
  DEATH,
} from "../../../utils/licenseCapabilities";
import minecraftPlayer from "minecraft-player";
import getLicenseData from "../../../utils/getLicenseData";
import HttpRoute from "../../../classes/HttpRoute";
import AuthenticatedRoute from "../../../classes/AuthenticatedRoute";
import { parseHTTP } from "../../../utils/parse";
import { info } from "../../../utils/log";

export class CreateLicense extends AuthenticatedRoute implements HttpRoute {
  public httpPath = "/licenses";
  public httpMethod = "post";

  authenticate = SuperAdminAuthenticator;

  public async httpExecute(
    req: Request,
    res: Response
  ): Promise<Object | undefined> {
    const [success, error] = parseHTTP(
      req,
      res,
      z.object({
        user: z.string().uuid(),
      })
    );

    if (success == false) return error || {};

    const prisma = Server.prisma;

    let user = await prisma.user.findUnique({
      where: {
        id: req.body.user,
      },
    });

    if (user == null) {
      const username = await minecraftPlayer(req.body.user);

      user = await prisma.user.create({
        data: {
          id: req.body.user,
          username: username.username,
          mayCreateLicense: true,
        },
      });
    }

    if (user.licenseId != null) {
      res.status(400);
      return { error: "You already have a license." };
    }
    if (user.mayCreateLicense == false) {
      res.status(403);
      return { error: "You are not allowed to create licenses." };
    }

    const newUUID = uuidv4();
    const newLicense = await prisma.license.create({
      data: {
        id: newUUID,
        capabilities: JSON.stringify([
          TELL,
          MARKDOWN,
          FORMAT,
          RECEIVE,
          COMMANDS,
          LIST_PLAYERS,
          JOIN_LEAVE,
          DEATH,
        ]),
        userId: req.body.user,
      },
    });

    await prisma.user.update({
      where: {
        id: req.body.user,
      },
      data: {
        licenseId: newLicense.id,
      },
    });

    Server.uuidLicenseCache.setUsersLicense(user.id, newLicense.id);

    res.status(201);
    return getLicenseData(newLicense);
  }
}

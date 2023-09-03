import { Request, Response } from "express";
import { Server } from "../../..";
import SuperAdminAuthenticator from "../../../auth/SuperAdminAuthenticator";
import HttpRoute from "../../../classes/HttpRoute";
import AuthenticatedRoute from "../../../classes/AuthenticatedRoute";
import { z } from "zod";
import { parseHTTP } from "../../../utils/parse";

export class BanUser extends AuthenticatedRoute implements HttpRoute {
  public httpPath = "/users/:id/ban";
  public httpMethod = "post";

  authenticate = SuperAdminAuthenticator;

  public async httpExecute(req: Request, res: Response): Promise<Object> {
    const [success, error] = parseHTTP(
      req,
      res,
      z.object({
        until: z.string().datetime().optional().nullable(),
      })
    );

    if (success == false) return error || {};

    let user;
    if (
      req.params.id.match(
        /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/g
      )
    ) {
      user = await Server.prisma.user.findUnique({
        where: {
          id: req.params.id,
        },
      });
    } else {
      let users = await Server.prisma.user.findMany({
        where: {
          username: req.params.id,
        },
      });

      if (users.length == 0) return 404;
      // not standard, oh well
      if (users.length > 1) return 409;

      user = users[0];
    }

    if (user == null) return 404;

    try {
      if (
        Server.prisma.license.findUnique({ where: { userId: user.id } }) != null
      ) {
        await Server.prisma.license.delete({
          where: {
            userId: user.id,
          },
        });
      }
    } catch (e) {}

    await Server.prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        mayCreateLicense: false,
        licenseId: null,
        bannedUntil:
          req.body.until != null
            ? new Date(req.body.until)
            : new Date(Math.pow(2, 31) - 1),
      },
    });

    return 200;
  }
}

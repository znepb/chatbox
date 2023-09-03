import { Request, Response } from "express";
import { Server } from "../../..";
import SuperAdminAuthenticator from "../../../auth/SuperAdminAuthenticator";
import HttpRoute from "../../../classes/HttpRoute";
import AuthenticatedRoute from "../../../classes/AuthenticatedRoute";

export class UnbanUser extends AuthenticatedRoute implements HttpRoute {
  public httpPath = "/users/:id/unban";
  public httpMethod = "post";

  authenticate = SuperAdminAuthenticator;

  public async httpExecute(req: Request, res: Response): Promise<Object> {
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

    await Server.prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        mayCreateLicense: true,
        bannedUntil: null,
      },
    });

    return 200;
  }
}

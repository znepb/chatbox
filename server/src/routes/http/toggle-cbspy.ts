import z from "zod";
import { parseHTTP } from "../../utils/parse";
import { Server } from "../..";
import HttpRoute from "../../classes/HttpRoute";
import { Request, Response } from "express";

export class ToggleCBSpy implements HttpRoute {
  public httpMethod = "put";
  public httpPath = "/toggle-cbspy";

  public async httpExecute(req: Request, res: Response) {
    const [success, error] = parseHTTP(
      req,
      res,
      z.object({
        user: z.string().uuid(),
      })
    );

    if (success == false) return {};

    const status = await Server.prisma.user.findUnique({
      where: {
        id: req.body.user,
      },
    });

    if (status && status.licenseId != null) {
      await Server.prisma.user.update({
        where: {
          id: req.body.user,
        },
        data: {
          cbspyEnrolled: !status.cbspyEnrolled,
        },
      });

      return {
        cbspyEnabled: !status.cbspyEnrolled,
      };
    }

    return { success: false, data: "User not found" };
  }
}

import { Request, Response } from "express";
import { Server } from "../../..";
import SuperAdminAuthenticator from "../../../auth/SuperAdminAuthenticator";
import getLicenseData from "../../../utils/getLicenseData";
import HttpRoute from "../../../classes/HttpRoute";
import AuthenticatedRoute from "../../../classes/AuthenticatedRoute";

export class GetUsersLicense extends AuthenticatedRoute implements HttpRoute {
  public httpPath = "/users/:id/license";
  public httpMethod = "get";

  authenticate = SuperAdminAuthenticator;

  public async httpExecute(req: Request, res: Response): Promise<Object> {
    if (
      req.params.id.match(
        /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/g
      )
    ) {
      const license = await Server.prisma.license.findUnique({
        where: {
          userId: req.params.id,
        },
      });

      if (license != null) {
        Server.uuidLicenseCache.setLicenseOwner(license.id, license.userId);
        return { licenseId: license.id };
      } else {
        return 404;
      }
    } else {
      const user = await Server.prisma.user.findMany({
        where: {
          username: req.params.id,
        },
      });

      if (user.length == 0) return 404;
      // not standard, oh well
      if (user.length > 1) return 409;

      if (user[0].licenseId != null) {
        Server.uuidLicenseCache.setLicenseOwner(user[0].licenseId, user[0].id);
        return { licenseId: user[0].licenseId };
      } else {
        return 404;
      }
    }
  }
}

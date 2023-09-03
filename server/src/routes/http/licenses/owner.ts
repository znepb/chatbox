import { Request, Response } from "express";
import { Server } from "../../..";
import SuperAdminAuthenticator from "../../../auth/SuperAdminAuthenticator";
import getLicenseData from "../../../utils/getLicenseData";
import HttpRoute from "../../../classes/HttpRoute";
import AuthenticatedRoute from "../../../classes/AuthenticatedRoute";

export class GetLicenseOwner extends AuthenticatedRoute implements HttpRoute {
  public httpPath = "/licenses/:id/owner";
  public httpMethod = "get";

  authenticate = SuperAdminAuthenticator;

  public async httpExecute(req: Request, res: Response): Promise<Object> {
    const license = await Server.prisma.license.findUnique({
      where: {
        id: req.params.id,
      },
    });

    if (license != null) {
      Server.uuidLicenseCache.setUsersLicense(license.userId, license.id);
      return license.userId;
    } else {
      return 404;
    }
  }
}

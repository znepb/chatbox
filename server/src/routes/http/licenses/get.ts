import { Request, Response } from "express";
import { Server } from "../../..";
import SuperAdminAuthenticator from "../../../auth/SuperAdminAuthenticator";
import getLicenseData from "../../../utils/getLicenseData";
import HttpRoute from "../../../classes/HttpRoute";
import AuthenticatedRoute from "../../../classes/AuthenticatedRoute";

export class GetLicense extends AuthenticatedRoute implements HttpRoute {
  public httpPath = "/licenses/:id";
  public httpMethod = "get";

  authenticate = SuperAdminAuthenticator;

  public async httpExecute(req: Request, res: Response): Promise<Object> {
    const userID = req.params.id;
    const license = await Server.prisma.license.findUnique({
      where: {
        userId: userID,
      },
    });

    if (license != null) {
      Server.uuidLicenseCache.setUsersLicense(userID, license.id);
      return getLicenseData(license);
    } else {
      return 404;
    }
  }
}

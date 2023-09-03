import { Request, Response } from "express";
import { Server } from "../../..";
import SuperAdminAuthenticator from "../../../auth/SuperAdminAuthenticator";
import HttpRoute from "../../../classes/HttpRoute";
import AuthenticatedRoute from "../../../classes/AuthenticatedRoute";

export class DeleteLicense extends AuthenticatedRoute implements HttpRoute {
  public httpPath = "/licenses/:id";
  public httpMethod = "delete";
  authenticate = SuperAdminAuthenticator;

  public async httpExecute(req: Request, res: Response): Promise<number> {
    const prisma = Server.prisma;

    const license = await prisma.license.findUnique({
      where: {
        id: req.params.id,
      },
    });

    if (license) {
      await prisma.user.update({
        where: {
          id: license.userId,
        },
        data: {
          licenseId: null,
          cbspyEnrolled: false,
        },
      });

      await prisma.license.delete({
        where: {
          id: req.params.id,
        },
      });

      Server.uuidLicenseCache.removeLicense(license.id);

      return 204;
    } else {
      return 404;
    }
  }
}

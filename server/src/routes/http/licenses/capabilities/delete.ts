import { Request, Response } from "express";
import { Server } from "../../../..";
import SuperAdminAuthenticator from "../../../../auth/SuperAdminAuthenticator";
import HttpRoute from "../../../../classes/HttpRoute";
import AuthenticatedRoute from "../../../../classes/AuthenticatedRoute";

export class DeleteLicenseCapability
  extends AuthenticatedRoute
  implements HttpRoute
{
  public httpPath = "/licenses/:id/capabilities/:capability";
  public httpMethod = "delete";

  authenticate = SuperAdminAuthenticator;

  public async httpExecute(req: Request, res: Response): Promise<Object> {
    const prisma = Server.prisma;

    let license = await prisma.license.findUnique({
      where: {
        id: req.params.id,
      },
    });

    if (!license) return 404;

    const capabilities = JSON.parse(license.capabilities);
    if (capabilities.includes(req.params.capability)) {
      capabilities.splice(capabilities.indexOf(req.params.capability), 1);
    } else {
      return 409;
    }

    await prisma.license.update({
      where: {
        id: req.params.id,
      },
      data: {
        capabilities: JSON.stringify(capabilities),
      },
    });

    Server.uuidLicenseCache.refresh(req.params.id);

    return 200;
  }
}

import { Request, Response } from "express";
import { Server } from "../../../..";
import SuperAdminAuthenticator from "../../../../auth/SuperAdminAuthenticator";
import z from "zod";
import HttpRoute from "../../../../classes/HttpRoute";
import AuthenticatedRoute from "../../../../classes/AuthenticatedRoute";
import { parseHTTP } from "../../../../utils/parse";
import { ALL_CAPABILITIES } from "../../../../utils/licenseCapabilities";

export class PutLicenseCapability
  extends AuthenticatedRoute
  implements HttpRoute
{
  public httpPath = "/licenses/:id/capabilities";
  public httpMethod = "put";

  authenticate = SuperAdminAuthenticator;

  public async httpExecute(req: Request, res: Response): Promise<Object> {
    const [success, error] = parseHTTP(
      req,
      res,
      z.object({
        capabilities: z.array(z.string()),
      })
    );

    if (success == false) return error || {};

    const prisma = Server.prisma;

    let license = await prisma.license.findUnique({
      where: {
        id: req.params.id,
      },
    });

    if (!license) return 404;

    console.log(req.body);

    const capabilities = JSON.parse(license.capabilities);

    for (let i = 0; i < req.body.capabilities.length; i++) {
      const element = req.body.capabilities[i];
      if (!ALL_CAPABILITIES.includes(element)) {
        return 400;
      } else if (capabilities.includes(element)) {
        return 409;
      }
    }

    capabilities.push(...req.body.capabilities);
    console.log(capabilities);

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

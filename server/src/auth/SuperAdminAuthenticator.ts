import { Request, Response } from "express";

export default function SuperAdminAuthenticator(
  req: Request,
  res: Response
): boolean {
  if (req.headers.authorization == undefined) {
    res.sendStatus(401);
    return false;
  }

  if (req.headers.authorization != `Bearer ${process.env.SUPER_ADMIN_TOKEN}`) {
    res.sendStatus(403);
    return false;
  }

  return true;
}

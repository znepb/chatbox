import { Request, Response } from "express";

export default abstract class AuthenticatedRoute {
  public abstract authenticate(req: Request, res: Response): boolean;
}

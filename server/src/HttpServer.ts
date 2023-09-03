import { Application, Request, Response } from "express";
import AuthenticatedRoute from "./classes/AuthenticatedRoute";
import HttpRoute from "./classes/HttpRoute";
import { debug, error, fatal, success } from "./utils/log";
import express from "express";
import { json } from "body-parser";
import { Server } from ".";

export default class HTTPServer {
  private app: Application;
  private jsonParser = json();

  constructor() {
    this.app = express();
  }

  public listen(config: { httpPort: number }) {
    this.app.listen(config.httpPort, () => {
      success("HTTP listening on port 3000");
    });
  }

  private async executeRoute(route: HttpRoute, req: Request, res: Response) {
    try {
      if (route instanceof AuthenticatedRoute) {
        const success = route.authenticate(req, res);
        if (success == false) return;
      }

      const data = await route.httpExecute(req, res);

      function handleData(newData?: any) {
        if (typeof newData == "object") {
          res.json(newData);
        } else if (typeof newData == "number") {
          res.sendStatus(newData);
        } else if (typeof newData != "undefined") {
          res.send(newData);
        }
      }

      handleData(data);
    } catch (e) {
      if ((e as any).toString)
        error(
          `Failed to execute route ${route.httpMethod.toUpperCase()} ${
            route.httpPath
          }! ${(e as any).toString()}`
        );

      try {
        res.sendStatus(500);
      } catch (e) {}
    }
  }

  public addRoute(route: HttpRoute) {
    debug("Adding route", route.httpMethod.toLocaleUpperCase(), route.httpPath);
    switch (route.httpMethod) {
      case "get":
        this.app.get(route.httpPath, (req, res) => {
          this.executeRoute(route, req, res);
        });
        break;
      case "post":
        this.app.post(route.httpPath, this.jsonParser, (req, res) => {
          this.executeRoute(route, req, res);
        });
        break;
      case "put":
        this.app.put(route.httpPath, this.jsonParser, (req, res) => {
          this.executeRoute(route, req, res);
        });
        break;
      case "delete":
        this.app.delete(route.httpPath, (req, res) => {
          this.executeRoute(route, req, res);
        });
        break;
      default:
        this.app.all(route.httpPath, (req, res) => {
          this.executeRoute(route, req, res);
        });
        break;
    }
  }
}

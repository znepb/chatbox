import { Index } from "./routes/shared";
import { PrismaClient } from "prisma/prisma-client";
import "dotenv/config";
import { GetLicense } from "./routes/http/licenses/get";
import { CreateLicense } from "./routes/http/licenses/create";
import { DispatchCommand } from "./routes/ws/dispatch/command";
import UserUUIDLicenseCache from "./classes/UserUUIDLicenseCache";
import { StartWS } from "./routes/http/ws";
import minecraftPlayer from "minecraft-player";
import { ToggleCBSpy } from "./routes/http/toggle-cbspy";
import WebsocketServer from "./WebsocketServer";
import HTTPServer from "./HttpServer";
import { Tell } from "./routes/shared/tell";
import { Say } from "./routes/shared/say";
import { DispatchDeath } from "./routes/ws/dispatch/death";
import { DispatchJoin } from "./routes/ws/dispatch/join";
import { DispatchLeave } from "./routes/ws/dispatch/leave";
import { DispatchMessage } from "./routes/ws/dispatch/message";
import { DeleteLicense } from "./routes/http/licenses/delete";
import { GetUsersLicense } from "./routes/http/user/license";
import { PutLicenseCapability } from "./routes/http/licenses/capabilities/put";
import { DeleteLicenseCapability } from "./routes/http/licenses/capabilities/delete";
import { BanUser } from "./routes/http/user/ban";
import { UnbanUser } from "./routes/http/user/unban";
import { parse } from "yaml";
import { readFileSync } from "fs";
import { z } from "zod";
import { ALL_CAPABILITIES } from "./utils/licenseCapabilities";
import { fatal, success } from "./utils/log";

const prisma = new PrismaClient();
const upSince = new Date().getTime();

const config = parse(readFileSync("./config.yml", "utf-8")) as {
  httpPort: number;
  wsPort: number;
  banCheckInterval: number;
  defaultCapabilities: string[];
};

const result = z
  .object({
    httpPort: z.number(),
    wsPort: z.number(),
    banCheckInterval: z.number(),
    defaultCapabilities: z.array(z.enum(ALL_CAPABILITIES as any)),
  })
  .safeParse(config);

if (result.success) {
  success("Config loaded successfully");
} else {
  fatal(
    `Could not load config! ${JSON.parse(result.error.message)[0].message}`
  );
  process.exit(1);
}

if (process.env.SUPER_ADMIN_TOKEN == undefined) {
  fatal("SUPER_ADMIN_TOKEN is not defined!");
  process.exit(1);
}

class UsernameCache {
  private usernameCache = new Map<string, string>();

  async get(uuid: string) {
    if (this.usernameCache.get(uuid)) {
      return this.usernameCache.get(uuid);
    } else {
      const player = await minecraftPlayer(uuid);
      if (player) {
        this.usernameCache.set(uuid, player.username);
        return player.username;
      }
    }
  }
}

function checkBans() {
  prisma.user
    .findMany({
      where: {
        bannedUntil: {
          lt: new Date(),
        },
      },
    })
    .then((users) => {
      users.forEach((user) => {
        prisma.user.update({
          where: {
            id: user.id,
          },
          data: {
            mayCreateLicense: true,
            bannedUntil: null,
          },
        });
      });
    });
}

const wsServer = new WebsocketServer(config);
const httpServer = new HTTPServer();

httpServer.addRoute(new Index());
httpServer.addRoute(new GetLicense());
httpServer.addRoute(new CreateLicense());
httpServer.addRoute(new DeleteLicense());
httpServer.addRoute(new StartWS());
httpServer.addRoute(new Tell());
httpServer.addRoute(new Say());
httpServer.addRoute(new ToggleCBSpy());
httpServer.addRoute(new GetUsersLicense());
httpServer.addRoute(new PutLicenseCapability());
httpServer.addRoute(new DeleteLicenseCapability());
httpServer.addRoute(new BanUser());
httpServer.addRoute(new UnbanUser());

httpServer.listen(config);

wsServer.addRoute(new Index());
wsServer.addRoute(new Tell());
wsServer.addRoute(new Say());
wsServer.addRoute(new DispatchCommand());
wsServer.addRoute(new DispatchDeath());
wsServer.addRoute(new DispatchJoin());
wsServer.addRoute(new DispatchLeave());
wsServer.addRoute(new DispatchMessage());

setInterval(checkBans, config.banCheckInterval);

export class Server {
  static upSince = upSince;
  static prisma = prisma;
  static wsServer = wsServer;
  static httpServer = httpServer;
  static uuidLicenseCache = new UserUUIDLicenseCache();
  static usernameCache = new UsernameCache();
  static config = config;
}

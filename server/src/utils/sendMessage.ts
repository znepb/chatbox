import { textToJSON } from "@sfirew/minecraft-motd-parser";
import { FORMAT, MARKDOWN, NO_PREFIX } from "./licenseCapabilities";
import { Server } from "..";
import { warn } from "./log";
import parseFormatting from "./parseFormatting";
import { parseMarkdown } from "./parseMarkdown";
import { MinecraftTextElement } from "../types";

export interface Data {
  user: string;
  message: string;
  formatting?: string;
  prefix?: string;
  hidePrefix?: boolean;
}

function checkJSONElement(
  element: unknown[],
  recursions: number
): MinecraftTextElement[] {
  if (recursions > 10) {
    throw new Error("Too many recursions in JSON element!");
  }

  const valid = [
    "text",
    "color",
    "font",
    "bold",
    "italic",
    "underlined",
    "strikethrough",
    "obfuscated",
    "insertion",
    "clickEvent",
    "hoverEvent",
  ];
  const validClickEventActions = [
    "open_url",
    "run_command",
    "suggest_command",
    "change_page",
    "copy_to_clipboard",
  ];

  element.forEach((value, key) => {
    Object.keys(value as any).forEach((elementKey) => {
      const element = (value as any)[elementKey];
      if (typeof elementKey != "string") {
        throw new Error(`Invalid JSON element: ${elementKey}`);
      } else if (!valid.includes(elementKey)) {
        throw new Error(`Invalid JSON element: ${elementKey}`);
      } else if (elementKey == "clickEvent") {
        if (typeof element != "object") {
          throw new Error(`Invalid clickEvent: ${element}`);
        } else if (typeof element.action != "string") {
          throw new Error(`Invalid clickEvent action: ${element.action}`);
        } else if (!validClickEventActions.includes(element.action)) {
          throw new Error(`Invalid clickEvent action: ${element[key].action}`);
        } else if (typeof element.value != "string") {
          throw new Error(`Invalid clickEvent value: ${element[key].value}`);
        }
      } else if (elementKey == "hoverEvent") {
        if (typeof element != "object") {
          throw new Error(`Invalid hoverEvent: ${element}`);
        } else if (typeof element.action != "string") {
          throw new Error(`Invalid hoverEvent action: ${element.action}`);
        } else if (element.action != "show_text") {
          throw new Error(
            `Invalid hoverEvent contents: ${element.contents}. Only show_text is supported.`
          );
        }

        checkJSONElement(element.contents, recursions + 1);
      } else if (elementKey == "extra") {
        checkJSONElement(element.contents, recursions + 1);
      }
    });
  });

  return element as MinecraftTextElement[];
}

export default async function sendMessage(
  user: string,
  data: Data,
  capabilities: string[]
) {
  const message: MinecraftTextElement[] = [];

  if (!data.hidePrefix || !capabilities.includes(NO_PREFIX)) {
    message.push(
      {
        text: "[",
        color: "dark_gray",
      },
      {
        text: "CB",
        color: "gray",
        hoverEvent: {
          action: "show_text",
          contents: [
            {
              text: `Chatbox message from ${user}`,
              color: "white",
            },
          ],
        },
      },
      {
        text: "] ",
        color: "dark_gray",
      }
    );

    if (data.prefix) {
      parseFormatting(data.prefix).forEach((element) => {
        message.push(element);
      });
      message.push({
        text: `: `,
        color: "gray",
      });
    } else {
      message.push({
        text: `${user}: `,
        color: "gray",
      });
    }
  }

  if (data.formatting == "format" && capabilities.includes(FORMAT)) {
    parseFormatting(data.message).forEach((element) => {
      message.push(element);
    });
  } else if (data.formatting == "markdown" && capabilities.includes(MARKDOWN)) {
    parseMarkdown(data.message).forEach((element) => {
      message.push(element);
    });
  } else if (data.formatting == "json") {
    try {
      const json = JSON.parse(data.message);
      checkJSONElement(json, 0).forEach((element) => {
        message.push(element);
      });
    } catch (e) {
      warn("Failed to parse JSON message: " + e);
      message.push({
        text: data.message,
        color: "white",
      });
    }
  } else {
    message.push({
      text: data.message,
      color: "white",
    });
  }

  const result = await Server.wsServer.sendToServer({
    action: "send-message",
    type: "REQ",
    data: {
      message,
      player: user,
    },
  });

  if (result?.success == false) {
    warn("Failed to dispatch chatbox message! " + result.error);
  }
}

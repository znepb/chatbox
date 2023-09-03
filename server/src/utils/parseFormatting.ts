import { textToJSON } from "@sfirew/minecraft-motd-parser";
import { MinecraftTextElement } from "../types";

export default function parseFormatting(text: string): MinecraftTextElement[] {
  const message: MinecraftTextElement[] = [];

  const parsed = textToJSON(text.split("&").join("§"));
  parsed.extra.forEach((element) => {
    element.extra = undefined;
    if (element.color == undefined) element.color = "white";
    message.push({
      text: element.text,
      color: element.color as string,
      bold: element.bold as boolean | undefined,
      strikethrough: element.strikethrough as boolean | undefined,
      underlined: element.underlined as boolean | undefined,
      obfuscated: element.obfuscated as boolean | undefined,
      italic: element.italic as boolean | undefined,
    });
  });

  return message;
}

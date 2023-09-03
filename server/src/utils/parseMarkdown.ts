import { MinecraftTextElement } from "../types";
import { debug, info } from "./log";

interface MarkdownElement {
  text: string;
  link?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  code?: boolean;
  spoiler?: boolean;
}

export function parseMarkdown(message: string): MinecraftTextElement[] {
  const elements = parseMarkdownText(message);
  const result: MinecraftTextElement[] = elements.map(
    (element): MinecraftTextElement => {
      if (element.code === true) {
        return {
          text: element.text,
          color: "gray",
          hoverEvent: {
            action: "show_text",
            contents: [
              {
                text: "Click to copy",
                color: "white",
              },
            ],
          },
        };
      } else if (element.spoiler === true) {
        return {
          text: "■".repeat(element.text.length),
          color: "dark_gray",
          hoverEvent: {
            action: "show_text",
            contents: [
              {
                text: element.text,
                color: "white",
              },
            ],
          },
        };
      } else {
        return {
          text: element.text,
          color: element.link != undefined ? "blue" : "white",
          bold: element.bold,
          italic: element.italic,
          underlined: element.underline || element.link != undefined,
          strikethrough: element.strikethrough,
          clickEvent:
            element.link != undefined
              ? {
                  action: "open_url",
                  value: element.link,
                }
              : undefined,

          hoverEvent:
            element.link != undefined
              ? {
                  action: "show_text",
                  contents: [
                    {
                      text: element.link,
                      color: "white",
                    },
                  ],
                }
              : undefined,
        };
      }
    }
  );

  return result;
}

export function parseMarkdownText(message: string): MarkdownElement[] {
  // a very shotty markdown parser

  let pos = 0;
  let bold = false;
  let italic = false;
  let underline = false;
  let strikethrough = false;
  let code = false;
  let link = false;
  let linkUrl = false;
  let spoiler = false;
  let linkContent = "";
  let text = "";

  let result: MarkdownElement[] = [];

  const pushElement = () => {
    result.push({
      text: text || "",
      bold,
      italic,
      underline,
      strikethrough,
      code,
      spoiler,
      link: link ? linkContent : undefined,
    });

    text = "";
    linkContent = "";
  };

  while (pos < message.length) {
    if (message[pos] == "*") {
      if (message[pos + 1] == "*") {
        // ***
        if (message[pos + 2] == "*") {
          if (bold && italic) {
            pushElement();
            bold = false;
            italic = false;
          } else {
            pushElement();
            bold = true;
            italic = true;
          }

          pos += 3;
          // **
        } else {
          pushElement();
          bold = !bold;
          pos += 2;
        }
        // *
      } else {
        pushElement();
        italic = !italic;
        pos++;
      }
    } else if (message[pos] == "|" && message[pos + 1] == "|") {
      pushElement();
      spoiler = !spoiler;
      pos += 2;
    } else if (message[pos] == "_") {
      if (message[pos + 1] == "_") {
        pushElement();
        underline = !underline;
        pos += 2;
      } else {
        pushElement();
        italic = !italic;
        pos++;
      }
    } else if (message[pos] == "~" && message[pos + 1] == "~") {
      pushElement();
      strikethrough = !strikethrough;
      pos += 2;
    } else if (message[pos] == "`") {
      pushElement();
      code = !code;
      pos++;
    } else if (message[pos] == "[") {
      pushElement();
      link = true;
      pos++;
    } else if (message[pos] == "]" && message[pos + 1] == "(" && link) {
      linkUrl = true;
      pos += 2;
    } else if (message[pos] == ")") {
      pushElement();
      link = false;
      linkUrl = false;

      pos++;
    } else if (linkUrl) {
      linkContent += message[pos];
      pos++;
    } else {
      text += message[pos];
      pos++;
    }
  }

  return result;
}

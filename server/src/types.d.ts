import { WebSocket } from "ws";

interface WSData {
  type: "client" | "server";
  connected: boolean;
  expires: number?;
  license: string?;
  ws: WebSocket?;
  id: string;
}

interface MinecraftClickEvent {
  action:
    | "run_command"
    | "suggest_command"
    | "open_url"
    | "change_page"
    | "copy_to_clipboard";
  value: string;
}

interface MinecraftHoverEvent<T, C> {
  action: T;
  contents: C;
}

interface MinecraftHoverEvent {
  action: "show_text";
  contents: MinecraftTextElement;
}

interface MinecraftHoverEvent {
  action: "show_item";
  contents: {
    id: string;
    count?: number;
    tag?: string;
  };
}

interface MinecraftHoverEvent {
  action: "show_entity";
  contents: {
    name: string;
    type: string;
    id: string;
  };
}

interface MinecraftTextElement {
  text: string | number;
  color?:
    | "black"
    | "dark_blue"
    | "dark_green"
    | "dark_aqua"
    | "dark_red"
    | "dark_purple"
    | "gold"
    | "gray"
    | "dark_gray"
    | "blue"
    | "green"
    | "aqua"
    | "red"
    | "light_purple"
    | "yellow"
    | "white"
    | string;
  font?: string;
  bold?: boolean;
  italic?: boolean;
  underlined?: boolean;
  strikethrough?: boolean;
  obfuscated?: boolean;
  insertion?: string;
  clickEvent?: MinecraftClickEvent;
  hoverEvent?: MinecraftHoverEvent;
  extra?: MinecraftTextElement[];
}

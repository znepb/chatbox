export const regexUuid =
  /[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}/g;
export const regexBold = /\*\*(.+?)\*\*(?!\*)/g;
export const regexItalic = /\*([^*><]+)\*/g;
export const regexUnderline = /__([^_><]+)__/g;
export const regexStrikethrough = /~([^~><]+)~/g;
export const regexLink = /\[(.*)\]\((.*)\)/g;
export const regexCode = /`([^`><]+)`/g;

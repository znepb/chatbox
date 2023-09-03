import chalk from "chalk";

export function debug(...message: string[]) {
  console.log(chalk.bold(chalk.gray("[*] ")) + chalk.gray(message.join(" ")));
}

export function info(...message: string[]) {
  console.log(chalk.bold(chalk.blue("[#] ")) + message.join(" "));
}

export function success(...message: string[]) {
  console.log(chalk.bold(chalk.green("[✓] ")) + message.join(" "));
}

export function warn(...message: string[]) {
  console.log(chalk.bold(chalk.yellow("[!] ")) + message.join(" "));
}

export function error(...message: string[]) {
  console.log(chalk.bold(chalk.red("[!] ")) + message.join(" "));
}

export function fatal(...message: string[]) {
  console.log(
    chalk.bold(chalk.bgRed(chalk.white("[!] "))) +
      chalk.bgRed(chalk.white(message.join(" ")))
  );
}

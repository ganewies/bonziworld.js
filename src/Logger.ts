import chalk, { ChalkInstance } from "chalk";

export class Logger {
    private c: ChalkInstance;
    private msgstart: string;

    constructor() {
        this.c = chalk;
        this.msgstart = `bonziworld.js: [{Logging.LEVEL.text}] `;
    }
    
    private format(level: string, color: (txt: string) => string, ...message: string[]) {
        const msg = message.join(" ");
        return color(`${this.msgstart.replace("{Logging.LEVEL.text}", level.toUpperCase())}${msg}`);
    }

    public Error(...message: string[]) {
        console.log(this.format("error", this.c.redBright.bold.italic, ...message));
    }
    public Critical(...message: string[]) {
        const msg = message.join(" ");
        console.log(this.format("critical", this.c.red.bold.italic, msg));
        throw new Error(msg);
    }

    public Warning(...message: string[]) {
        console.log(this.format("warning", this.c.yellow.italic, ...message));
    }
    public Success(...message: string[]) {
        console.log(this.format("success", this.c.greenBright.italic, ...message));
    }

    public Log(...message: string[]) {
        console.log(this.format("log", this.c.reset, ...message));
    }
    public Info(...message: string[]) {
        console.log(this.format("info", this.c.blueBright, ...message));
    }

    public NotImportant(...message: string[]) {
        console.log(this.c.gray(`bwi.js: ${message.join(" ")}`));
    }
}

import { BonziClientConfig } from "../Interfaces/Client.js";

export class BonziClient {
    public username: string = "";
    constructor(username?: string | null | undefined/*, config: BonziClientConfig*/) {
        this.username = username || "";
    }
}
import { BonziClientConfig } from "../Interfaces/Client.js";
import { connect as WebSocket } from "socket.io-client";
import * as BU from "../Utils/BefaUtils.js";
import { Logger } from '../Logger.js';

export class BonziClient {
    private listeners: Map<string, VoidFunction> = new Map<string, VoidFunction>;
    private log: Logger = new Logger();
    public username: string = "";

    private _sckt = WebSocket('wss://bonzi.gay', { transports: ["websocket"] });
    private conn: boolean = false;
    constructor(username?: string | null | undefined, config?: BonziClientConfig | undefined) {
        this.username = username || ""; // if empty, it will be renamed as Anonymous

        this._sckt.on('connect', () => {
            this.conn = true;
            this.log.Log("Successfully connected to BonziWORLD as " + this.username);
            this._sckt.emit("login", { "name": this.username, "room": config?.room || "" });
            this.listeners.get("connected")?.();
        });
        this._sckt.on('disconnect', () => {
            this.log.Warning(`Disconnected from BonziWORLD`);
        });

        //@ts-ignore
        this._sckt.on('update', ({ guid, user }) => {
            //@ts-ignore
            this.listeners.get('joined')?.(guid, user);
        });
        //@ts-ignore
        this._sckt.on('talk', ({ guid, text, msgid }) => {
            //@ts-ignore
            this.listeners.get("speaking")?.(guid, text, msgid);
        });
        //@ts-ignore
        this._sckt.on('leave', ({ guid }) => {
            //@ts-ignore
            this.listeners.get('left')?.(guid);
        });
    }

    public sendTyping(): void {
        this._sckt.emit("typing", 1);
    }
    public say(message: string): string {
        this._sckt.emit("talk", { text: message });
        return message;
    }

    public leave(): void {
        this._sckt.close();
    }

    public on(ev: "joined"|"left"|"speaking"|"connected", cb: (...args: any[]) => void): void { this.listeners.set(ev, cb) }
    public off(ev: "joined"|"left"|"speaking"|"connected"): void { this.listeners.delete(ev) }
}

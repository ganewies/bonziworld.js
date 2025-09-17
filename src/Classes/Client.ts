import { BonziClientConfig } from "../Interfaces/Client.js";
import { connect as WebSocket } from "socket.io-client";
import * as BU from "../Utils/BefaUtils.js";
import { Logger } from '../Logger.js';
import { Bonzi } from "../Interfaces/User.js";
import { Colors } from "../Utils/Colors.js";

export class BonziClient {
    private listeners: Map<string, VoidFunction> = new Map<string, VoidFunction>;
    private log: Logger = new Logger();
    public username: string = "";

    public onlineUsers: Map<string, Bonzi> = new Map<string, Bonzi>; // guid, userPublic

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
        this._sckt.once('updateAll', ({ usersPublic: users }) => {
            for (const [guid, user] of Object.entries(users)) {
                //@ts-ignore
                this.onlineUsers.set(guid, user);
            }
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

    public showYTVideo(vid: string): void {
        this.sendCommand('youtube', [vid]);
    }
    public showImage(url: URL): void {
        if (url.protocol !== "https" || url.hostname !== "catbox.moe") return this.log.Warning('Only catbox.moe images is allowed!');
        this.sendCommand('image', [url as unknown as string]);
    }
    public showVideo(url: URL): void {
        if (url.protocol !== "https" || url.hostname !== "catbox.moe") return this.log.Warning('Only catbox.moe images is allowed!');
        this.sendCommand('video', [url as unknown as string]);
    }

    public setColor(color: Colors): void {
        this.sendCommand('color', [color as string]);
    }
    public setHat(hat: string): void {
        this.sendCommand('hat', [hat]);
    }

    public leave(): void {
        this._sckt.close();
    }

    private sendCommand(command: string, args: string[]): { cmd: string; args: string[] } {
        this._sckt.emit('command', { list: [command, ...args] });
        return { cmd: command, args };
    }

    public on(ev: "joined"|"left"|"speaking"|"connected", cb: (...args: any[]) => void): void { this.listeners.set(ev, cb) }
    public off(ev: "joined"|"left"|"speaking"|"connected"): void { this.listeners.delete(ev) }
}

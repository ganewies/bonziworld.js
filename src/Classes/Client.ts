import { BonziClientConfig } from "../Interfaces/Client.js";
import { connect as WebSocket } from "socket.io-client";
import { Logger } from '../Logger.js';
import { Bonzi } from "../Interfaces/User.js";
import { Colors } from "../Utils/Colors.js";
import { Events } from "../Types/Events.js";
import { EventMap } from "../Types/EventCallback.js";
import { PollVotes } from "../Types/Poll.js";

export class BonziClient {
    private listeners: Map<string, VoidFunction> = new Map<string, VoidFunction>;
    private log: Logger = new Logger();
    public username: string = "";

    public onlineUsers: Map<string, Bonzi> = new Map<string, Bonzi>; // guid, userPublic

    private _sckt: SocketIOClient.Socket;
    private conn: boolean = false;
    private conntime: number = Date.now();
    constructor(username?: string | null | undefined, config?: BonziClientConfig | undefined | null, url: string = "wss://bonziworld.net") {
        this.username = username || "Anonymous Bot"; // if empty, it will be renamed as Anonymous, but for backward compatibility let's say to put Anonymous

        this._sckt = WebSocket(url, { transports: ["websocket"] });
        this._sckt.on('connect', () => {
            this.conn = true;
            this.log.Log("Successfully connected to BonziWORLD as " + this.username);
            this._sckt.emit("login", { name: this.username, room: config?.room || "default" });
            //@ts-ignore
            this.listeners.get("connected")?.(Date.now() - this.conntime);
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
            if (this.onlineUsers.get(guid)) return;
            //@ts-ignore
            this.listeners.get('joined')?.(guid, user);
            this.onlineUsers.set(guid, { guid, userPublic: user });
        });
        //@ts-ignore
        this._sckt.on('talk', ({ guid, text, msgid }) => {
            const user = this.onlineUsers?.get(guid)?.userPublic;
            //@ts-ignore
            this.listeners.get("speaking")?.(user, text, msgid);
        });
        //@ts-ignore
        this._sckt.on('image', ({ guid, url, msgid }) => {
            const user = this.onlineUsers?.get(guid)?.userPublic;
            //@ts-ignore
            this.listeners.get("speaking")?.(user, `Displayed an image: ${url}`, msgid);
        });
        //@ts-ignore
        this._sckt.on('video', ({ guid, url, msgid }) => {
            const user = this.onlineUsers?.get(guid)?.userPublic;
            //@ts-ignore
            this.listeners.get("speaking")?.(user, `Displayed a video: ${url}`, msgid);
        });
        //@ts-ignore
        this._sckt.on('youtube', ({ guid, vid }) => {
            const user = this.onlineUsers?.get(guid)?.userPublic;
            //@ts-ignore
            this.listeners.get("speaking")?.(user, `Displayed a YouTube video: https://youtube.com/watch?v=${vid}`);
        });
        //@ts-ignore
        this._sckt.on('leave', ({ guid }) => {
            const profile = this.onlineUsers?.get(guid)?.userPublic;
            //@ts-ignore
            this.listeners.get('left')?.(guid, profile);
            this.onlineUsers.delete(guid);
        });
    }

    /**
     * Make the bot feel that he is typing
     */
    public sendTyping(): void {
        if (!this.conn) throw new Error('Emited a message but client not connected');
        this._sckt.emit("typing", 1);
    }
    /**
     * Make your bot send something
     * @param message The message to speech
     */
    public say(message: string): string {
        if (!this.conn) throw new Error('Emited a message but client not connected');
        this._sckt.emit("talk", { text: message });
        return message;
    }
    
    /**
     * Call someone a bass
     */
    public callBass(username: string): string {
        if (!this.conn) throw new Error('Emited a message but client not connected');
        this._sckt.emit('bass', [username]);
        return username;
    }
    /**
     * Call someone an asshole
     */
    public callAsshole(username: string): string {
        if (!this.conn) throw new Error('Emited a message but client not connected');
        this._sckt.emit('asshole', [username]);
        return username;
    }

    public makePoll(title: string): PollVotes {
        this.sendCommand('poll', [title]);
        return [0,0];
    }

    /**
     * Send a YouTube video
     * @param vid The video ID (not full URL)
     */
    public showYTVideo(vid: string): void {
        if (!this.conn) throw new Error('Emited a message but client not connected');
        this.sendCommand('youtube', [vid]);
    }
    /**
     * Show an image
     * @param url Should be only a catbox link
     */
    public showImage(url: URL): void {
        if (!this.conn) throw new Error('Emited a message but client not connected');
        if (url.protocol !== "https" || url.hostname !== "files.catbox.moe") return this.log.Warning('Only catbox.moe images is allowed!');
        this.sendCommand('image', [url as unknown as string]);
    }
    /**
     * Show a video
     * @param url Should be only a catbox link
     */
    public showVideo(url: URL): void {
        if (!this.conn) throw new Error('Emited a message but client not connected');
        if (url.protocol !== "https" || url.hostname !== "files.catbox.moe") return this.log.Warning('Only catbox.moe videos is allowed!');
        this.sendCommand('video', [url as unknown as string]);
    }

    /**
     * Set your bot's Bonzi color
     */
    public setColor(color: Colors): void {
        if (!this.conn) throw new Error('Emited a message but client not connected');
        this.sendCommand('color', [color as string]);
    }
    /**
     * Apply an hat to your bot's Bonzi
     */
    public setHat(hat: string): void {
        if (!this.conn) throw new Error('Emited a message but client not connected');
        this.sendCommand('hat', [hat]);
    }
    
    /**
     * Set the speech speed of your bot
     */
    public setSpeed(speed: number): void {
        if (!this.conn) throw new Error('Emited a message but client not connected');
        this.sendCommand('speed', [speed.toString()]);
    }
    /**
     * Set the speech pitch of your bot
     */
    public setPitch(pitch: number): void {
        if (!this.conn) throw new Error('Emited a message but client not connected');
        this.sendCommand('pitch', [pitch.toString()]);
    }

    /**
     * Close your connection
     */
    public leave(): void {
        if (this.conn) this._sckt.close();
        process.exit();
    }

    private sendCommand(command: string, args: string[]): { cmd: string; args: string[] } {
        this._sckt.emit('command', { list: [command, ...args] });
        return { cmd: command, args };
    }

    /**
     * Subscribe to an event
     */
    //@ts-ignore
    public on<E extends Events>(ev: Events, cb: EventMap[E]): void { this.listeners.set(ev, cb) }
    /**
     * Unsubscribe to an event
     */
    public off(ev: Events): void { this.listeners.delete(ev) }
}

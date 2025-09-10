export enum Types {
    heartbeat = "2",
    connected = "2probe&&&5",
    packet = "42[{{_MESSAGE_}}]"
}

interface MSG_login {
    name: string;
    room: string;
}

export interface Messages {
    login: MSG_login;
    talk: { text: string };
    typing: 0|1;
    command: { list: string[] };
}
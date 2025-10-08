import { userPublic } from "../Interfaces/User";
export type EventMap = {
    joined: (guid: string, user: userPublic) => void;
    left: (guid: string) => void;
    speaking: (guid: string, text: string, msgid: string) => void;
    connected: (connectionTime: number) => void;
    typing: (guid: string) => void;
}

import { Colors } from "../Utils/Colors.js";

export interface Bonzi {
    guid: string;
    userPublic: userPublic;
}
export interface userPublic {
    color: Colors;
    typing: ""|"typing";
    tag: string;
    name: string;
    speed: number;
    pitch: number;
}

import { dialogContent } from "../Components/agreeDialog";
import { stageType } from "./TicketUtils";

export type StagesInfo = {
    [key: string]: string;
};

export type ContentInfo = {
    stage: stageType;
    sender: string;
    userID?: number;
    messageID: number;
    content: string;
};

export interface AllInfo {
    ticketID: number;
    stages: StagesInfo;
    messages: Array<ContentInfo>;
}

export interface SpeedDialType {
    name: string;
    callback: () => void;
    icon: JSX.Element;
}

export interface OwnerNavBarProps {
    pin: number;
    stage: stageType;
    ws: WebSocket;
    setbackDropOpen: React.Dispatch<React.SetStateAction<boolean>>;
    dialog: dialogContent;
    setDialog: React.Dispatch<React.SetStateAction<dialogContent>>;
    ticketID: number;
    token: string;
}
import { ticketDataType } from "../Pages/Ticket"

export type stageType = 0 | 1 | 2; // know, want to learn, learned
type cachedTicketDataType = {[key: number]: Object}

async function setLocalStorageItem(ticketData: cachedTicketDataType) {
    const serializedData = JSON.stringify(ticketData);
    window.localStorage.setItem("ticketData", serializedData);
  }

function assignNewData(cachedTicketdata: cachedTicketDataType, newData: cachedTicketDataType) {
    Object.assign(cachedTicketdata, newData)
    setLocalStorageItem((cachedTicketdata as cachedTicketDataType)).then(void 0);

}

export async function checkIfItemExistsInCache(id: number): Promise<boolean> {
    const getAsyncData = await getAllCachedData();
    if (typeof getAsyncData !== "boolean" && id in getAsyncData) {
        return true
    } else {
        return false;
    }
}

export function deleteItemFromCachedData(id: number) {
    const ticketData = getAllCachedData();
    ticketData.then((data) => {
        if (data) {
            if (id in ticketData) {
                delete (data as cachedTicketDataType)[id]
                setLocalStorageItem((data as cachedTicketDataType))
            }
        }
    })
}

export async function getCachedData(id: number): Promise<undefined | ticketDataType> {
    return getAllCachedData().then((data) => {
        if (data) {
            return ((data as cachedTicketDataType)[id] as ticketDataType)
        } else {
            return undefined
        }
    })
}

export async function getAllCachedData(): Promise<cachedTicketDataType | boolean> {
    const rawData = window.localStorage.getItem("ticketData");

    if (rawData === null || rawData === undefined) return false;

    const serializedData = JSON.parse(rawData);
    return serializedData;
}

export async function cacheTicketData(
    id: number,
    data: Object
  ) {
    const cachedTicketdata = getAllCachedData()
    cachedTicketdata.then(
        (ticketData) => {
            if(ticketData === {} || ticketData === false) {
                const newData = {[id]: data}
                setLocalStorageItem(newData).then(void 0);
            } else if (Object.keys(ticketData).length >= 3) {
                const lastItem: number = parseInt(Object.keys(ticketData).slice(2,3)[0])
                delete (ticketData as cachedTicketDataType)[lastItem]
                assignNewData((ticketData as cachedTicketDataType),{[id]: data})
            } else {
                assignNewData((ticketData as cachedTicketDataType),{[id]: data})
            }
        }
    )

  }

export function isStage(receivedStage: number): receivedStage is stageType {
    return receivedStage >= 0 && receivedStage <= 3;
  }

export const topicMapping = {
    0: "ticket_know",
    1: "ticket_want_to_learn",
    2: "ticket_learned",
  };

export const wsAddress = window.location.origin.includes("localhost:3000")
    ? "ws://localhost:8000/api/kwl/ticket-ws/"
    : "wss://kwl.app/api/kwl/ticket-ws/";
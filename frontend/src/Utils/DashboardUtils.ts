type dashboardDataType = Array<Object> | undefined;
type dashboardStateType = { [key: string]: dashboardDataType | string };

export async function setLocalStorageItem(dashboardData: dashboardStateType) {
  const serializedStore = JSON.stringify(dashboardData);
  window.localStorage.setItem("dashboardData", serializedStore);
}

export async function cacheData(
  data: dashboardDataType = undefined,
  state: string = "updated"
) {
  const dashboardData: dashboardStateType = { state: state, data: data };
  setLocalStorageItem(dashboardData).then(void 0);
}

export function getCachedData() {
  const rawData = window.localStorage.getItem("dashboardData");

  if (rawData === null || rawData === undefined) return false;

  const serializedData = JSON.parse(rawData);

  if ("state" in serializedData && serializedData["state"] !== "updated") {
    return false;
  }
  return serializedData;
}

export function daysBetween(timestamp1: number, timestamp2: number) {
    var difference = timestamp1 - timestamp2;
    var daysDifference = Math.floor(difference / 1000 / 60 / 60 / 24);
  
    return daysDifference + 1;
  }

export async function updateCachedData() {
    // updates the data in the localstorage for dashboard.
    let cachedData = getCachedData();
    if (cachedData) {
      cachedData = { ...cachedData, state: "new" };
      setLocalStorageItem(cachedData).then(void 0);
    }
  }
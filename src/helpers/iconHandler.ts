import { RecState } from "../Constants/enum";

export const changeIconsOnRecState = (state) => {
    switch (state) {
        case RecState.OFF:
            // chrome.browserAction.setIcon({ path: 'stop.png' });
            break;
        case RecState.ON:
            // chrome.browserAction.setIcon({ path: 'start.png' });
            break;
        default:
            // chrome.browserAction.setIcon({ path: 'stop.png' });
            break;
    }
}
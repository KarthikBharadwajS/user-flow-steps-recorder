import { RecordingInt } from "../__typedefs";
import { RecState } from "./enum";
import { addDOMListeners, removeDOMListeners } from "../DomListener/EventHandler";
import BackgroundModel from "./model";

var port: chrome.runtime.Port = null;
var toggleRecording: RecordingInt = { isRecording: RecState.OFF };
var dimensions;

export const setPort = (port: chrome.runtime.Port) => { console.log("Port set", port); port = port; return; };

export const getPort = () => port;

export const setDimensions = (d) => { dimensions = d };

export const getDimensions = () => dimensions;

export var toggleRecordingState = new Proxy(toggleRecording, {
    set: function (target, key, value) {
        const modValue = value as RecState;
        console.log(`Recording`, modValue ? "started" : "stopped");
        target[key] = modValue;
        BackgroundModel.updateStatus(modValue);
        return true;
    },
    get: function (target, key) { return target[key]; }
});
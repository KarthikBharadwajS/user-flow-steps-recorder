import { ACTIONS, RecState } from "../Constants/enum";

export interface ParsedEvent {
    selector: string,
    action: string,
    tag: string,
    value: string,
    id?: string,
    key?: string,
    href?: string,
    inputType?: string,
}

export interface RecordingInt {
    isRecording: RecState
}

export interface ActionMessage {
    type: ACTIONS,
    payload?: any
}

export interface Script {
    value: string,
    id: string,
}

export interface ScriptResolver {
    success: boolean,
    data: Script,
    message: string
}

export interface Session {
    isPending: boolean,
    lastURL: string,
    originalHost: string,
    activePort: chrome.runtime.Port | null,
  }
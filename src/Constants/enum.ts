/** DOM EVENTS */
export enum EventType {
    CLICK = 'click',
    CHANGE = 'change',
    DBLCLICK = 'dblclick',
    KEYDOWN = 'keydown',
    SUBMIT = 'submit',
};

/** DOM PATTERNS */
export enum MatchPattern {
    CSS = 'css selectors',
    XPATH = 'xpath'
};

/** RECORD STATUS */
export enum RecState {
    ON = 1,
    OFF = 0
}

/** ACTIONS */
export enum ACTIONS {
    STOP,
    START,
    RESET,
    PUSH
}
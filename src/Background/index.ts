/**
 * The background script which is always runnin'.
 *
 * Serves as the router and controller for the extension; the popup sends messages to the background
 * and the background sets up the event recording and code generation and serves the resulting code
 * back to the popup for display to the user.
 */

import { RecState, ACTIONS as ControlAction, EventType } from "../Constants/enum";
import { ActionMessage, ParsedEvent, Session } from "../__typedefs";
import { default as model } from "../Constants/model";
import ScriptGen from "../CypressScriptGenerator/CyGenerator";
import { setDimensions, toggleRecordingState } from "../Constants/state";

let onStart = true;

const session: Session = {
    isPending: false,
    lastURL: '',
    originalHost: '',
    activePort: null,
};

/**
 * Controls the flow of execution by enforcing synchronicity.
 * @param cb
 * @param args
 */
function control(cb: (...args: any) => Promise<void>, cmd?: string | ActionMessage): void {
    if (session.isPending) return;
    session.isPending = true;
    cb(cmd)
        .catch(err => new Error(err))
        .finally(() => {
            session.isPending = false;
        });
}

/**
 * Injects the event recorder into the active tab.
 *
 * @param details If the details argument is present, that means that web navigation occurred, and
 * we want to ensure that this navigation is occurring in the top-level frame.
 */
function injectEventRecorder(
    details?: chrome.webNavigation.WebNavigationFramedCallbackDetails,
): Promise<void> {
    return new Promise((resolve, reject) => {
        if (!details || details.frameId === 0) {
            /*chrome.tabs.executeScript({ file: 'script.js' }, () => {
                if (chrome.runtime.lastError) { console.log("Error at injectEventRecorder ", chrome.runtime.lastError); reject(chrome.runtime.lastError)}
                else resolve();
            });*/

            chrome.tabs.query({ active: true }, function (tabs) {
                console.log(tabs);
                setDimensions({ height: tabs[0].height, width: tabs[0].width, url: tabs[0].url });
                chrome.scripting.executeScript({ target: { tabId: tabs[0].id, allFrames: true }, files: ["script.js"] }, function (result) {
                    console.log(result);
                    resolve();
                })
            })


        } else resolve();
    });
}

/**
 * Disconnects the event recorder.
 * @param details
 */
function ejectEventRecorder(
    details?: chrome.webNavigation.WebNavigationParentedCallbackDetails,
): void {
    if (session.activePort && (!details || details.frameId === 0)) session.activePort.disconnect();
}

/**
 * Handles events sent from the event recorder.
 * @param event
 */
async function handleEvents(event: ParsedEvent): Promise<void> {
    const script = await ScriptGen.onEventGen(event);
    if(script) console.log(script);
    if (script !== null) {
        if (event.action === EventType.DBLCLICK) {
            model.doubleClickHandler()
                .then(() => {
                    model.pushScript(script);
                })
                .catch(err => new Error(err));
        } else {
            model.pushScript(script)
                .catch(err => new Error(err));
        }
    }
}

/**
 * Stops recording and sends back code to the view.
 */
let stopRecording: () => Promise<void>;

function checkForBadNavigation(
    details: chrome.webNavigation.WebNavigationTransitionCallbackDetails,
): void {
    if (details.frameId === 0
        && (!details.url.includes(session.originalHost)
            || details.transitionQualifiers.includes('forward_back')
            || details.transitionQualifiers.includes('from_address_bar'))
    ) {
        control(stopRecording);
    } else if (details.url.includes(session.originalHost)) {
        const urlBlock = ScriptGen.onNavigationGen(details.url);
        console.log(urlBlock);
        model.pushScript(urlBlock)
            .then(block => chrome.runtime.sendMessage({ type: ControlAction.PUSH, payload: block }))
            .catch(err => new Error(err));
    }
}

function handleFirstConnection(): void {
    session.originalHost = session.activePort.name;
    chrome.webNavigation.onBeforeNavigate.addListener(ejectEventRecorder);
    chrome.webNavigation.onCommitted.addListener(checkForBadNavigation);
    chrome.webNavigation.onDOMContentLoaded.addListener(
        injectEventRecorder,
        { url: [{ hostEquals: session.originalHost }] },
    );
    if (session.lastURL !== session.activePort.sender.url) {
        const visitBlock = ScriptGen.onConnectionGen(session.activePort.sender.url);
        console.log(visitBlock);
        session.lastURL = session.activePort.sender.url;
        model.pushScript(visitBlock)
            .then(block => chrome.runtime.sendMessage({ type: ControlAction.PUSH, payload: block }))
            .catch(err => new Error(err));
    }
}

/**
 * Handles any new connections from event recorders.
 *
 * Event recorders will open new connections upon injection into their tab;
 * upon establishing this connection, we need to listen to any new messages on this port;
 * this is how the event recorder sends the background information.
 * @param portToEventRecorder
 */
function handleNewConnection(portToEventRecorder: chrome.runtime.Port): void {
    console.log("connection :", portToEventRecorder);
    session.activePort = portToEventRecorder;
    session.activePort.onMessage.addListener(handleEvents);
    if (model.status !== RecState.ON) handleFirstConnection();
}

/**
 * Starts the recording process by injecting the event recorder into the active tab.
 */
function startRecording(): Promise<void> {
    return new Promise((resolve, reject) => {
        console.log("start recording ....");
        injectEventRecorder()
            .then(() => { toggleRecordingState.isRecording = RecState.ON; resolve(); })
            .catch(err => reject(err));
    });
}

stopRecording = () => (
    new Promise((resolve, reject) => {
        console.log("Stop recording ....");
        ejectEventRecorder();
        const id = chrome.runtime.id;
        chrome.runtime.reload();
        chrome.webNavigation.onDOMContentLoaded.removeListener(injectEventRecorder);
        chrome.webNavigation.onCommitted.removeListener(checkForBadNavigation);
        chrome.webNavigation.onBeforeNavigate.removeListener(ejectEventRecorder);
        // model.updateStatus(RecState.OFF)
        //     .then(() => {

        //         changeIconsOnRecState(RecState.OFF);
        //         resolve();
        //     })
        // .catch(err => reject(err));

        toggleRecordingState.isRecording = RecState.OFF;
        session.activePort = null;
        session.originalHost = null;
    })
);

/**
 * Clears localstorage and resets recording status; clears last URL.
 */
function resetRecording(): Promise<void> {
    return new Promise((resolve, reject) => {
        session.lastURL = '';
        model.reset()
            .then(() => resolve())
            .catch(err => {
                reject(err);
            });
    });
}

/**
 * Performs necessary cleanup between sessions, while allowing for persistent data storage.
 */
function cleanUp(): Promise<void> {
    return new Promise((resolve, reject) => {
        ejectEventRecorder();
        chrome.browserAction.setIcon({ path: 'cypressconeICON.png' });
        model.setup()
            .then(() => resolve())
            .catch(err => reject(err));
    });
}

/**
 * Handles control messages sent from the view (popup) and conducts the appropriate actions.
 * @param action
 */
function handleControlAction(action: ControlAction): Promise<void> {
    return new Promise((resolve, reject) => {
        console.log("handleControlAction :", action);
        switch (action) {
            case ControlAction.START:
                startRecording()
                    .then(() => resolve())
                    .catch(err => reject(err));
                break;
            case ControlAction.STOP:
                stopRecording()
                    .then(() => resolve())
                    .catch(err => reject(err));
                break;
            case ControlAction.RESET:
                resetRecording()
                    .then(() => resolve())
                    .catch(err => reject(err));
                break;
            default:
                reject(new Error(`Invalid action: ${action}`));
        }
    });
}

/**
 * Handles all actions coming from the view(popup).
 * @param type
 * @param payload
 */
function handleMessage({ type, payload }: ActionMessage): Promise<void> {
    return new Promise((resolve, reject) => {
        handleControlAction(type)
            .then(() => resolve())
            .catch(err => reject(err));
    });
}

/**
 * Handles control actions coming from keyboard shortcuts.
 * @param command
 */
function handleQuickKeys(command: string): Promise<void> {
    return new Promise((resolve, reject) => {
        let action: ControlAction;
        if (command === 'start-recording') {
            if (model.status === RecState.OFF) action = ControlAction.START;
            else if (model.status === RecState.ON) action = ControlAction.STOP;
        }

        if (action) {
            handleControlAction(action)
                .then(() => {
                    chrome.runtime.sendMessage({ type: action });
                    resolve();
                })
                .catch(err => reject(new Error(err)));
        }
    });
}

// chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
//     console.log("Request :", request);
//     console.log("Sender :", sender);
//     if (request.message == 'local_request') {
// Create a new tab with options page
// chrome.windows.create({
//     focused: true,
//     incognito: true,
//     state: "maximized",
//     url: 'https://dev.pickcel.com'
// }, function (tab) {
//     console.log(tab);

// });

//     }
// });

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.message == 'local_request') {
        // if(onStart) { onStart = false; return; };
        let action: ControlAction;
        if (model.status === RecState.OFF) action = ControlAction.START;
        else if (model.status === RecState.ON) action = ControlAction.STOP;
        else action = ControlAction.STOP;

        if (action) {
            console.log(action);

            handleControlAction(action)
                .then(() => {
                    chrome.runtime.sendMessage({ type: action });
                })
                .catch(err => console.log("Error at local request ", err));
        } else {
            stopRecording();
        }

        sendResponse({ success: true, action: action });
    };
});

function initialize(): void {
    chrome.runtime.onConnect.addListener(handleNewConnection);
    chrome.runtime.onMessage.addListener(message => control(handleMessage, message));
    // chrome.commands.onCommand.addListener(command => control(handleQuickKeys, command));
    control(cleanUp);
};

initialize();


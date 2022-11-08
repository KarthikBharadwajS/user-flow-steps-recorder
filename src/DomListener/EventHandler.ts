import { EventType } from "../Constants/enum";
import finder from '@medv/finder';
import { getPattern } from "../helpers/pattern";
import { MatchPattern } from "../Constants/enum";
import { ParsedEvent } from "../__typedefs";
import getXPath from 'get-xpath';

let port: chrome.runtime.Port;

/**
 * Parses DOM events into an object with the necessary data.
 * @param event
 * @returns {ParsedEvent}
 */
 function parseEvent(event: Event): Promise<ParsedEvent> {
    return new Promise((resolve, reject) => {
        let selector: string;
        getPattern()
            .then((pattern) => {
                if (pattern === MatchPattern.XPATH) {
                    selector = getXPath(event.target as Element);
                } else if ((event.target as Element).hasAttribute('data-cy')) {
                    selector = `[data-cy=${(event.target as Element).getAttribute('data-cy')}]`;
                } else if ((event.target as Element).hasAttribute('data-test')) {
                    selector = `[data-test=${(event.target as Element).getAttribute('data-test')}]`;
                } else if ((event.target as Element).hasAttribute('data-testid')) {
                    selector = `[data-testid=${(event.target as Element).getAttribute('data-testid')}]`;
                } else {
                    selector = finder(event.target as Element, { attr: (name, value) => name === 'data-cy' || name === 'data-test' || name === 'data-testid' });
                }
                const parsedEvent: ParsedEvent = {
                    selector,
                    action: event.type,
                    tag: (event.target as Element).tagName,
                    value: (event.target as HTMLInputElement).value,
                };
                if ((event.target as HTMLAnchorElement).hasAttribute('href')) parsedEvent.href = (event.target as HTMLAnchorElement).href;
                if ((event.target as Element).hasAttribute('id')) parsedEvent.id = (event.target as Element).id;
                if (parsedEvent.tag === 'INPUT') parsedEvent.inputType = (event.target as HTMLInputElement).type;
                if (event.type === 'keydown') parsedEvent.key = (event as KeyboardEvent).key;
                resolve(parsedEvent);
            })
            .catch(err => {
                reject(err);
            });
    });
}

/**
 * Checks if DOM event was triggered by user; if so, it calls parseEvent on the data.
 * @param event
 */
async function handleEvent(event: Event): Promise<void> {
    console.log("event :", event);
    if (event.isTrusted === true) {
        try {
            port.postMessage(await parseEvent(event));
        } catch (error) {
            throw new Error(error);
        }
    }
}

/**
 * Adds event listeners to the DOM.
 */
export function addDOMListeners(): void {
    console.log("AddDomListeners :", EventType);
    try {
        Object.values(EventType).forEach(event => {
            document.addEventListener(event, handleEvent, {
                capture: true,
                passive: true,
            });
        });
    } catch (error) {
        console.log("Error at addDomListeners :", error);
    }
}

/**
 * Removes event listeners from the DOM.
 */
export function removeDOMListeners(): void {
    Object.values(EventType).forEach(event => {
        document.removeEventListener(event, handleEvent, { capture: true });
    });
}

/**
 * Initializes the event recorder.
 */
(function init(): void {
    port = chrome.runtime.connect({ name: window.location.hostname });
    port.onDisconnect.addListener(removeDOMListeners); addDOMListeners();
})();

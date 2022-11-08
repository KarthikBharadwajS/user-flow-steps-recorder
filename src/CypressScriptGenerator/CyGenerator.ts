/**
 * Generates the Cypress code that will simulate the recorded user session.
 *
 * Each time the user records, this function will generate a cy.visit command that will
 * store the current url, as well each subsequent user interaction with the browser.
 */

import { ParsedEvent } from "../__typedefs";
import { EventType } from "../Constants/enum";
import { getPatternMethod } from "../helpers/pattern";

/**
 * Helper functions that handles click events.
 * @param event click event
 * @returns Promise<string>
 */
function handleClick(event: ParsedEvent): Promise<string> {
    return new Promise((resolve, reject) => {
        getPatternMethod()
            .then((method) => resolve(`cy.${method}('${event.selector}').click();`))
            .catch(err => {
                reject(err);
            });
    });
}

/**
 * Helper functions that handles keyboard events.
 * @param event keyDown events
 * @returns Promise<string | null>
 */
function handleKeydown(event: ParsedEvent): Promise<string | null> {
    return new Promise((resolve, reject) => {
        getPatternMethod()
            .then((method) => {
                switch (event.key) {
                    case 'Backspace':
                        resolve(`cy.${method}('${event.selector}').type('{backspace}');`);
                    case 'Escape':
                        resolve(`cy.${method}('${event.selector}').type('{esc}');`);
                    case 'ArrowUp':
                        resolve(`cy.${method}('${event.selector}').type('{uparrow}');`);
                    case 'ArrowRight':
                        resolve(`cy.${method}('${event.selector}').type('{rightarrow}');`);
                    case 'ArrowDown':
                        resolve(`cy.${method}('${event.selector}').type('{downarrow}');`);
                    case 'ArrowLeft':
                        resolve(`cy.${method}('${event.selector}').type('{leftarrow}');`);
                    default:
                        resolve(null);
                }
            })
            .catch(err => {
                reject(err);
            });
    });
}

/**
 * Helper function that handles change events.
 * @param event change event
 * @returns Promise<string>
 */
function handleChange(event: ParsedEvent): Promise<string> {
    return new Promise((resolve, reject) => {
        getPatternMethod()
            .then((method) => {
                if (event.inputType === 'checkbox' || event.inputType === 'radio') resolve(null);
                resolve(`cy.${method}('${event.selector}').type('${event.value.replace(/'/g, "\\'")}');`);
            })
            .catch(err => {
                reject(err);
            });
    });
}

/**
 * Helper function that handles double click events.
 * @param event click event
 * @returns Promise<string>
 */
function handleDoubleclick(event: ParsedEvent): Promise<string> {
    return new Promise((resolve, reject) => {
        getPatternMethod()
            .then((method) => {
                resolve(`cy.${method}('${event.selector}').dblclick();`);
            })
            .catch(err => {
                reject(err);
            });
    });
}

/**
 * Helper function that handles submit events.
 * @param event submit event
 * @returns Promise<string>
 */
function handleSubmit(event: ParsedEvent): Promise<string> {
    return new Promise((resolve, reject) => {
        getPatternMethod()
            .then((method) => {
                resolve(`cy.${method}('${event.selector}').submit();`);
            })
            .catch(err => {
                reject(err);
            });
    });
}

/**
 * Helper function to build cypress url script
 * @param url url as a string
 * @returns cy url script
 */
function handleUrl(url: string): string {
    const { origin, pathname } = new URL(url);
    return `cy.url().should('contains', '${origin + pathname}');`;
}

/**
 * Helper function to build cypress event script
 * @param event interaction events
 * @returns promise of cy event script
 */
const eventHandler = (event: ParsedEvent): Promise<string> => {
    switch (event.action) {
        case EventType.CLICK:
            return handleClick(event);
        case EventType.KEYDOWN:
            return handleKeydown(event);
        case EventType.CHANGE:
            return handleChange(event);
        case EventType.DBLCLICK:
            return handleDoubleclick(event);
        case EventType.SUBMIT:
            return handleSubmit(event);
        default:
            throw new Error(`Unhandled event: ${event.action}`);
    }
}

/**
 * on Connection handler
 * @param url url as string
 * @returns visiter script
 */
const connectionHandler = (url: string): string => `cy.visit('${url}');`;

/**
 * on navigation handler
 * @param url navigation url
 * @returns navigation script
 */
const navigationHandler = (url: string): string => handleUrl(url);

export default {
    onEventGen: eventHandler,
    onConnectionGen: connectionHandler,
    onNavigationGen: navigationHandler,
};
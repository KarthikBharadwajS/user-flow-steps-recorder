import { Script, ScriptResolver } from "../__typedefs";
import { nanoid as generate } from "nanoid";
import { RecState } from "./enum";
import { changeIconsOnRecState } from "../helpers/iconHandler";

class Background {

    status: RecState;

    scripts: Array<Script>;

    constructor() {
        this.setup();
    };

    /**
     * Setup the model
     * @returns void
     */
    setup(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
            else {
                this.status = RecState.OFF;
                this.scripts = [];

                resolve(void 0);
            }
        });
    }

    /**
     * Resets application to original state.
     */
    reset(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.status = RecState.OFF;
            this.scripts = [];

            resolve(void 0);
        });
    }

    /**
     * Adds a script to the array of code blocks
     * @param script
     */
    pushScript(script: string): Promise<ScriptResolver> {
        return new Promise((resolve, reject) => {
            const newScript: Script = {
                value: script,
                id: generate(),
            };
            this.scripts.push(newScript);

            resolve({ success: true, data: newScript, message: "ok" });
        });
    }

    /**
     * Deletes a script from the code display
     * @param index
     */
    deleteScript(index: number): Promise<void> {
        return new Promise((resolve, reject) => {
            this.scripts.splice(index, 1);
            resolve(void 0);
        });
    }

    /**
     * Removes the last script which has generated extra click
     */
    doubleClickHandler(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.scripts.splice(this.scripts.length - 2, 2);
            resolve(void 0);
        });
    }

    /**
     * Updates the recording status and sends to the background.
     * @param newStatus
     */
    updateStatus(newStatus: RecState): Promise<void> {
        return new Promise((resolve, reject) => {
            this.status = newStatus;
            changeIconsOnRecState(newStatus);
            resolve(void 0);
        });
    }
};

export default new Background();
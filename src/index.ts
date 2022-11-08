import { RecState } from "./Constants/enum";

document.getElementById("CaptureNow").addEventListener("click", function (event) {
    chrome.runtime.sendMessage({ message: 'local_request' }, function (response) {
        /* callback */
        console.log("response :", response);

        const action: RecState = response.action;

        if(action === RecState.ON) {
            document.getElementById("CaptureNow").innerText = "Stop Recording";
        } else {
            document.getElementById("CaptureNow").innerText = "Start Recording";
        }
    });
});

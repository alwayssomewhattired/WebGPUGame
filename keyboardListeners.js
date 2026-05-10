
import { getRayVerticesBuffer } from "./ray.js";

export let toggleFPSMode = false;

export const keyboardInput = {
    w: false,
    a: false,
    s: false,
    d: false,
    e: false,
    r: false,
    b: false,
};

window.addEventListener("keydown", (event) => {
    switch (event.code) {
        case "KeyW": keyboardInput.w = true; break;
        case "KeyA": keyboardInput.a = true; break;
        case "KeyS": keyboardInput.s = true; break;
        case "KeyD": keyboardInput.d = true; break;
        
        case "KeyE": {
            keyboardInput.e = true;
            toggleFPSMode = !toggleFPSMode;
            if (toggleFPSMode) {
                document.exitPointerLock();
            } else {
                canvas.requestPointerLock();
            }
            break;
        };
        
        // | toggles
        case "KeyR": keyboardInput.r = !keyboardInput.r; break;
        case "KeyB": {
            keyboardInput.b = !keyboardInput.b;

            if (!keyboardInput.b) {
                for (let buffer of getRayVerticesBuffer()) buffer.destroy();
                getRayVerticesBuffer().length = 0;
            }
            
            break;
        }
    }
});

window.addEventListener("keyup", (event) => {
    switch (event.code) {
        case "KeyW": keyboardInput.w = false; break;
        case "KeyA": keyboardInput.a = false; break;
        case "KeyS": keyboardInput.s = false; break;
        case "KeyD": keyboardInput.d = false; break;
        case "KeyE": keyboardInput.e = false; break;

    }
});
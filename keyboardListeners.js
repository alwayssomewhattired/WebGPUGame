
import { updateDebugLightBuffer, updateDirectionLightBuffer, updatePointLightBuffer } from "./light.js";
import { getRayVerticesBuffer } from "./ray.js";

export let toggleFPSMode = false;
export let toggleDebugNormals = false;
export let togglePointLights = false;
export let toggleDirectionLight = false;
export let toggleRegularColor = true;
export let toggleNormalColor = false;

export const keyboardInput = {
    w: false,
    a: false,
    s: false,
    d: false,
    e: false,
    r: false,
    b: false,
    n: false,
    p: false,
    l: false,
    c: true,
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
        case "KeyN": {
            keyboardInput.n = !keyboardInput.n;
            toggleDebugNormals = keyboardInput.n;
        }
        case "KeyP": {
            keyboardInput.p = !keyboardInput.p;
            togglePointLights = keyboardInput.p;
            updatePointLightBuffer(new Float32Array([-1, 5, 10, togglePointLights]));
        }
        case "KeyL": {
            keyboardInput.l = !keyboardInput.l;
            toggleDirectionLight = keyboardInput.l;
            updateDirectionLightBuffer(new Float32Array([-1.0, -1.0, -1.0, toggleDirectionLight]));
        }
        case "KeyC": {
            keyboardInput.c = !keyboardInput.c;
            toggleRegularColor = keyboardInput.c;
            updateDebugLightBuffer(new Float32Array([toggleNormalColor, toggleRegularColor]));
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
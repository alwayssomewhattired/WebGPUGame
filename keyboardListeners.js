
export const keyboardInput = {
    w: false,
    a: false,
    s: false,
    d: false
};

window.addEventListener("keydown", (e) => {
    switch (e.code) {
        case "KeyW": keyboardInput.w = true; break;
        case "KeyA": keyboardInput.a = true; break;
        case "KeyS": keyboardInput.s = true; break;
        case "KeyD": keyboardInput.d = true; break;

    }
});

window.addEventListener("keyup", (e) => {
    switch (e.code) {
        case "KeyW": keyboardInput.w = false; break;
        case "KeyA": keyboardInput.a = false; break;
        case "KeyS": keyboardInput.s = false; break;
        case "KeyD": keyboardInput.d = false; break;

    }
});
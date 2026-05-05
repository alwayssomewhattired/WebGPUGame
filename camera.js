
import * as glMatrix from 'gl-matrix'
import { toggleFPSMode } from './keyboardListeners.js';

const camera = {
    position: [0, 1.6, 5],
    yaw: -Math.PI / 2,
    pitch: 0,
    speed: 10.0,
    sensitivity: 0.002
};

function getForward() {
    const x = Math.cos(camera.pitch) * Math.cos(camera.yaw);
    const y = Math.sin(camera.pitch);
    const z = Math.cos(camera.pitch) * Math.sin(camera.yaw);
    let forward = glMatrix.vec3.create();
    return glMatrix.vec3.normalize(forward, [x, y, z]);
}

function getRight(forward) {
    let cross = glMatrix.vec3.create();
    glMatrix.vec3.cross(cross, forward, [0, 1, 0]);
    glMatrix.vec3.normalize(cross, cross);
    return cross;
}

function getUp(right, forward) {
    return cross(right, forward);
}

export function updateViewTransform(view) {
    const forward = getForward();
    let target = glMatrix.vec3.create()
    glMatrix.vec3.add(target, camera.position, forward);
    const up = glMatrix.vec3.fromValues(0, 1, 0);
    view = glMatrix.mat4.lookAt(view, camera.position, target, up);
    return view;
}

export function updatePosition(input, dt) {
    let forward = getForward();
    let right = getRight(forward);

    const velocity = camera.speed * dt;
    let momentum = glMatrix.vec3.create();

    if (input.w)  {
        glMatrix.vec3.scale(momentum, forward, velocity)
        camera.position = glMatrix.vec3.add(camera.position, camera.position, momentum);
    }
    if (input.a) {
        glMatrix.vec3.scale(momentum, right, -velocity);
        camera.position = glMatrix.vec3.add(camera.position, camera.position, momentum);
    }
    if (input.s) {
        glMatrix.vec3.scale(momentum, forward, -velocity);
        camera.position = glMatrix.vec3.add(camera.position, camera.position, momentum);

    }
    if (input.d) {
        glMatrix.vec3.scale(momentum, right, velocity);
        camera.position = glMatrix.vec3.add(camera.position, camera.position, momentum);
    }
}

export function initMouse() {

    document.addEventListener("mousemove", (e) => {
        if (document.pointerLockElement === canvas) {
            camera.yaw += e.movementX * camera.sensitivity;
            camera.pitch -= e.movementY * camera.sensitivity;

            const maxPitch = Math.PI / 2 - 0.01;
            if (camera.pitch > maxPitch) camera.pitch = maxPitch;
            if (camera.pitch < -maxPitch) camera.pitch = -maxPitch;

            camera.yaw = camera.yaw % (Math.PI * 2);
        }
    })
}
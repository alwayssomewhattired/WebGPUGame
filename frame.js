

import * as glMatrix from 'gl-matrix'
import { getDevice } from "./webgpu.js";
import { getModelMatrixUBO, getViewMatrixUBO } from './uniform.js';
import { updateMouse, updatePosition, updateViewTransform } from './camera.js';
import { keyboardInput } from "./keyboardListeners.js";
import { render } from './renderer.js';


let m_lastTime = 0;
let m_angle = 0;


export function frame(time) {
    // console.log(time);
    const device = getDevice();
    const deltaTime = (time - m_lastTime) / 1000;
    m_lastTime = time;
    updateAngle(deltaTime);

    const modelMatrix = glMatrix.mat4.create();    
    glMatrix.mat4.rotateX(modelMatrix, modelMatrix, 0.5);
    glMatrix.mat4.rotateY(modelMatrix, modelMatrix, m_angle);
    // glMatrix.mat4.rotateY(modelMatrix, modelMatrix, 0.);
    const scalingVector = glMatrix.vec3.fromValues(0.5, 0.5, 0.5);
    glMatrix.mat4.scale(modelMatrix, modelMatrix, scalingVector);
    device.queue.writeBuffer(getModelMatrixUBO(), 0, modelMatrix);

    const viewMatrix = glMatrix.mat4.create();
    updateViewTransform(viewMatrix);
    updatePosition(keyboardInput, deltaTime);
    updateMouse();
    device.queue.writeBuffer(getViewMatrixUBO(), 0, viewMatrix)

    render();

    requestAnimationFrame(frame);
}

function updateAngle(deltaTime) {
    m_angle += deltaTime;
}
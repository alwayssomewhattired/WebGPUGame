

import * as glMatrix from 'gl-matrix'
import { getDevice } from "./webgpu.js";
import { getGlobalModelMatrixUBO, getViewMatrixUBO } from './uniform.js';
import { updatePosition, updateViewTransform } from './camera.js';
import { keyboardInput } from "./keyboardListeners.js";
import { render } from './renderer.js';


let m_lastTime = 0;
let m_angle = 0;
let m_viewMatrix = glMatrix.mat4.create();


export function frame(time) {
    const device = getDevice();
    const deltaTime = (time - m_lastTime) / 1000;
    m_lastTime = time;
    updateAngle(deltaTime);

    const modelMatrix = glMatrix.mat4.create();    
    glMatrix.mat4.translate(modelMatrix, modelMatrix, glMatrix.vec3.fromValues(0.0, 0.0, -10.0));

    glMatrix.mat4.rotateY(modelMatrix, modelMatrix, m_angle);

    const scalingVector = glMatrix.vec3.fromValues(0.2, 0.2, 0.2);
    glMatrix.mat4.scale(modelMatrix, modelMatrix, scalingVector);

    device.queue.writeBuffer(getGlobalModelMatrixUBO(), 0, modelMatrix);

    updateViewTransform(m_viewMatrix);
    updatePosition(keyboardInput, deltaTime);

    device.queue.writeBuffer(getViewMatrixUBO(), 0, m_viewMatrix)

    render();

    requestAnimationFrame(frame);
}

function updateAngle(deltaTime) {
    m_angle += deltaTime;
}
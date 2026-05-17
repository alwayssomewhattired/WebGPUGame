

import * as glMatrix from 'gl-matrix'
import { getDevice } from "./webgpu.js";
import { getDynamicModelMatrixUBO, getViewMatrixUBO } from './uniform.js';
import { updatePosition, updateViewTransform } from './camera.js';
import { keyboardInput } from "./keyboardListeners.js";
import { render } from './renderer.js';
import { getViewMatrix } from './matrix.js';


let m_lastTime = 0;
let m_angle = 0;

export function frame(time) {
    const modelMatrix = glMatrix.mat4.create();
    const viewMatrix = glMatrix.mat4.create();
    const device = getDevice();
    const deltaTime = (time - m_lastTime) / 1000;
    m_lastTime = time;

    
    if (!keyboardInput.r) m_angle = 0;
    else updateAngle(deltaTime);
    

    glMatrix.mat4.translate(modelMatrix, modelMatrix, glMatrix.vec3.fromValues(0.0, 0.0, -10.0));

    glMatrix.mat4.rotateY(modelMatrix, modelMatrix, m_angle);

    const scalingVector = glMatrix.vec3.fromValues(0.2, 0.2, 0.2);
    glMatrix.mat4.scale(modelMatrix, modelMatrix, scalingVector);

    device.queue.writeBuffer(getDynamicModelMatrixUBO(), 0, modelMatrix);

    updateViewTransform(viewMatrix);
    updatePosition(keyboardInput, deltaTime);

    device.queue.writeBuffer(getViewMatrixUBO(), 0, viewMatrix)

    render();

    requestAnimationFrame(frame);
}

function updateAngle(deltaTime) {
    m_angle += deltaTime;
}

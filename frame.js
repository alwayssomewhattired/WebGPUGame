

import * as glMatrix from 'gl-matrix'
import { getDevice } from "./Renderer/webgpu.js";
import { getMegaMatrixUBO, getViewMatrixUBO } from './Renderer/uniform.js';
import { updatePosition, updateViewTransform } from './SceneLogic/camera.js';
import { keyboardInput } from "./keyboardListeners.js";
import { render } from './Renderer/renderer.js';
import { getViewMatrix } from './SceneLogic/matrix.js';
import { getAlignedSize } from './Renderer/buffer.js';
import { updateMeter } from '../ZachAudio/GainMeter.js';


let m_lastTime = 0;
let m_angle = 0;

export function frame(time) {

    // webaudioapi

    updateMeter();







    // webgpu

    const modelMatrix = glMatrix.mat4.create();
    const viewMatrix = glMatrix.mat4.create();
    const device = getDevice();
    const deltaTime = (time - m_lastTime) / 1000;
    m_lastTime = time;
    const alignedSize = getAlignedSize(64);
    
    if (!keyboardInput.r) {
        m_angle = 0;
    }
    else {
        updateAngle(deltaTime);
        glMatrix.mat4.translate(modelMatrix, modelMatrix, glMatrix.vec3.fromValues(0.0, 0.0, -10.0));
        glMatrix.mat4.rotateY(modelMatrix, modelMatrix, m_angle);
        const scalingVector = glMatrix.vec3.fromValues(0.2, 0.2, 0.2);
        glMatrix.mat4.scale(modelMatrix, modelMatrix, scalingVector);
        device.queue.writeBuffer(getMegaMatrixUBO(), alignedSize, modelMatrix);
    }

    updateViewTransform(viewMatrix);
    updatePosition(keyboardInput, deltaTime);

    device.queue.writeBuffer(getViewMatrixUBO(), 0, viewMatrix)

    render();

    requestAnimationFrame(frame);
}

function updateAngle(deltaTime) {
    m_angle += deltaTime;
}

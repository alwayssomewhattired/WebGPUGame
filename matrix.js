
import * as glMatrix from 'gl-matrix'
import { createGPUBuffer } from './buffer.js';
import { getDevice } from './webgpu.js';

const m_globalModelMatrices = [];

const m_globalModelMatrixGPUBuffers = [];

let m_viewMatrix = null;
let m_inverseModelMatrix = null;
let m_modelViewMatrix = null;
let m_projectionMatrix = null;
let m_normalMatrix = null;

export function getModelMatrix(index) {
    const modelMatrix = m_globalModelMatrices[index];
    if (!modelMatrix) throw new Error("model matrix is null!");

    return modelMatrix;
}

export function getModelMatrixGPUBuffer(index) {
    const modelMatrix = m_globalModelMatrixGPUBuffers[index];
    if (!modelMatrix) throw new Error("model matrix is null!");

    return modelMatrix;
}

export function getGlobalModelMatricesLength() { 
    return m_globalModelMatrices.length;
}

export function createModelMatrix() {
    const modelMatrix = glMatrix.mat4.create();
    m_globalModelMatrices.push(modelMatrix);
    const modelMatrixBuffer = createGPUBuffer(getDevice(), modelMatrix, modelMatrix.byteLength, GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST)
    // getDevice().queue.writeBuffer(m_dynamicModelMatrixGPUBuffer,  )  
    m_globalModelMatrixGPUBuffers.push(modelMatrixBuffer);
    return modelMatrix;
}

export function updateModelMatrix(entity) {
    const modelMatrix = m_globalModelMatrices[entity.modelMatrixIdx];
    if (!modelMatrix) throw new Error("model matrix is null!");
    glMatrix.mat4.identity(modelMatrix);
    glMatrix.mat4.translate(modelMatrix, modelMatrix, entity.translation);
    glMatrix.mat4.rotateX(modelMatrix, modelMatrix, entity.rotation[0]);
    glMatrix.mat4.rotateY(modelMatrix, modelMatrix, entity.rotation[1]);
    glMatrix.mat4.rotateZ(modelMatrix, modelMatrix, entity.rotation[2]);
    glMatrix.mat4.scale(modelMatrix, modelMatrix, entity.scale);
}

export function getModelMatrixDynamicGPUBuffer() {
    if (!m_modelMatrixDynamicGPUBuffer) {
        throw new Error("Model MatrixDynamic GPU Buffer is null!!");
    }
    
    return m_modelMatrixDynamicGPUBuffer;
}

export function createModelMatrixDynamicBuffer(buffer, alignedSize) {
    m_modelMatrixDynamicGPUBuffer = createGPUBuffer(getDevice(), m_, alignedSize, GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST); 
}

export function getViewMatrix() {
    if (!m_viewMatrix) {
        m_viewMatrix = glMatrix.mat4.create();
        glMatrix.mat4.lookAt(
            m_viewMatrix,
            glMatrix.vec3.fromValues(20, 20, 20), // eye
            glMatrix.vec3.fromValues(0,0,0),      // center
            glMatrix.vec3.fromValues(0, 0, 1.0)  // up
        );
    }

    return m_viewMatrix;
}

export function setViewMatrix(viewMatrix) {
    m_viewMatrix = viewMatrix
}

export function getProjectionMatrix() {
    if (!m_projectionMatrix) {
       m_projectionMatrix = glMatrix.mat4.create();
       glMatrix.mat4.perspective(
           m_projectionMatrix,
           1.0,
           1500.0 / 700.0,
           0.1,
           1000.0
       );
    }

     return m_projectionMatrix;
}

export function getViewProjectionMatrix() {
    const viewProjectionMatrix = glMatrix.mat4.create();
    glMatrix.mat4.multiply(viewProjectionMatrix, m_projectionMatrix, m_viewMatrix);

    return viewProjectionMatrix;
}

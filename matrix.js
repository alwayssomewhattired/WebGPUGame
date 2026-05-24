
import * as glMatrix from 'gl-matrix'
import { createGPUBuffer } from './buffer.js';
import { getDevice } from './webgpu.js';

// 0: default-empty
// PER-ENTITY
// 1: model matrix
// 2: aabbModelMatrix
// 3: axisArrowsModelMatrix
// 4: axisArrowsAABBModelMatrix
// 5: rotationArcModelIdx
// 6: rotationArcHeadModelIdx
// - TO-DO: make muthafuckin mega matrix buffer!!!!!!!!
const m_megaMatrixCPUBuffer = [];
// const m_megaMatrixCPUBuffer = []

// const m_globalModelViewMatrices = [];


let m_viewMatrix = null;
let m_inverseModelMatrix = null;
// let m_modelViewMatrix = null;
let m_projectionMatrix = null;
let m_normalMatrix = null;

// | pushes a default-empty model matrix 
export function initMegaMatrixCPUBuffer() {
    const modelMatrix = glMatrix.mat4.create();
    m_megaMatrixCPUBuffer.push(modelMatrix);
}

export function getMatrix(index) {
    const matrix = m_megaMatrixCPUBuffer[index];
    if (!matrix) throw new Error("matrix is null at index: " + index);

    return matrix;
}

// export function getModelViewMatrix(index) {
//     const modelViewMatrix = m_megaMatrixCPUBuffer[index];
//     if (!modelViewMatrix) throw new Error("modelView matrix is null at index: " + index);

//     return modelViewMatrix;
// }

export function getMegaMatrixCPUBufferLength() { 
    return m_megaMatrixCPUBuffer.length;
}

export function createAndStoreMatrix(modelMatrix) {
    m_megaMatrixCPUBuffer.push(modelMatrix);
    return modelMatrix;
}

export function updateMatrix(entity) {
    const modelMatrix = m_megaMatrixCPUBuffer[entity.modelMatrixIdx];
    const modelMatrix2 = m_megaMatrixCPUBuffer[entity.aabbModelIdx];
    const modelMatrix3 = m_megaMatrixCPUBuffer[entity.axisArrowsModelIdx];
    const modelMatrix4 = m_megaMatrixCPUBuffer[entity.axisArrowsAABBModelIdx];
    const modelMatrix5 = m_megaMatrixCPUBuffer[entity.rotationArcModelIdx];
    const modelMatrix6 = m_megaMatrixCPUBuffer[entity.rotationArcHeadModelIdx];
    const modelMatrix7 = m_megaMatrixCPUBuffer[entity.modelViewIdx];

    if (!modelMatrix) throw new Error("model matrix is null!");
    glMatrix.mat4.identity(modelMatrix);
    glMatrix.mat4.translate(modelMatrix, modelMatrix, entity.translation);
    glMatrix.mat4.rotateX(modelMatrix, modelMatrix, entity.rotation[0]);
    glMatrix.mat4.rotateY(modelMatrix, modelMatrix, entity.rotation[1]);
    glMatrix.mat4.rotateZ(modelMatrix, modelMatrix, entity.rotation[2]);
    glMatrix.mat4.scale(modelMatrix, modelMatrix, entity.scale);

    glMatrix.mat4.identity(modelMatrix2);
    glMatrix.mat4.translate(modelMatrix2, modelMatrix2, entity.translation);
    glMatrix.mat4.rotateX(modelMatrix2, modelMatrix2, entity.rotation[0]);
    glMatrix.mat4.rotateY(modelMatrix2, modelMatrix2, entity.rotation[1]);
    glMatrix.mat4.rotateZ(modelMatrix2, modelMatrix2, entity.rotation[2]);
    glMatrix.mat4.scale(modelMatrix2, modelMatrix2, entity.scale);

    glMatrix.mat4.identity(modelMatrix3);
    glMatrix.mat4.translate(modelMatrix3, modelMatrix3, entity.translation);

    glMatrix.mat4.identity(modelMatrix4);
    glMatrix.mat4.translate(modelMatrix4, modelMatrix4, entity.translation);
    glMatrix.mat4.rotateX(modelMatrix4, modelMatrix4, entity.rotation[0]);
    glMatrix.mat4.rotateY(modelMatrix4, modelMatrix4, entity.rotation[1]);
    glMatrix.mat4.rotateZ(modelMatrix4, modelMatrix4, entity.rotation[2]);
    glMatrix.mat4.scale(modelMatrix4, modelMatrix4, entity.scale);

    glMatrix.mat4.identity(modelMatrix5);
    glMatrix.mat4.translate(modelMatrix5, modelMatrix5, entity.translation);

    glMatrix.mat4.identity(modelMatrix6);
    glMatrix.mat4.translate(modelMatrix6, modelMatrix6, entity.translation);

    glMatrix.mat4.identity(modelMatrix7);
    glMatrix.mat4.translate(modelMatrix7, modelMatrix7, entity.translation);
    glMatrix.mat4.rotateX(modelMatrix7, modelMatrix7, entity.rotation[0]);
    glMatrix.mat4.rotateY(modelMatrix7, modelMatrix7, entity.rotation[1]);
    glMatrix.mat4.rotateZ(modelMatrix7, modelMatrix7, entity.rotation[2]);
    glMatrix.mat4.scale(modelMatrix7, modelMatrix7, entity.scale);

}

// export function getMegaMatrixDynamicGPUBuffer() {
//     if (!m_megaMatrixDynamicGPUBuffer) {
//         throw new Error("Model MatrixDynamic GPU Buffer is null!!");
//     }
    
//     return m_modelMatrixDynamicGPUBuffer;
// }

// export function createModelMatrixDynamicBuffer(buffer, alignedSize) {
//     m_modelMatrixDynamicGPUBuffer = createGPUBuffer(getDevice(), m_, alignedSize, GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST); 
// }

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

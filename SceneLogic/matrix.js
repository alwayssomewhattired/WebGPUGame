
import * as glMatrix from 'gl-matrix'
import { createGPUBuffer, updateDynamicGPUBuffer } from '../Renderer/buffer.js';
import { getDevice } from '../Renderer/webgpu.js';
import { getMegaMatrixUBO } from '../Renderer/uniform.js';
import { setCameraPos } from './camera.js';

// 0: default-empty
// PER-ENTITY
// 1: model matrix
// 2: aabbModelMatrix
// 3: axisArrowsModelMatrix
// 4: axisArrowsAABBModelMatrix
// 5: rotationArcModelIdx
// 6: rotationArcHeadModelIdx
// 7: modelViewIdx
const m_megaMatrixCPUBuffer = [];

let m_viewMatrix = null;
let m_inverseModelMatrix = null;
let m_projectionMatrix = null;
let m_normalMatrix = null;

// | pushes a default-empty model matrix 
export function initMegaMatrixCPUBuffer() {
    const modelMatrix = glMatrix.mat4.create();
    const lightPositionMatrix = 
    m_megaMatrixCPUBuffer.push(modelMatrix);
}

export function getMatrix(index) {
    const matrix = m_megaMatrixCPUBuffer[index];
    if (!matrix) throw new Error("matrix is null at index: " + index);

    return matrix;
}

export function getMegaMatrixCPUBufferLength() { 
    return m_megaMatrixCPUBuffer.length;
}

// returns current index
export function createAndStoreMatrix(modelMatrix) {
    m_megaMatrixCPUBuffer.push(modelMatrix);
    return m_megaMatrixCPUBuffer.length - 1; // subtract 1 because of debug matrix at index 0
}

export function updateMatrix(mesh) {

    const translation = mesh.getMeshTranslation();
    const rotation = mesh.getRotation();
    const scale = mesh.getScale();

    const modelMatrix = m_megaMatrixCPUBuffer[mesh.modelMatrixIdx];
    const modelMatrix2 = m_megaMatrixCPUBuffer[mesh.aabbModelIdx];
    const modelMatrix3 = m_megaMatrixCPUBuffer[mesh.axisArrowsModelIdx];
    const modelMatrix4 = m_megaMatrixCPUBuffer[mesh.axisArrowsAABBModelIdx];
    const modelMatrix5 = m_megaMatrixCPUBuffer[mesh.rotationArcModelIdx];
    const modelMatrix6 = m_megaMatrixCPUBuffer[mesh.rotationArcHeadModelIdx];
    const modelMatrix7 = m_megaMatrixCPUBuffer[mesh.modelViewIdx];
    const modelMatrix8 = m_megaMatrixCPUBuffer[mesh.normalMatrixIdx];
    // console.log(m_megaMatrixCPUBuffer.length);
    // console.log()

    if (!modelMatrix) throw new Error("model matrix is null!");
    glMatrix.mat4.identity(modelMatrix);
    glMatrix.mat4.translate(modelMatrix, modelMatrix, translation);
    glMatrix.mat4.rotateX(modelMatrix, modelMatrix, rotation[0]);
    glMatrix.mat4.rotateY(modelMatrix, modelMatrix, rotation[1]);
    glMatrix.mat4.rotateZ(modelMatrix, modelMatrix, rotation[2]);
    glMatrix.mat4.scale(modelMatrix, modelMatrix, scale);

    glMatrix.mat4.identity(modelMatrix2);
    glMatrix.mat4.translate(modelMatrix2, modelMatrix2, translation);
    glMatrix.mat4.rotateX(modelMatrix2, modelMatrix2, rotation[0]);
    glMatrix.mat4.rotateY(modelMatrix2, modelMatrix2, rotation[1]);
    glMatrix.mat4.rotateZ(modelMatrix2, modelMatrix2, rotation[2]);
    glMatrix.mat4.scale(modelMatrix2, modelMatrix2, scale);

    glMatrix.mat4.identity(modelMatrix3);
    glMatrix.mat4.translate(modelMatrix3, modelMatrix3, translation);

    glMatrix.mat4.identity(modelMatrix4);
    glMatrix.mat4.translate(modelMatrix4, modelMatrix4, translation);
    glMatrix.mat4.rotateX(modelMatrix4, modelMatrix4, rotation[0]);
    glMatrix.mat4.rotateY(modelMatrix4, modelMatrix4, rotation[1]);
    glMatrix.mat4.rotateZ(modelMatrix4, modelMatrix4, rotation[2]);

    glMatrix.mat4.identity(modelMatrix5);
    glMatrix.mat4.translate(modelMatrix5, modelMatrix5, translation);

    glMatrix.mat4.identity(modelMatrix6);
    glMatrix.mat4.translate(modelMatrix6, modelMatrix6, translation);

    glMatrix.mat4.identity(modelMatrix7);
    glMatrix.mat4.translate(modelMatrix7, modelMatrix7, translation);
    glMatrix.mat4.rotateX(modelMatrix7, modelMatrix7, rotation[0]);
    glMatrix.mat4.rotateY(modelMatrix7, modelMatrix7, rotation[1]);
    glMatrix.mat4.rotateZ(modelMatrix7, modelMatrix7, rotation[2]);
    glMatrix.mat4.scale(modelMatrix7, modelMatrix7, scale);

    glMatrix.mat4.identity(modelMatrix8);
    glMatrix.mat4.translate(modelMatrix8, modelMatrix8, translation);
    glMatrix.mat4.rotateX(modelMatrix8, modelMatrix8, rotation[0]);
    glMatrix.mat4.rotateY(modelMatrix8, modelMatrix8, rotation[1]);
    glMatrix.mat4.rotateZ(modelMatrix8, modelMatrix8, rotation[2]);
    glMatrix.mat4.scale(modelMatrix8, modelMatrix8, scale);

    updateDynamicGPUBuffer(mesh, getMegaMatrixUBO())

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
    m_viewMatrix = viewMatrix;
    const invView = glMatrix.mat4.create();
    glMatrix.mat4.invert(invView, viewMatrix);
    const invViewPos = glMatrix.vec3.create();
    setCameraPos(glMatrix.vec3.transformMat4(invViewPos, invViewPos, invView));
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

// export function getGLArray(linearArray, glVertexStruct, stride) {
//     const cpuBuffer = [];
//     const basicVertexStruct = [];
//     for (let i = 0; i < linearArray.length; i += stride) {
//         // for (let j = i; j < (i + stride); j++) {
//         //     basicVertexStruct.push(linearArray[j]);
//         // }

        

//         glVertexStruct.copy(basicVertexStruct);
//         cpuBuffer.push(glVertexStruct);
//         console.log(cpuBuffer);
//         // vertexStruct.length = 0;
//         basicVertexStruct.length = 0;
//     }

//     return cpuBuffer;
// }
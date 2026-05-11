
import * as glMatrix from 'gl-matrix'

const m_globalModelMatrices = [];

let m_modelMatrix = null
let m_viewMatrix = null;
let m_inverseModelMatrix = null;
let m_modelViewMatrix = null;
let m_projectionMatrix = null;
let m_normalMatrix = null;

export function getModelMatrix(index) {
    const modelMatrix = m_globalModelMatrices[index];
    if (!modelMatrix) {
        modelMatrix = glMatrix.mat4.create();
        m_globalModelMatrix.push(modelMatrix);
    }

    return modelMatrix;
}

export function updateModelMatrix(entity) {
    const modelMatrix = m_globalModelMatrices[entity.modelMatrixID];
    if (!modelMatrix) {
        modelMatrix = glMatrix.mat4.create();
        m_globalModelMatrix.push(modelMatrix);
    }

    glMatrix.mat4.identity(modelMatrix);
    glMatrix.mat4.translate(modelMatrix, modelMatrix, entity.translation);
    glMatrix.mat4.rotateX(modelMatrix, modelMatrix, entity.rotation[0]);
    glMatrix.mat4.rotateY(modelMatrix, modelMatrix, entity.rotation[1]);
    glMatrix.mat4.rotateZ(modelMatrix, modelMatrix, entity.rotation[2]);
    glMatrix.mat4.scale(modelMatrix, modelMatrix, entity.scale);
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

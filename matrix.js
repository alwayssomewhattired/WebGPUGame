
import * as glMatrix from 'gl-matrix'

let m_modelMatrix = null
let m_viewMatrix = null;
let m_inverseModelMatrix = null;
let m_modelViewMatrix = null;
let m_projectionMatrix = null;
let m_viewProjectionMatrix = null;
let m_normalMatrix = null;

export function getModelMatrix() {
    if (!m_modelMatrix) {
        m_modelMatrix = glMatrix.mat4.create();
    }

    return m_modelMatrix;
}

// export function getInverseModelMatrix() {
//     if (!m_inverseModelMatrix) {
//         m_inverseModelMatrix = glMatrix.mat4.create();
//         glMatrix.mat4.invert(m_inverseModelMatrix, m_modelMatrix);
//     }

//     return m_inverseModelMatrix;
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

// export function getModelViewMatrix() {
//     if (!m_modelViewMatrix) {
//         m_modelViewMatrix = glMatrix.mat4.create();
//         glMatrix.mat4.multiply(m_modelViewMatrix, m_modelMatrix, m_viewMatrix);
//     }

//     return m_modelViewMatrix;
// }

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
    if (!m_viewProjectionMatrix) {
        m_viewProjectionMatrix = glMatrix.mat4.create();
        glMatrix.mat4.multiply(m_viewProjectionMatrix, m_viewMatrix, m_projectionMatrix);
    }

    return m_viewProjectionMatrix;
}

// export function getNormalMatrix() {
//     if (!m_normalMatrix) {
//         m_normalMatrix = glMatrix.mat4.create();
//         glMatrix.mat4.invert(m_normalMatrix, m_modelViewMatrix);
//         glMatrix.mat4.transpose(m_normalMatrix, m_normalMatrix);
//     }

//     return m_normalMatrix;
// }

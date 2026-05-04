
import OBJFile from './node_modules/obj-file-parser/dist/OBJFile.js';
import * as glMatrix from 'gl-matrix';

import { Mesh } from "./mesh.js";

// let m_positionBuffer = null;
// let m_indexBuffer = null;
// let m_indexBufferSize = null;
// let m_normalBuffer = null;

export function createGPUBuffer(device, buffer, bufferBytes, usage) {
    const bufferDesc = {
        size: bufferBytes,
        usage: usage,
        mappedAtCreation: true
    };

    let gpuBuffer = device.createBuffer(bufferDesc);

    if (buffer instanceof Float32Array) {
        const writeArrayNormal = new Float32Array(gpuBuffer.getMappedRange());
        writeArrayNormal.set(buffer);
    } else if (buffer instanceof Uint16Array) {
        const writeArrayNormal = new Uint16Array(gpuBuffer.getMappedRange());
        writeArrayNormal.set(buffer);
    } else if (buffer instanceof Uint8Array) {
        const writeArrayNormal = new Uint8Array(gpuBuffer.getMappedRange());
        writeArrayNormal.set(buffer);
    } else if (buffer instanceof Uint32Array) {
    const writeArrayNormal = new Uint32Array(gpuBuffer.getMappedRange());
    writeArrayNormal.set(buffer);
    } else {
        const writeArrayNormal = Float32Array(gpuBuffer.getMappedRange());
        writeArrayNormal.set(buffer);
        console.error("Unhandled buffer format ", typeof gpuBuffer);
    }

    gpuBuffer.unmap();
    return gpuBuffer;

}

// export function getPositionBuffer() {
//     if (!m_positionBuffer) {
//         throw new Error("positionBuffer is not initialized!");
//     }

//     return m_positionBuffer;
// }


// export function getIndexBuffer() {
//     if (!m_indexBuffer) {
//         throw new Error("indexBuffer is not initialized!");
//     }

//     return m_indexBuffer;
// }

// export function getIndexBufferSize() {
//     if (!m_indexBufferSize) {
//         throw new Error("indexBufferSize is not initialized!");
//     }

//     return m_indexBufferSize;
// }

// export function getNormalBuffer() {
//     if (!m_normalBuffer) {
//         throw new Error("normalBuffer is not initialized!");
//     }

//     return m_normalBuffer;
// }
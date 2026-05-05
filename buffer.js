
import OBJFile from './node_modules/obj-file-parser/dist/OBJFile.js';
import * as glMatrix from 'gl-matrix';

import { Mesh } from "./mesh.js";
import { getDevice } from './webgpu.js';

let m_axisArrowsBuffer = null;

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

// arrow pointing to +X
export function getAxisArrowsBuffer() {
    if (!m_axisArrowsBuffer) {
        const vPositions = new Float32Array([
            // shaft (rectangular prism)
            0.0, -0.05, -0.05,
            0.7, -0.05, -0.05,
            0.7, 0.05, -0.05,

            0.0, -0.05, -0.05,
            0.7, 0.05, -0.05,
            0.0, 0.05, -0.05,

            // head (pyramid)
            0.7, -0.1, -0.1,
            0.7, 0.1, -0.1,
            0.7, 0.1, 0.1,
 
            0.7, -0.1, -0.1,
            0.7, 0.1, 0.1,
            0.7, -0.1, 0.1,

            // tip
            1.0, 0.0, 0.0
        ]);

        m_axisArrowsBuffer = createGPUBuffer(getDevice(), vPositions, vPositions.byteLength, GPUBufferUsage.VERTEX);
    }

    return m_axisArrowsBuffer;
}
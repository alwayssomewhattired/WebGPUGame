
import OBJFile from './node_modules/obj-file-parser/dist/OBJFile.js';
import * as glMatrix from 'gl-matrix';

import { Mesh } from "./mesh.js";
import { getDevice } from './webgpu.js';

let m_axisArrowsBuffer = null;
const m_aabbColor = new Float32Array([1.0, 1.0, 0.0]);
let m_aabbPositionBuffer = null;
let m_aabbVerticesLength = null;

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
export function getAxisArrowsPositionsGPUBuffer() {
    if (!m_axisArrowsBuffer) {
        const vPositions = new Float32Array([
            // x    r
            0,0,0,  1,0,0,
            1,0,0,  1,0,0,
            // y    g
            0,0,0,  0,1,0,
            0,1,0,  0,1,0,
            // z    b
            0,0,0,  0,0,1,
            0,0,1,  0,0,1
        ]);
        m_axisArrowsBuffer = createGPUBuffer(getDevice(), vPositions, vPositions.byteLength, GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST);
    }

    return m_axisArrowsBuffer;
}

export function getAABBColorGPUBuffer() {
    return createGPUBuffer(getDevice(), m_aabbColor, m_aabbColor.byteLength, GPUBufferUsage.UNIFORM);
}

export function getAABBPositionGPUBuffer() {
    if (!m_aabbPositionBuffer) {
        const vertices = new Float32Array([
            // bottom square
            -1,-1,-1,  1,-1,-1,
             1,-1,-1,  1,-1, 1,
             1,-1, 1, -1,-1, 1,
            -1,-1, 1, -1,-1,-1,

            // top square
            -1, 1,-1,  1, 1,-1,
             1, 1,-1,  1, 1, 1,
             1, 1, 1, -1, 1, 1,
            -1, 1, 1, -1, 1,-1,

            // vertical lines
            -1,-1,-1, -1, 1,-1,
             1,-1,-1,  1, 1,-1,
             1,-1, 1,  1, 1, 1,
            -1,-1, 1, -1, 1, 1,
        ]);
        m_aabbVerticesLength = vertices.length / 3;
        m_aabbPositionBuffer = createGPUBuffer(getDevice(), vertices, vertices.byteLength, GPUBufferUsage.VERTEX);
    }

    return m_aabbPositionBuffer;
}

export function getAABBVerticesLength() {
    if (!m_aabbVerticesLength) getAABBPositionGPUBuffer();
    return m_aabbVerticesLength;
}
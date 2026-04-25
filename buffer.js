
import * as objParser from './node_modules/obj-file-parser/dist/OBJFile.js'

let m_positionBuffer = null;
let m_indexBuffer = null;
let m_indexBufferSize = null;

export function createGPUBuffer(device, buffer, usage) {
    const bufferDesc = {
        size: buffer.byteLength,
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

export function createPositionBuffer(obj, device) {
    let positions = [];

    for (let v of obj.result.models[0].vertices) {
        positions.push(v.x);
        positions.push(v.y);
        positions.push(v.z);
    }

    positions = new Float32Array(positions);

    m_positionBuffer = createGPUBuffer(device, positions, GPUBufferUsage.VERTEX);

}

export function getPositionBuffer() {
    if (!m_positionBuffer) {
        throw new Error("positionBuffer is not initialized!");
    }

    return m_positionBuffer;
}

export function createIndexBuffer(obj, device) {
    let indices = [];

    for (let f of obj.result.models[0].faces) {
        for (let v of f.vertices) {
            indices.push(v.vertexIndex - 1);
        }
    }

    indices = new Uint16Array(indices);
    m_indexBufferSize = indices.length;

    m_indexBuffer = createGPUBuffer(device, indices, GPUBufferUsage.INDEX);

}

export function getIndexBuffer() {
    if (!m_indexBuffer) {
        throw new Error("indexBuffer is not initialized!");
    }

    return m_indexBuffer;
}

export function getIndexBufferSize() {
    if (!m_indexBufferSize) {
        throw new Error("indexBufferSize is not initialized!");
    }

    return m_indexBufferSize;
}
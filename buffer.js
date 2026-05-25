
import OBJFile from './node_modules/obj-file-parser/dist/OBJFile.js';
import * as glMatrix from 'gl-matrix';

import { Mesh } from "./mesh.js";
import { getDevice } from './webgpu.js';
import { Entity } from './entity.js';
import { getMatrix } from './matrix.js';
import { createRotationArcHeadVertices, createRotationArcVertices } from './transformGizmo.js';

let m_axisArrowsBuffer = null;
let m_rotationArcVerticesBuffer = null;
let m_rotationArcHeadVerticesBuffer = null;

const m_aabbColor = new Float32Array([1.0, 1.0, 0.0]);
const m_rayColor = new Float32Array([ 0.0, 1.0, 1.0]);
let m_aabbPositionBuffer = null;
let m_aabbVerticesLength = null;

export function createGPUBuffer(device, CPUBuffer, bufferBytes, usage) {
    const bufferDesc = {
        size: bufferBytes,
        usage: usage,
        mappedAtCreation: true
    };

    let gpuBuffer = device.createBuffer(bufferDesc);

    if (CPUBuffer instanceof Float32Array) {
        const writeArrayNormal = new Float32Array(gpuBuffer.getMappedRange());
        writeArrayNormal.set(CPUBuffer);
    } else if (CPUBuffer instanceof Uint16Array) {
        const writeArrayNormal = new Uint16Array(gpuBuffer.getMappedRange());
        writeArrayNormal.set(CPUBuffer);
    } else if (CPUBuffer instanceof Uint8Array) {
        const writeArrayNormal = new Uint8Array(gpuBuffer.getMappedRange());
        writeArrayNormal.set(CPUBuffer);
    } else if (CPUBuffer instanceof Uint32Array) {
    const writeArrayNormal = new Uint32Array(gpuBuffer.getMappedRange());
    writeArrayNormal.set(CPUBuffer);
    } else {
        const writeArrayNormal = Float32Array(gpuBuffer.getMappedRange());
        writeArrayNormal.set(CPUBuffer);
        console.error("Unhandled buffer format ", typeof gpuBuffer);
    }

    gpuBuffer.unmap();
    return gpuBuffer;

}

// arrow pointing to +X
export function getAxisArrowsVerticesGPUBuffer() {
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

export function initRotationArcVerticesGPUBuffer() {
    const vertices = createRotationArcVertices();
    m_rotationArcVerticesBuffer = createGPUBuffer(getDevice(), vertices, vertices.byteLength, GPUBufferUsage.VERTEX);
}

export function getRotationArcVerticesGPUBuffer() {
    if (!m_rotationArcVerticesBuffer) {
        throw new Error("rotation arc vertices buffer is fucked mate");
    }
    return m_rotationArcVerticesBuffer;

}

export function initRotationArcHeadVerticesGPUBuffer() {
    const vertices = createRotationArcHeadVertices();
    m_rotationArcHeadVerticesBuffer = createGPUBuffer(getDevice(), vertices, vertices.byteLength, GPUBufferUsage.VERTEX);
}

export function getRotationArcHeadVerticesGPUBuffer() {
    if (!m_rotationArcHeadVerticesBuffer) {
        throw new Error("rotation arc head vertices buffer is fucked mate");
    }
    return m_rotationArcHeadVerticesBuffer;

}

export function getAABBColorGPUBuffer() {
    return createGPUBuffer(getDevice(), m_aabbColor, m_aabbColor.byteLength, GPUBufferUsage.UNIFORM);
}

export function getRayColorGPUBuffer() {
    return createGPUBuffer(getDevice(), m_rayColor, m_rayColor.byteLength, GPUBufferUsage.UNIFORM);
}

// | this is hardcoded transformGizmo aabb
// | make this generic
export function getAABBPositionGPUBuffer(positions) {
    if (!m_aabbPositionBuffer) {

        m_aabbVerticesLength = positions.length / 3;
        m_aabbPositionBuffer = createGPUBuffer(getDevice(), positions, vertices.byteLength, GPUBufferUsage.VERTEX);
    }

    return m_aabbPositionBuffer;
}

export function getAABBVerticesLength() {
    if (!m_aabbVerticesLength) getAABBGizmoPositionGPUBuffer();
    return m_aabbVerticesLength;
}

export function updateDynamicGPUBuffer(alignedSize, entity, buffer) {
        const modelMatrix = getMatrix(entity.modelMatrixIdx)
        const aabbModelMatrix = getMatrix(entity.aabbModelIdx);
        const axisArrowsModelMatrix = getMatrix(entity.axisArrowsModelIdx);
        const axisArrowsAABBModelMatrix = getMatrix(entity.axisArrowsAABBModelIdx);
        const rotationArcModelMatrix = getMatrix(entity.rotationArcModelIdx);
        const rotationArcHeadModelMatrix = getMatrix(entity.rotationArcHeadModelIdx);
        const modelViewMatrix = getMatrix(entity.modelViewIdx);

        let offset = alignedSize;
        if (entity.idx > 0) offset *= ((entity.modelMatrixLength * entity.idx) + 1);
        
        getDevice().queue.writeBuffer(buffer, offset, modelMatrix);
        offset += alignedSize;
        getDevice().queue.writeBuffer(buffer, offset, aabbModelMatrix);
        offset += alignedSize;
        getDevice().queue.writeBuffer(buffer, offset, axisArrowsModelMatrix);
        offset += alignedSize;
        getDevice().queue.writeBuffer(buffer, offset, axisArrowsAABBModelMatrix);
        offset += alignedSize;
        getDevice().queue.writeBuffer(buffer, offset, rotationArcModelMatrix);
        offset += alignedSize;
        getDevice().queue.writeBuffer(buffer, offset, rotationArcHeadModelMatrix);
        offset += alignedSize;
        getDevice().queue.writeBuffer(buffer, offset, modelViewMatrix);

}

export function getAlignedSize(objectUniformSize) {
    const alignment = getDevice().limits.minUniformBufferOffsetAlignment;
    return Math.ceil(objectUniformSize / alignment) * alignment;
}


import OBJFile from './node_modules/obj-file-parser/dist/OBJFile.js';
import * as glMatrix from 'gl-matrix';

import { Mesh } from "./mesh.js";
import { getDevice } from './webgpu.js';
import { Entity, getEntityModelMatricesCount } from './entity.js';
import { getMatrix } from './matrix.js';
import { createRotationArcHeadVertices, createRotationArcVertices } from './transformGizmo.js';
import { generateUVSphere } from './light.js';

let m_axisArrowsBuffer = null;
let m_rotationArcVerticesBuffer = null;
let m_rotationArcHeadVerticesBuffer = null;
let m_sphereVerticesBuffer = null;

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

    if (CPUBuffer instanceof Float32Array || CPUBuffer.constructor.name === Float32Array) {
        const writeArrayNormal = new Float32Array(gpuBuffer.getMappedRange());
        writeArrayNormal.set(CPUBuffer);
    } else if (CPUBuffer instanceof Uint16Array || CPUBuffer.constructor.name === Uint16Array) {
        const writeArrayNormal = new Uint16Array(gpuBuffer.getMappedRange());
        writeArrayNormal.set(CPUBuffer);
    } else if (CPUBuffer instanceof Uint8Array || CPUBuffer.constructor.name === Uint8Array) {
        const writeArrayNormal = new Uint8Array(gpuBuffer.getMappedRange());
        writeArrayNormal.set(CPUBuffer);
    } else if (CPUBuffer instanceof Uint32Array || CPUBuffer.constructor.name === Uint32Array) {
    const writeArrayNormal = new Uint32Array(gpuBuffer.getMappedRange());
    writeArrayNormal.set(CPUBuffer);
    } else {
        const writeArrayNormal = new Float32Array(gpuBuffer.getMappedRange());
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

export function initSphereVerticesGPUBuffer() {
    const vertices = generateUVSphere(2, 64);
    m_sphereVerticesBuffer = createGPUBuffer(getDevice(), vertices, vertices.byteLength, GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST);
}

export function getSphereVerticesGPUBuffer() {
    if (!m_sphereVerticesBuffer) throw new Error("Sphere vertex buffer not initialized!!");
    return m_sphereVerticesBuffer;
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

export function updateDynamicGPUBuffer(mesh, buffer) {
    // if (mesh.isDirty) {

        const modelMatrix = getMatrix(mesh.modelMatrixIdx)
        const aabbModelMatrix = getMatrix(mesh.aabbModelIdx);
        const axisArrowsModelMatrix = getMatrix(mesh.axisArrowsModelIdx);
        const axisArrowsAABBModelMatrix = getMatrix(mesh.axisArrowsAABBModelIdx);
        const rotationArcModelMatrix = getMatrix(mesh.rotationArcModelIdx);
        const rotationArcHeadModelMatrix = getMatrix(mesh.rotationArcHeadModelIdx);
        const modelViewMatrix = getMatrix(mesh.modelViewIdx);
        const normalMatrix = getMatrix(mesh.normalMatrixIdx);
        
        const alignedSizeBase = getAlignedSize(64);
        // console.log(mesh.idx)
        let offset = alignedSizeBase * ((mesh.idx * getEntityModelMatricesCount()) + (mesh.idx || 1));
        
        getDevice().queue.writeBuffer(buffer, offset, modelMatrix);
        offset += alignedSizeBase;
        getDevice().queue.writeBuffer(buffer, offset, aabbModelMatrix);
        offset += alignedSizeBase;
        getDevice().queue.writeBuffer(buffer, offset, axisArrowsModelMatrix);
        offset += alignedSizeBase;
        getDevice().queue.writeBuffer(buffer, offset, axisArrowsAABBModelMatrix);
        offset += alignedSizeBase;
        getDevice().queue.writeBuffer(buffer, offset, rotationArcModelMatrix);
        offset += alignedSizeBase;
        getDevice().queue.writeBuffer(buffer, offset, rotationArcHeadModelMatrix);
        offset += alignedSizeBase;
        getDevice().queue.writeBuffer(buffer, offset, modelViewMatrix);
        offset += alignedSizeBase;
        getDevice().queue.writeBuffer(buffer, offset, normalMatrix);
        mesh.isDirty = false;

}

export function getAlignedSize(objectUniformSize) {
    const alignment = getDevice().limits.minUniformBufferOffsetAlignment;
    return Math.ceil(objectUniformSize / alignment) * alignment;
}


import OBJFile from './node_modules/obj-file-parser/dist/OBJFile.js';
import * as glMatrix from 'gl-matrix';


let m_positionBuffer = null;
let m_indexBuffer = null;
let m_indexBufferSize = null;
let m_normalBuffer = null;

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

export function createModelBuffer(obj, device) {
    let positions = [];

    for (let v of obj.result.models[0].vertices) {
        positions.push(v.x);
        positions.push(v.y);
        positions.push(v.z);
    }

    positions = new Float32Array(positions);

    m_positionBuffer = createGPUBuffer(device, positions, GPUBufferUsage.VERTEX);

    let faces = obj.result.models[0].faces;
    let faceCount = faces.length;
    let vertexCount = 0;
    for (let f of faces) {
        for (let v of f.vertices) {
            vertexCount++;
        }
    }

    let indices = [];
    let normals = Array(vertexCount * 3).fill(0);
    let xOffset;
    let yOffset;
    let zOffset;
    let minX;
    let maxX;
    let minY;
    let maxY;
    let minZ;
    let maxZ;

    for (let f of faces) {
        let points = [];
        let facet_indices = [];
        for (let v of f.vertices) {
            const index = v.vertexIndex - 1;
            indices.push(index);

            xOffset = positions[index * 3];
            yOffset = positions[index * 3 + 1];
            zOffset = positions[index * 3 + 2];

            const vertex = glMatrix.vec3.fromValues(
                xOffset,
                yOffset,
                zOffset
            );

            minX = Math.min(xOffset, minX);
            maxX = Math.max(xOffset, maxX);

            minY = Math.min(yOffset, minY);
            maxY = Math.max(yOffset, maxY);

            minZ = Math.min(zOffset, minZ);
            maxZ = Math.max(zOffset, maxZ);

            points.push(vertex);
            facet_indices.push(index);
        }

        const v1 = glMatrix.vec3.subtract(glMatrix.vec3.create(), points[1], points[0]);
        const v2 = glMatrix.vec3.subtract(glMatrix.vec3.create(), points[2], points[0]);
        const cross = glMatrix.vec3.cross(glMatrix.vec3.create(), v1, v2);
        const normal = glMatrix.vec3.normalize(glMatrix.vec3.create(), cross);

        for (let i of facet_indices) {
            normals[i * 3] += normal[0];
            normals[i * 3 + 1] += normal[1];
            normals[i * 3 + 2] += normal[2];
            
        }
        // console.log(facet_indices);
    }
    
    normals = new Float32Array(normals);
    console.log(normals); //2555
    m_normalBuffer = createGPUBuffer(device, normals, GPUBufferUsage.VERTEX);

    indices = new Uint16Array(indices);
    m_indexBufferSize = indices.length;

    m_indexBuffer = createGPUBuffer(device, indices, GPUBufferUsage.INDEX);

        for (let f of obj.result.models[0].faces) {
        let points = [];
        let facet_indices = [];
        for (let v of f.vertices) {
            const index = v.vertexIndex - 1;

            const vertex = glMatrix.vec3.fromValues(positions)
        }
    }
}

export function getPositionBuffer() {
    if (!m_positionBuffer) {
        throw new Error("positionBuffer is not initialized!");
    }

    return m_positionBuffer;
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

export function getNormalBuffer() {
    if (!m_normalBuffer) {
        throw new Error("normalBuffer is not initialized!");
    }

    return m_normalBuffer;
}
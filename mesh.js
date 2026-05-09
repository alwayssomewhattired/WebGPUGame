
import OBJFile from './node_modules/obj-file-parser/dist/OBJFile.js';
import * as glMatrix from 'gl-matrix'

import { createGPUBuffer } from "./buffer.js";
import { getDevice } from './webgpu.js';

export class Mesh {
    constructor(vPositions, vPositionsBuffer, vIndices, vIndicesBuffer, vIndexBufferSize,
        vNormals, vNormalsBuffer, aabbMin, aabbMax) {
        // | 3 (x,y,z)
        this.vPositions = vPositions;

        this.vPositionsBuffer = vPositionsBuffer;
        this.vIndices = vIndices;
        this.vIndicesBuffer = vIndicesBuffer;
        this.vIndexBufferSize = vIndexBufferSize;
        this.vNormals = vNormals;
        this.vNormalsBuffer = vNormalsBuffer;
        this.aabbMin = aabbMin;
        this.aabbMax = aabbMax;
        this.aabbPositionsBuffer = createAABBPositions(this);
        this.aabbPositionsLength = 24;
    }
}

let m_aabbPositionsOffset = 0;

// * obj * raw file
// * entity * instance of entity class
export function createMesh(obj, device) {
    let positions = [];
    let aabbMin = glMatrix.vec3.create();
    let aabbMax = glMatrix.vec3.create();
    for (let v of obj.result.models[0].vertices) {
        // | AABB
        aabbMin[0] = Math.min(v.x, aabbMin[0]);
        aabbMin[1] = Math.min(v.y, aabbMin[1]);
        aabbMin[2] = Math.min(v.z, aabbMin[2]);

        aabbMax[0] = Math.max(v.x, aabbMax[0]);
        aabbMax[1] = Math.max(v.y, aabbMax[1]);
        aabbMax[2] = Math.max(v.z, aabbMax[2]);

        // | positions
        positions.push(v.x);
        positions.push(v.y);
        positions.push(v.z);

    }

    positions = new Float32Array(positions);
    const positionBuffer = createGPUBuffer(device, positions, positions.byteLength, GPUBufferUsage.VERTEX);


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
    }
    
    normals = new Float32Array(normals);
    const normalBuffer = createGPUBuffer(device, normals, normals.byteLength, GPUBufferUsage.VERTEX);

    indices = new Uint16Array(indices);
    const indexBufferSize = indices.length;

    const indexBuffer = createGPUBuffer(device, indices, indices.byteLength, GPUBufferUsage.INDEX);

        for (let f of obj.result.models[0].faces) {
        let points = [];
        let facet_indices = [];
        for (let v of f.vertices) {
            const index = v.vertexIndex - 1;

            const vertex = glMatrix.vec3.fromValues(positions);
        }
    }
    
    const mesh = new Mesh(positions, positionBuffer, indices, indexBuffer, indexBufferSize, normals, normalBuffer,
        aabbMin, aabbMax, m_aabbPositionsOffset
    );

    return mesh;
}

function createAABBPositions(mesh) {
    const min = mesh.aabbMin;
    const max = mesh.aabbMax;

    const positions = new Float32Array([
        // front
        min[0], min[1], min[2],
        max[0], min[1], min[2],
        max[0], max[1], min[2],
        min[0], max[1], min[2],

        // back
        min[0], min[1], max[2],
        max[0], min[1], max[2],
        max[0], max[1], max[2],
        min[0], max[1], max[2]
    ]);

    return createGPUBuffer(getDevice(), positions, positions.byteLength, GPUBufferUsage.VERTEX);
}

import OBJFile from './node_modules/obj-file-parser/dist/OBJFile.js';
import * as glMatrix from 'gl-matrix'

import { createGPUBuffer } from "./buffer.js";
import { getDevice } from './webgpu.js';

export class Mesh {
    constructor(vCount, vData, vDataBuffer, vIndices, vIndicesBuffer, vIndexBufferSize, aabbMin, aabbMax, primitives) {
        // | 3 (x,y,z)
        this.vCount = vCount;
        this.vData = vData;
        this.vDataBuffer = vDataBuffer;
        this.primitives = primitives
        this.vIndices = vIndices;
        this.vIndicesBuffer = vIndicesBuffer;
        this.vIndexBufferSize = vIndexBufferSize;
        this.aabbMin = aabbMin;
        this.aabbMax = aabbMax;
        this.aabbPositionsBuffer = createAABBPositions(this);
        this.aabbPositionsLength = 24;
    }
}

// | holds spot and size in global vertex data
class Primitive {
    constructor(offset, size) {
        this.offset = offset;
        this.size = size;
    }
}

let m_aabbPositionsOffset = 0;

// * obj * raw file
// * entity * instance of entity class
export function createMesh(obj, device) {
    const object = obj.result.models[0];
    let vertexData = [];
    let aabbMin = glMatrix.vec3.create();
    let aabbMax = glMatrix.vec3.create();

    const primitiveOffset = vertexData.length;
    const primitiveData = [];

    let faces = object.faces;
    let faceCount = faces.length;
    let vertexCount = 0;
    for (let face of faces) {
        for (let vertex of face.vertices) {

            const pos = object.vertices[vertex.vertexIndex - 1];
            const uv = object.textureCoords[vertex.textureCoordsIndex - 1];
            const normal = object.vertexNormals[vertex.vertexNormalIndex - 1];

            // | AABB
            aabbMin[0] = Math.min(pos.x, aabbMin[0]);
            aabbMin[1] = Math.min(pos.y, aabbMin[1]);
            aabbMin[2] = Math.min(pos.z, aabbMin[2]);

            aabbMax[0] = Math.max(pos.x, aabbMax[0]);
            aabbMax[1] = Math.max(pos.y, aabbMax[1]);
            aabbMax[2] = Math.max(pos.z, aabbMax[2]);

            vertexData.push(
                pos.x,
                pos.y,
                pos.z,
                uv.u,
                uv.v, // - possibly flip this
                normal.x,
                normal.y,
                normal.z
            );

            vertexCount++;

        }
    }

    vertexData = new Float32Array(vertexData);
    const vertexBuffer = createGPUBuffer(device, vertexData, vertexData.byteLength, GPUBufferUsage.VERTEX);

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

            xOffset = vertexData[index * 3];
            yOffset = vertexData[index * 3 + 1];
            zOffset = vertexData[index * 3 + 2];

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

    indices = new Uint16Array(indices);
    const indexBufferSize = indices.length;

    const indexBuffer = createGPUBuffer(device, indices, indices.byteLength, GPUBufferUsage.INDEX);

        for (let f of object.faces) {
        let points = [];
        let facet_indices = [];
        for (let v of f.vertices) {
            const index = v.vertexIndex - 1;

            const vertex = glMatrix.vec3.fromValues(vertexData);
        }
    }

    const primitiveSize = vertexData.length;
    const primitiveObject = new Primitive(primitiveOffset, primitiveSize);
    primitiveData.push(primitiveObject);
    
    const mesh = new Mesh(vertexCount, vertexData, vertexBuffer, indices, indexBuffer, indexBufferSize, 
        aabbMin, aabbMax, m_aabbPositionsOffset, primitiveData
    );

    return mesh;
}

export function createGLBMesh(primitiveAOS, device) {
    
    let vertexData = [];

    for (const primitive in primitiveAOS) {
        const positions = primitive.positions;
        const texCoords = primitive.texCoords;
        const normals = primitive.normals;
        const indices = primitive.indices;

        let aabbMin = glMatrix.vec3.create();
        let aabbMax = glMatrix.vec3.create();

        let primitiveData = [];

        let vertexCount = 0;
        const offset = vertexData.length;

        let aabbIdx = 0;

        const vertexElementsCount = 8 // 3-pos, 2-uv, 3-norm

        const vertexIterationLength = Math.max(positions.length, texCoords.length, normals.length);
        const vertexStride = 3; // 2 is length of uv elements

        let uvIdx = 0;
        for (let i = 0; i < vertexIterationLength; i += vertexStride) {

            // | Positions
            for (let j = i; j < (i+3); j++) {
                const pos = positions[j]

                // | AABB
                if (aabbIdx === 0) {
                    aabbMin[aabbIdx] = Math.min(pos, aabbMin[aabbIdx]);
                    aabbMax[aabbIdx] = Math.max(pos, aabbMax[aabbIdx]);
                } else if (aabbIdx === 1) {
                    aabbMin[aabbIdx] = Math.min(pos, aabbMin[aabbIdx]);
                    aabbMax[aabbIdx] = Math.max(pos, aabbMax[aabbIdx]);
                } else {
                    aabbMin[aabbIdx] = Math.min(pos, aabbMin[aabbIdx]);
                    aabbMax[aabbIdx] = Math.max(pos, aabbMax[aabbIdx]);
                }

                aabbMin[aabbIdx] = Math.min(pos, aabbMin[aabbIdx]);
                aabbMax[aabbIdx] = Math.max(pos, aabbMax[aabbIdx]);

                vertexData.push(positions[j]);
                vertexCount++;
            }

            // | UV
            for (let j = uvIdx; j < (i+2); j++) {
                vertexData.push(texCoords[j]);
            }

            uvIdx += 2;

            // | Normals
            for (let j = i; j < (i+3); j++) {
                vertexData.push(normals[j]);
            }

        }
        const size = vertexData.length - offset;
        const primitiveObject = new Primitive(offset, size);
        primitiveData.push(primitiveObject);
    }

    vertexData = new Float32Array(vertexData);
    const vertexBuffer = createGPUBuffer(device, vertexData, vertexData.byteLength, GPUBufferUsage.VERTEX);

    const indexBuffer = createGPUBuffer(device, indices, indices.byteLength, GPUBufferUsage.INDEX);

    const mesh = new Mesh(vertexCount, vertexData, vertexBuffer, indices, indexBuffer, indices.length, 
        aabbMin, aabbMax, m_aabbPositionsOffset, primitiveData
    );
    return mesh;
}

function createAABBPositions(mesh) {
    const min = mesh.aabbMin;
    const max = mesh.aabbMax;

    const positions = new Float32Array([

        // FRONT FACE
        min[0], min[1], min[2],
        max[0], min[1], min[2],

        max[0], min[1], min[2],
        max[0], max[1], min[2],

        max[0], max[1], min[2],
        min[0], max[1], min[2],

        min[0], max[1], min[2],
        min[0], min[1], min[2],


        // BACK FACE
        min[0], min[1], max[2],
        max[0], min[1], max[2],

        max[0], min[1], max[2],
        max[0], max[1], max[2],

        max[0], max[1], max[2],
        min[0], max[1], max[2],

        min[0], max[1], max[2],
        min[0], min[1], max[2],


        // CONNECTING EDGES
        min[0], min[1], min[2],
        min[0], min[1], max[2],

        max[0], min[1], min[2],
        max[0], min[1], max[2],

        max[0], max[1], min[2],
        max[0], max[1], max[2],

        min[0], max[1], min[2],
        min[0], max[1], max[2],
    ]);

    return createGPUBuffer(getDevice(), positions, positions.byteLength, GPUBufferUsage.VERTEX);
}
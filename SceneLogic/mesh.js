
// import OBJFile from 'obj-file-parser';
import * as glMatrix from 'gl-matrix'

import { createGPUBuffer, updateDynamicGPUBuffer } from "../Renderer/buffer.js";
import { getDevice } from '../Renderer/webgpu.js';
import { updateMatrix as matrix_updateMatrix, createAndStoreMatrix, getMatrix, getMegaMatrixCPUBufferLength, getViewMatrix } from './matrix.js';
import { getMegaMatrixUBO } from '../Renderer/uniform.js';
import { globalTextureOffset, textureCount } from '../Asset_Manager/texture.js';
import { Primitive } from './primitive.js';

export class Mesh {
    #translation;
    #rotation;
    #scale;

    constructor(vCount, vIndexBufferSize, aabbMin, aabbMax, primitives, debugVertexCount
    ) {
        
        this.#translation = glMatrix.vec3.fromValues(0.0, 0.0, -10.0);
        this.#rotation = glMatrix.vec3.fromValues(0, 0, 0);
        this.#scale = glMatrix.vec3.fromValues(0.2, 0.2, 0.2);
        
        this.idx = null;
        this.isDirty = false;
        
        this.primitives = primitives
        
        this.vCount = vCount;
        // this.vData = vData;
        this.vIndexBufferSize = vIndexBufferSize;
        this.aabbMin = aabbMin;
        this.aabbMax = aabbMax;
        this.aabbPositionsBuffer = createAABBPositions(this);
        this.aabbPositionsLength = 24;
        
        // debugVertexBuffer dimensions: normalX,normalY,normalZ,normalEndX,normalEndY,normalEndZ
        // this.debugVertexBuffer = debugVertexBuffer;
        this.debugVertexCount = debugVertexCount;
        
        // ####### matrix indices are internally set
        // DO NOT TOUCH
        // #######
        this.modelMatrixLength = 8; 
        this.modelMatrixIdx = null;
        this.aabbModelIdx = null;
        this.axisArrowsModelIdx = null;
        this.axisArrowsAABBModelIdx = null;
        this.rotationArcModelIdx = null;
        this.rotationArcHeadModelIdx = null;
        this.modelViewIdx = null;
        this.normalMatrixIdx = null;
        
        this.modelMatrixBufferOffset;
        this.initModelMatrix();
        
        
    }

    setTranslation(translation) {
        this.#translation = translation;
        this.isDirty = true;
    }
    setRotation(rotation) {
        this.#rotation = rotation;
        this.isDirty = true;
    }
    setScale(scale) {
        this.#scale = scale;
        this.isDirty = true;
    }

    getMeshTranslation() {
        return this.#translation;
    }
    getRotation() {
        return this.#rotation;
    }
    getScale() {
        return this.#scale;
    }

    initModelMatrix() {
        const mesh = this;
            const translation = mesh.getMeshTranslation();
            const rotation = mesh.getRotation();
            const scale = mesh.getScale()
            const modelMatrix = glMatrix.mat4.create();
            glMatrix.mat4.identity(modelMatrix);
            glMatrix.mat4.translate(modelMatrix, modelMatrix, translation);
            glMatrix.mat4.rotateX(modelMatrix, modelMatrix, rotation[0]);
            glMatrix.mat4.rotateY(modelMatrix, modelMatrix, rotation[1]);
            glMatrix.mat4.rotateZ(modelMatrix, modelMatrix, rotation[2]);
            glMatrix.mat4.scale(modelMatrix, modelMatrix, scale);
            mesh.modelMatrixIdx = createAndStoreMatrix(modelMatrix);

            const aabbModelMatrix = glMatrix.mat4.create();
            glMatrix.mat4.identity(aabbModelMatrix);
            glMatrix.mat4.translate(aabbModelMatrix, aabbModelMatrix, translation);
            glMatrix.mat4.rotateX(aabbModelMatrix, aabbModelMatrix, rotation[0]);
            glMatrix.mat4.rotateY(aabbModelMatrix, aabbModelMatrix, rotation[1]);
            glMatrix.mat4.rotateZ(aabbModelMatrix, aabbModelMatrix, rotation[2]);
            glMatrix.mat4.scale(aabbModelMatrix, aabbModelMatrix, scale);
            mesh.aabbModelIdx = createAndStoreMatrix(aabbModelMatrix);

            const axisArrowsModelMatrix = glMatrix.mat4.create();
            const axisArrowsScale = glMatrix.vec3.fromValues(1.0, 1.0, 1.0);
            glMatrix.mat4.identity(axisArrowsModelMatrix);
            glMatrix.mat4.translate(axisArrowsModelMatrix, axisArrowsModelMatrix, translation);
            glMatrix.mat4.rotateX(axisArrowsModelMatrix, axisArrowsModelMatrix, rotation[0]);
            glMatrix.mat4.rotateY(axisArrowsModelMatrix, axisArrowsModelMatrix, rotation[1]);
            glMatrix.mat4.rotateZ(axisArrowsModelMatrix, axisArrowsModelMatrix, rotation[2]);
            glMatrix.mat4.scale(axisArrowsModelMatrix, axisArrowsModelMatrix, axisArrowsScale);
            mesh.axisArrowsModelIdx = createAndStoreMatrix(axisArrowsModelMatrix);

            const axisArrowsAABBModelMatrix = glMatrix.mat4.create();
            const axisArrowsAABBScale = glMatrix.vec3.fromValues(1.0, 1.0, 1.0);
            glMatrix.mat4.identity(axisArrowsAABBModelMatrix);
            glMatrix.mat4.translate(axisArrowsAABBModelMatrix, axisArrowsAABBModelMatrix, translation);
            glMatrix.mat4.rotateX(axisArrowsAABBModelMatrix, axisArrowsAABBModelMatrix, rotation[0]);
            glMatrix.mat4.rotateY(axisArrowsAABBModelMatrix, axisArrowsAABBModelMatrix, rotation[1]);
            glMatrix.mat4.rotateZ(axisArrowsAABBModelMatrix, axisArrowsAABBModelMatrix, rotation[2]);
            glMatrix.mat4.scale(axisArrowsAABBModelMatrix, axisArrowsAABBModelMatrix, axisArrowsAABBScale);
            mesh.axisArrowsAABBModelIdx = createAndStoreMatrix(axisArrowsAABBModelMatrix);

            const rotationArcModelMatrix = glMatrix.mat4.create();
            glMatrix.mat4.identity(rotationArcModelMatrix);
            glMatrix.mat4.translate(rotationArcModelMatrix, rotationArcModelMatrix, translation);
            glMatrix.mat4.rotateX(rotationArcModelMatrix, rotationArcModelMatrix, rotation[0]);
            glMatrix.mat4.rotateY(rotationArcModelMatrix, rotationArcModelMatrix, rotation[1]);
            glMatrix.mat4.rotateZ(rotationArcModelMatrix, rotationArcModelMatrix, rotation[2]);
            mesh.rotationArcModelIdx = createAndStoreMatrix(rotationArcModelMatrix);

            const rotationArcHeadModelMatrix = glMatrix.mat4.create();
            const rotationArcHeadScale = glMatrix.vec3.fromValues(0.1, 0.1, 0.1);
            glMatrix.mat4.identity(rotationArcHeadModelMatrix);
            glMatrix.mat4.translate(rotationArcHeadModelMatrix, rotationArcHeadModelMatrix, translation);
            glMatrix.mat4.translate(rotationArcHeadModelMatrix, rotationArcHeadModelMatrix, [1.0, 0, 0]);
            glMatrix.mat4.rotateX(rotationArcHeadModelMatrix, rotationArcHeadModelMatrix, rotation[0]);
            glMatrix.mat4.rotateY(rotationArcHeadModelMatrix, rotationArcHeadModelMatrix, rotation[1]);
            glMatrix.mat4.rotateZ(rotationArcHeadModelMatrix, rotationArcHeadModelMatrix, rotation[2]);
            glMatrix.mat4.scale(rotationArcHeadModelMatrix, rotationArcHeadModelMatrix, rotationArcHeadScale);
            mesh.rotationArcHeadModelIdx = createAndStoreMatrix(rotationArcHeadModelMatrix);

            const viewMatrix = getViewMatrix();
            const modelViewMatrix = glMatrix.mat4.create();
            glMatrix.mat4.multiply(modelViewMatrix, modelMatrix, viewMatrix);
            mesh.modelViewIdx = createAndStoreMatrix(modelViewMatrix);

            const normalMatrix = glMatrix.mat4.create();
            glMatrix.mat4.invert(normalMatrix, modelViewMatrix);
            glMatrix.mat4.transpose(normalMatrix, normalMatrix);
            mesh.normalMatrixIdx = createAndStoreMatrix(normalMatrix);
    }
}

// class Primitive {
//     constructor(vertexOffsetBytes, vertexSizeBytes, vertexOffset, idxOffset, idxSize, idxOffsetBytes, idxSizeBytes,
//         vertexStrideBytes, idxType, vertexSize, vertexCount, materialIdx
//     ) {
//         this.globalMaterialIdx = materialIdx;

//         this.vertexOffsetBytes =  vertexOffsetBytes;
//         this.vertexSizeBytes =   vertexSizeBytes;
//         this.vertexOffset =        vertexOffset;
//         this.vertexSize = vertexSize;
//         this.vertexCount = vertexCount;
//         this.vertexStrideBytes = vertexStrideBytes;

//         this.idxOffset =    idxOffset;
//         this.idxSize =      idxSize;
//         this.idxType = idxType;

//         this.idxOffsetBytes =    idxOffsetBytes;
//         this.idxSizeBytes =      idxSizeBytes;
//     }
// }

let m_aabbPositionsOffset = 0;

// * obj * raw file
// * entity * instance of entity class
export function createMesh(model, device) {

    const vertices = model.vertices;
    let vertexData = [];
    const indices = model.indices;
    let indexData = [];

    let debugVertexData = [];
    let normalLength = 2.0;

    let aabbMin = glMatrix.vec3.create();
    let aabbMax = glMatrix.vec3.create();

    const primitiveOffset = model.vertices.length;
    const primitiveData = [];

    // let faces = model.faces;
    // let faceCount = faces.length;
    let vertexCount = 0;

    for (let i=0; i<model.positions.length; i+=3) {
        const posX = model.positions[i];
        const posY = model.positions[i+1];
        const posZ = model.positions[i+2];

        const normalX = model.normals[i];
        const normalY = model.normals[i+1];
        const normalZ = model.normals[i+2];

        aabbMin[0] = Math.min(posX, aabbMin[0]);
        aabbMin[1] = Math.min(posY, aabbMin[1]);
        aabbMin[2] = Math.min(posZ, aabbMin[2]);

        aabbMax[0] = Math.max(posX, aabbMax[0]);
        aabbMax[1] = Math.max(posY, aabbMax[1]);
        aabbMax[2] = Math.max(posZ, aabbMax[2]);

        debugVertexData.push(
            posX,
            posY,
            posZ,
            (posX + normalX) * normalLength,
            (posY + normalY) * normalLength,
            (posZ + normalZ) * normalLength
        );

        vertexCount++;
    }

    // for (let face of faces) {
    //     for (let vertex of face.vertices) {

    //         const pos = model.vertices[vertex.vertexIndex - 1];
    //         const uv = model.textureCoords[vertex.textureCoordsIndex - 1];
    //         const normal = model.vertexNormals[vertex.vertexNormalIndex - 1];

    //         // | AABB
    //         aabbMin[0] = Math.min(pos.x, aabbMin[0]);
    //         aabbMin[1] = Math.min(pos.y, aabbMin[1]);
    //         aabbMin[2] = Math.min(pos.z, aabbMin[2]);

    //         aabbMax[0] = Math.max(pos.x, aabbMax[0]);
    //         aabbMax[1] = Math.max(pos.y, aabbMax[1]);
    //         aabbMax[2] = Math.max(pos.z, aabbMax[2]);

    //         vertexData.push(
    //             pos.x,
    //             pos.y,
    //             pos.z,
    //             uv.u,
    //             uv.v,
    //             normal.x,
    //             normal.y,
    //             normal.z
    //         );

    //         debugVertexData.push(
    //             pos.x,
    //             pos.y,
    //             pos.z,
    //             (pos.x + normal.x) * normalLength,
    //             (pos.y + normal.y) * normalLength,
    //             (pos.z + normal.z) * normalLength
    //         );

    //         vertexCount++;

    //     }
    // }

    vertexData = new Float32Array(vertices);
    const vertexBuffer = createGPUBuffer(device, vertexData, vertexData.byteLength, GPUBufferUsage.VERTEX);
    const debugVertexCount = (debugVertexData.length / 3); // normal start, normal end
    debugVertexData = new Float32Array(debugVertexData);
    const debugVertexBuffer = createGPUBuffer(device, debugVertexData, debugVertexData.byteLength, GPUBufferUsage.VERTEX);

    // let indices = [];
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

    // for (let f of faces) {
    //     let points = [];
    //     let facet_indices = [];
    //     for (let v of f.vertices) {
    //         const index = v.vertexIndex - 1;
    //         indices.push(index);

    //         xOffset = vertexData[index * 3];
    //         yOffset = vertexData[index * 3 + 1];
    //         zOffset = vertexData[index * 3 + 2];

    //         const vertex = glMatrix.vec3.fromValues(
    //             xOffset,
    //             yOffset,
    //             zOffset
    //         );

    //         minX = Math.min(xOffset, minX);
    //         maxX = Math.max(xOffset, maxX);

    //         minY = Math.min(yOffset, minY);
    //         maxY = Math.max(yOffset, maxY);

    //         minZ = Math.min(zOffset, minZ);
    //         maxZ = Math.max(zOffset, maxZ);

    //         points.push(vertex);
    //         facet_indices.push(index);
    //     }

    //     const v1 = glMatrix.vec3.subtract(glMatrix.vec3.create(), points[1], points[0]);
    //     const v2 = glMatrix.vec3.subtract(glMatrix.vec3.create(), points[2], points[0]);
    //     const cross = glMatrix.vec3.cross(glMatrix.vec3.create(), v1, v2);
    //     const normal = glMatrix.vec3.normalize(glMatrix.vec3.create(), cross);

    //     for (let i of facet_indices) {
    //         normals[i * 3] += normal[0];
    //         normals[i * 3 + 1] += normal[1];
    //         normals[i * 3 + 2] += normal[2];
            
    //     }
    // }

    indexData = new Uint16Array(indices);
    const indexBufferSize = indexData.length;

    const indexBuffer = createGPUBuffer(device, indexData, indexData.byteLength, GPUBufferUsage.INDEX);

    //     for (let f of model.faces) {
    //     let points = [];
    //     let facet_indices = [];
    //     for (let v of f.vertices) {
    //         const index = v.vertexIndex - 1;

    //         const vertex = glMatrix.vec3.fromValues(vertexData);
    //     }
    // }

    const primitiveSize = vertexData.length;
    const primitiveObject = new Primitive(primitiveOffset, primitiveSize);
    primitiveData.push(primitiveObject);

    const mesh = new Mesh(vertexCount, vertexData, vertexBuffer, indexData, indexBuffer, indexBufferSize, 
        aabbMin, aabbMax, primitiveData, debugVertexBuffer, debugVertexCount, null, null
    );

    return mesh;
}

// | runs once per mesh
export function createGLBMesh(primitiveAOS, device, primitiveGlobalIndicesAOS,
    meshVertexSize, meshIndexSize, aabbMin, aabbMax, debugVertexCount
) {

    const primitiveData = [];

    const f32SizeBytes      = 4;
    let idxType = null; 

    const vertexElementsCount = 8 // 3-pos, 2-uv, 3-norm
    const vertexStrideBytes = vertexElementsCount * f32SizeBytes;

    for (const primitive of primitiveGlobalIndicesAOS) {
        const globalIndicesOffset = primitive.indexOffset;
        const globalVerticesOffset = primitive.vertexOffset;
        const positions = primitive.positions;
        const texCoords = primitive.texCoords;
        const normals = primitive.normals;
        const indices = primitive.indices;
        const indexTypeSizeBytes = primitive.indexTypeSizeBytes;
 
        const idxType = primitive.idxType;
        
        const idxOffset = globalIndicesOffset;
        const idxOffsetBytes = idxOffset * indexTypeSizeBytes;
        const vertexOffsetBytes = globalVerticesOffset * f32SizeBytes;

        const globalTexturesOffset = globalTextureOffset + primitive.materialIdx;
        
        const idxSize = primitive.indicesCount;
        const idxSizeBytes = idxSize * indexTypeSizeBytes;
        
        const verticesSize = primitive.verticesSize;
        const vertexSizeBytes = verticesSize * f32SizeBytes;
        const vertexCount = verticesSize / vertexElementsCount;

        const primitiveObject = new Primitive(vertexOffsetBytes, vertexSizeBytes, globalVerticesOffset, idxOffset, idxSize,
            idxOffsetBytes, idxSizeBytes, vertexStrideBytes, verticesSize, vertexCount, globalTexturesOffset,
            indexTypeSizeBytes, idxType);

        primitiveData.push(primitiveObject);
        
        
    }

    // const vertexCount = vertexData.length / vertexElementsCount;
    // vertexData = new Float32Array(vertexData);
    // if (idxType === "Uint32Array") indexData = new Uint32Array(indexData);
    // if (idxType === "Uint16Array") indexData = new Uint16Array(indexData);
    // const vertexBuffer = createGPUBuffer(device, vertexData, vertexData.byteLength, GPUBufferUsage.VERTEX);
    // const indexBuffer = createGPUBuffer(device, indexData, indexData.byteLength, GPUBufferUsage.INDEX);

    // debugVertexData = new Float32Array(debugVertexData);
    // const debugVertexBuffer = createGPUBuffer(device, debugVertexData, debugVertexData.byteLength, GPUBufferUsage.VERTEX);

    const mesh = new Mesh(meshVertexSize, meshIndexSize, 
        aabbMin, aabbMax, primitiveData, debugVertexCount
    );

    console.log(mesh)
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
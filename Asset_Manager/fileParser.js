
// import OBJFile from 'obj-file-parser';
import * as glMatrix from 'gl-matrix'

import { createGLBMesh, createMesh } from '../SceneLogic/mesh.js';
import { Entity } from '../SceneLogic/entity.js';
import { getDevice, ZACH_GAME_PATH } from '../Renderer/webgpu.js';
import { getMegaMatrixCPUBufferLength, updateMatrix } from '../SceneLogic/matrix.js';
import { createGPUBuffer } from '../Renderer/buffer.js';
import { globalTextureOffset, globalTextureOffsetIncrement, parseTexturesFromGLB, textureCount, globalTextureCountIncrement } from './texture.js';
import { fanTriangulation } from '../Tools/tools.js';

export const filePaths = [
    ZACH_GAME_PATH + '/models/psx-rat/source/rat.obj',
    ZACH_GAME_PATH + '/models/stop-sign-psx/source/stop-sign.obj',
    // | sadly no pizzeria yet :(
    // | I think file exported wrong
    // | Need to check in blender first
    ZACH_GAME_PATH + '/models/psx_japanese_warehouse.glb',
    // ZACH_GAME_PATH + '/models/pizzeria.glb'
    ZACH_GAME_PATH + '/models/pyramid_head.glb'
];

export const sceneNameToIndexMap = new Map([
    ["rat", 0],
    ['stop-sign', 1],
    ['jap-warehouse', 2],
    // ['pizzeria', 3]
    ['pyramid-head', 3]
]);

let m_entityIdx = 0;
let m_meshIdx = 0;
export async function createEntity(arrayBuffer, path) {
    let meshes = null;
    let json = null;
    let binBuffer = null;
    let materials = null;
    const device = getDevice();

    let result = null;
    let mtlBody = null;
    const extension = path.split('.').pop();
    if (extension === "glb") {
        const glbReturn = await parseGLB(arrayBuffer); 
        meshes = glbReturn.meshes;
        json = glbReturn.json;
        binBuffer = glbReturn.binBuffer;
        globalTextureCountIncrement(json.textures.length);
    } else {

        const models = await parseOBJ(path);
        meshes = [createMesh(models, device)];
        // const objBody = await arrayBuffer.text();
        // const obj = await (async () => {
        //     return new Promise((resolve, reject) => {
        //         const obj = new OBJFile(objBody);
        //         obj.parse();
        //         resolve(obj);
        //     })
        // })();

        // | mtl
        // const mtlRelativePath = obj.result.materialLibraries[0];
        // const lastSlashIdx = path.lastIndexOf('/');
        
        // result = lastSlashIdx !== -1 ? path.substring(0, lastSlashIdx) : path;
        // const mtlPath = result + '/' + mtlRelativePath;

        // mtlBody = await fetch(mtlPath)
        //     .then(r => r.text());
        // materials = parseMTL(mtlBody, result);
        // meshes = [createMesh(obj, device)];
        // globalTextureCountIncrement(1); // | currently only supports one texture for obj files
        
    }

        const translation = glMatrix.vec3.create();
        const color = glMatrix.vec3.create();

        const perEntityGlobalVertexData = [];
        for (const mesh of meshes) {
            mesh.idx = m_meshIdx;
            m_meshIdx++;
            for (const e of mesh.vData) {
                perEntityGlobalVertexData.push(e);
            }
        }

        const perEntityGlobalVertexTypedArray = new Float32Array(perEntityGlobalVertexData);

        const perEntityGlobalVertexBuffer = createGPUBuffer(getDevice(), perEntityGlobalVertexTypedArray, 
            perEntityGlobalVertexTypedArray.byteLength, GPUBufferUsage.VERTEX);

        const modelMatrixIdx = getMegaMatrixCPUBufferLength();

        const name = path.split('/')[3];

        const entity = new Entity(meshes, color, path, modelMatrixIdx, materials, m_entityIdx, extension, 
            perEntityGlobalVertexBuffer, json, binBuffer, globalTextureOffset, name
        );
        if (json) {    
            globalTextureOffsetIncrement(json.images.length);
        } else {
            globalTextureOffsetIncrement(1);
        }

        m_entityIdx++;
        scene.push(entity);

}

async function parseOBJ(path) {
    const text = await (await fetch(path)).text();
    const lines = text.split(/\r?\n/);

    const entityPositions = [];
    const entityTexcoords = [];
    const entityNormals = [];

    let meshPositions = [];
    let meshTexcoords = [];
    let meshNormals = [];

    const entityVertices = [];
    let modelVertices = [];
    let modelName = null;
    const indices = [];

    const vertexMap = new Map();

    const models = [];

    for (const line of lines) {
        const parts = line.trim().split(/\s+/);

        switch (parts[0]) {

            case "o": 
                if (modelVertices.length > 0) {
                    models.push({
                        modelPositions,
                        modelTexcoords,
                        modelNormals,
                        modelVertices,
                        modelName
                    });
                    modelPositions = [];
                    modelTexcoords = [];
                    modelNormals = [];
                    modelVertices = [];
                    modelName = null;

                }
                modelName = parts[1];

            case "v":
                // entityPositions.push(
                //     parseFloat(parts[1]),
                //     parseFloat(parts[2]),
                //     parseFloat(parts[3])
                // );
                modelPositions.push(
                    parseFloat(parts[1]),
                    parseFloat(parts[2]),
                    parseFloat(parts[3])
                );
                break;

            case "vt": 
                // entityTexcoords.push(
                //     parseFloat(parts[1]),
                //     parseFloat(parts[2])
                // );
                modelTexcoords.push(
                    parseFloat(parts[1]),
                    parseFloat(parts[2])
                );
                break;

            case "vn":
                // entityNormals.push(
                //     parseFloat(parts[1]),
                //     parseFloat(parts[2]),
                //     parseFloat(parts[3])
                // );
                modelNormals.push(
                    parseFloat(parts[1]),
                    parseFloat(parts[2]),
                    parseFloat(parts[3])
                );
                break;

            case "f":
            let positionIndex = null;
            let texcoordsIndex = null;
            let normalIndex = null;
            for (let i=1; i<parts.length; i++) {
                const face = parts[i];
                if (!vertexMap.has(face)) {
                    const faceIndices = face.split("/");
                    if (faceIndices.length > 3) {
                        const verts = fanTriangulation(faceIndices);
                        for (let i=0; i<verts.length; i+=3) {
                            positionIndex = verts[i];
                            texcoordsIndex = verts[i+1];
                            normalIndex = verts[i+2];
                            
                            // entityVertices.push(
                            //     positions[positionIndex * 3],
                            //     positions[positionIndex * 3 + 1],
                            //     positions[positionIndex * 3 + 2],
                                
                            //     texcoords[texcoordsIndex * 3],
                            //     texcoords[texcoordsIndex * 3 + 1],
                                
                            //     normals[normalIndex * 3],
                            //     normals[normalIndex * 3 + 1],
                            //     normals[normalIndex * 3 + 2]
                            // );
                            modelVertices.push(
                                modelPositions[positionIndex * 3],
                                modelPositions[positionIndex * 3 + 1],
                                modelPositions[positionIndex * 3 + 2],
                                
                                modelTexcoords[texcoordsIndex * 3],
                                modelTexcoords[texcoordsIndex * 3 + 1],
                                
                                modelNormals[normalIndex * 3],
                                modelNormals[normalIndex * 3 + 1],
                                modelNormals[normalIndex * 3 + 2]
                            );
                            const faceString =        positionIndex + "/"
                                                    + texcoordsIndex + "/" 
                                                    + normalIndex 
                            vertexMap.set(faceString, vertexMap.size);

                        }
                    } else {
                        const [p, t, n] = face.split("/").map(Number);
                        positionIndex = p - 1;
                        texcoordsIndex = t - 1;
                        normalIndex = n - 1;

                        // entityVertices.push(
                        //     positions[positionIndex * 3],
                        //     positions[positionIndex * 3 + 1],
                        //     positions[positionIndex * 3 + 2],
    
                        //     texcoords[texcoordsIndex * 3],
                        //     texcoords[texcoordsIndex * 3 + 1],
    
                        //     normals[normalIndex * 3],
                        //     normals[normalIndex * 3 + 1],
                        //     normals[normalIndex * 3 + 2]
                        // );
                        modelVertices.push(
                            modelPositions[positionIndex * 3],
                            modelPositions[positionIndex * 3 + 1],
                            modelPositions[positionIndex * 3 + 2],
    
                            modelTexcoords[texcoordsIndex * 3],
                            modelTexcoords[texcoordsIndex * 3 + 1],
    
                            modelNormals[normalIndex * 3],
                            modelNormals[normalIndex * 3 + 1],
                            modelNormals[normalIndex * 3 + 2]
                        );
    
                        vertexMap.set(face, vertexMap.size);
                    }

                }
                indices.push(vertexMap.get(face));
            }
        }
    }

    models.push({
        positions: modelPositions,
        texcoords: modelTexcoords,
        normals: modelNormals,
        vertices: modelVertices,
        modelName: modelName
    });
    return models;
}


function parseMTL(mtlText, path) {

    // name to path
    const materials = new Map();

    const lines = mtlText.split('\n');

    let currentMaterialName = null;

    for (const rawLine of lines) {
        const line = rawLine.trim();

        if (line.length === 0 || line.startsWith('#')) continue;

        const parts = line.split(/\s+/);

        const keyword = parts[0];

        switch (keyword) {

            case 'newmtl': {
                const materialName = parts[1];

                currentMaterialName = materialName,

                    materials.set(
                        materialName,
                        null
                    );

                break;
            }

            case 'map_Kd': {
                if (!currentMaterialName) break;
                materials.set(currentMaterialName, 'models/' + parts[1]);
                break;
            }
        }
    }

    return materials;
}



export async function parseGLB(arrayBuffer) {
    const view = new DataView(arrayBuffer);

    const magic = String.fromCharCode(
        view.getUint8(0),
        view.getUint8(1),
        view.getUint8(2),
        view.getUint8(3)
    );

    if (magic !== "glTF") throw new Error("File is not GLB");

    const version = view.getUint32(4, true);
    const length = view.getUint32(8, true);

    let offset = 12;

    let json = null;
    let binBuffer = null;
    let binOffset = null;

    while (offset < length) {
        const chunkLength = view.getUint32(offset, true);
        offset += 4;

        const chunkType = view.getUint32(offset, true);
        offset += 4;

        const chunkBytes = new Uint8Array(arrayBuffer, offset, chunkLength);

        // JSON chunk
        if (chunkType === 0x4E4F534A) {
            json = JSON.parse(new TextDecoder().decode(chunkBytes));
        }

        // BIN chunk
        if (chunkType === 0x004E4942) {
            // binBuffer = chunkBytes.buffer;
            binBuffer = arrayBuffer.slice(offset, offset + chunkLength);
        }

        offset += chunkLength;
    }
    
    const meshes = [];

    const textureCount = json.images.length;
    
    for (const mesh of json.meshes) {
        const primitives =  [];

        for (let i = 0; i < mesh.primitives.length; i++) {

            const primitiveStruct = {
                positions: null,
                texCoords: null,
                normals: null,
                indices: null,
                materialIdx: null,
                indicesCount: null
            };

            const primitive = mesh.primitives[i];

            let accessorIndex = null;

            let accessor = null;

            let bufferView = null;

            let finalByteOffset = null;

            let vertexElements = null;

            let verticesCount = null;

            // | Positions
            accessorIndex = primitive.attributes.POSITION;
            accessor = json.accessors[accessorIndex];
            bufferView = json.bufferViews[accessor.bufferView];
            finalByteOffset = (bufferView.byteOffset || 0) + (accessor.byteOffset || 0);
            vertexElements = getVertexElementsFromGLB(accessor.type);
            verticesCount = vertexElements * accessor.count;
            primitiveStruct.positions = getTypedArrayFromGLB(accessor.componentType, binBuffer, finalByteOffset, verticesCount);

            // | UV's
            accessorIndex = primitive.attributes.TEXCOORD_0;
            accessor = json.accessors[accessorIndex];
            bufferView = json.bufferViews[accessor.bufferView];
            finalByteOffset = (bufferView.byteOffset || 0) + (accessor.byteOffset || 0);
            vertexElements = getVertexElementsFromGLB(accessor.type);
            verticesCount = vertexElements * accessor.count;
            primitiveStruct.texCoords = getTypedArrayFromGLB(accessor.componentType, binBuffer, finalByteOffset, verticesCount);

            // | Normals
            accessorIndex = primitive.attributes.NORMAL;
            accessor = json.accessors[accessorIndex];
            bufferView = json.bufferViews[accessor.bufferView];
            finalByteOffset = (bufferView.byteOffset || 0) + (accessor.byteOffset || 0);
            vertexElements = getVertexElementsFromGLB(accessor.type);
            verticesCount = vertexElements * accessor.count;
            primitiveStruct.normals = getTypedArrayFromGLB(accessor.componentType, binBuffer, finalByteOffset, verticesCount);

            // | Indices
            accessorIndex = primitive.indices;
            accessor = json.accessors[accessorIndex];
            bufferView = json.bufferViews[accessor.bufferView];
            finalByteOffset = (bufferView.byteOffset || 0) + (accessor.byteOffset || 0);
            vertexElements = getVertexElementsFromGLB(accessor.type);
            verticesCount = accessor.count;
            primitiveStruct.indicesCount = accessor.count;

            primitiveStruct.indices = getTypedArrayFromGLB(accessor.componentType, binBuffer, finalByteOffset, verticesCount);

            primitiveStruct.materialIdx = primitive.material;

            primitives.push(primitiveStruct);
        }

        meshes.push(createGLBMesh(primitives, getDevice()));

    }

    return {
        meshes: meshes,
        json:   json,
        binBuffer: binBuffer,
        textureCount: textureCount
    };
}

function getVertexElementsFromGLB(type) {
    switch (type) {
        case 'VEC3':    return 3;
        case 'VEC2':    return 2;
        case 'SCALAR':  return 1
        default: throw new Error("getVertexElementsFromGLB failure");
    }
}

function getTypedArrayFromGLB(componentType, buffer, offset, length) {
    switch (componentType) {
        case 5126: return new Float32Array(buffer, offset, length);
        case 5123: return new Uint16Array(buffer, offset, length);
        case 5125: return new Uint32Array(buffer, offset, length);
        case 5121: return new Uint8Array(buffer, offset, length);
        default: throw new Error("GLB has unknown type");
    }
}
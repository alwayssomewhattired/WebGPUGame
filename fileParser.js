
import OBJFile from './node_modules/obj-file-parser/dist/OBJFile.js';
import * as glMatrix from 'gl-matrix'

import { createGLBMesh, createMesh } from './mesh.js';
import { Entity } from './entity.js';
import { getDevice } from './webgpu.js';
import { getMegaMatrixCPUBufferLength, updateMatrix } from './matrix.js';
import { createGPUBuffer } from './buffer.js';

const filePaths = [
    './models/psx-rat/source/rat.obj',
    './models/stop-sign-psx/source/stop-sign.obj',
    // | sadly no pizzeria yet :(
    // | I think file exported wrong
    // | Need to check in blender first
    './models/pizzeria.glb'
];

export const sceneNameToIndexMap = new Map([
    ["rat", 0],
    ['stop-sign', 1],
    ['pizzeria', 2]
]);

export async function createEntities() {
    let idx = 0;
    let meshes = null;
    let materials = null;
    const device = getDevice();
    let meshIdx = 0;

    let result = null;
    let mtlBody = null;

    for (const path of filePaths) {
        const extension = path.split('.').pop();
        if (extension === "glb") {
            meshes = await parseGLB(path); 
        } else {
            const objResponse = await fetch(path);
            const objBody = await objResponse.text();
            const obj = await (async () => {
                return new Promise((resolve, reject) => {
                    const obj = new OBJFile(objBody);
                    obj.parse();
                    resolve(obj);
                })
            })();

            // | mtl
            const mtlRelativePath = obj.result.materialLibraries[0];
            const lastSlashIdx = path.lastIndexOf('/');
            result = lastSlashIdx !== -1 ? path.substring(0, lastSlashIdx) : path;
            const mtlPath = result + '/' + mtlRelativePath;

            mtlBody = await fetch(mtlPath)
                .then(r => r.text());
            materials = parseMTL(mtlBody, result);
            meshes = [createMesh(obj, device)];

        }

        const translation = glMatrix.vec3.create();
        const color = glMatrix.vec3.create();

        const perEntityGlobalVertexData = [];
        for (const mesh of meshes) {
            mesh.idx = meshIdx;
            meshIdx++;
            for (const e of mesh.vData) {
                perEntityGlobalVertexData.push(e);
            }
        }

        const perEntityGlobalVertexTypedArray = new Float32Array(perEntityGlobalVertexData);

        const perEntityGlobalVertexBuffer = createGPUBuffer(getDevice(), perEntityGlobalVertexTypedArray, 
            perEntityGlobalVertexTypedArray.byteLength, GPUBufferUsage.VERTEX);

        const modelMatrixIdx = getMegaMatrixCPUBufferLength();


        const entity = new Entity(meshes, color, path, modelMatrixIdx, materials, idx, extension, perEntityGlobalVertexBuffer);
        idx++;
        scene.push(entity);
    }
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

// 1: rat
// 2: stop-sign
const scene = [];

export function getScene() {
    if (scene.length > 0) {
        return scene;
    } else {
        throw new Error("Scene is empty!!!");
    }
}

export function getEntity(objectName) {
    const index = sceneNameToIndexMap.get(objectName);
    return scene[index];
}

export function updateEntity(objectName, translation, rotation, scale) {
    const entity = getEntity(objectName);
    const incrementedTranslation = translation;
    for (const mesh of entity.meshes) {
        const translationOut = mesh.getTranslation();
        const rotationOut = mesh.getRotation();
        glMatrix.vec3.add(incrementedTranslation, incrementedTranslation, glMatrix.vec3.fromValues(0.001, 0.0, 0.0));
        mesh.setTranslation(glMatrix.vec3.add(translationOut, translationOut, incrementedTranslation));
        mesh.setRotation(glMatrix.vec3.add(rotationOut, rotationOut, rotation));
        mesh.setScale(scale);
        updateMatrix(mesh);
    }
}

// | our hardcoded entity updates
export function updateEntities() {

    let translation = null;
    let rotation = null;
    let scale = null;

    translation = glMatrix.vec3.fromValues(0, 0, 0);
    scale = glMatrix.vec3.fromValues(0.1, 0.1, 0.1);
    rotation = glMatrix.vec3.fromValues(0, 0, 0);
    updateEntity('rat', translation, rotation, scale);

    translation = glMatrix.vec3.fromValues(2, 2, 5);
    scale = glMatrix.vec3.fromValues(0.01, 0.01, 0.01);
    rotation = glMatrix.vec3.fromValues(0, 4.5, 0);
    updateEntity('stop-sign', translation, rotation, scale);

    // translation = glMatrix.vec3.fromValues(2, 2, 5);
    // scale = glMatrix.vec3.fromValues(0.01, 0.01, 0.01);
    // rotation = glMatrix.vec3.fromValues(0, 4.5, 0);
    // updateEntity('pizzeria', translation, rotation, scale);

}

async function parseGLB(url) {
    const arrayBuffer = await fetch(url).then(r => r.arrayBuffer());
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
            binBuffer = chunkBytes.buffer;
        }

        offset += chunkLength;
    }
    
    const meshes = [];
    
    for (const mesh of json.meshes) {
        const primitives =  [];

        for (let i = 0; i < mesh.primitives.length; i++) {

            const primitiveStruct = {
                positions: null,
                texCoords: null,
                normals: null,
                indices: null
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
            verticesCount = vertexElements * accessor.count;
            primitiveStruct.indices = getTypedArrayFromGLB(accessor.componentType, binBuffer, finalByteOffset, verticesCount);
            primitives.push(primitiveStruct);
        }

        meshes.push(createGLBMesh(primitives, getDevice()));

    }
    
    return meshes;
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
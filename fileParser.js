
import OBJFile from './node_modules/obj-file-parser/dist/OBJFile.js';
import * as glMatrix from 'gl-matrix'

import { createMesh } from './mesh.js';
import { Entity } from './entity.js';
import { getDevice } from './webgpu.js';
import { getGlobalModelMatricesLength, createAndStoreModelMatrix } from './matrix.js';

const filePaths = [
    './models/psx-rat/rat.obj',
    './models/stop-sign-psx/source/stop-sign.obj'
];

export const sceneNameToIndexMap = new Map([
    ["rat",         0],
    ['stop-sign',   1]
]);

export async function createEntities() {
    for (const path of filePaths) {
        const objResponse = await fetch(path);
        const objBody = await objResponse.text();
        const obj = await (async() => {
            return new Promise((resolve, reject) => {
                const obj = new OBJFile(objBody);
                obj.parse();
                resolve(obj);
            })
        })();
        const device = getDevice();
        const mesh = createMesh(obj, device);
        const translation = glMatrix.vec3.create();
        const color = glMatrix.vec3.create();

        const modelMatrixIdx = getGlobalModelMatricesLength();
        const entity = new Entity(mesh, color, path, modelMatrixIdx);
        scene.push(entity);
    }
}

// 1: rat
// 2: stop-sign
const scene = [];

export function getScene() {
    if (scene.length > 0) {
        return scene ;
    } else {
        throw new Error ("Scene is empty!!!");
    }
}

export function getEntity(objectName) {
    const index = sceneNameToIndexMap.get(objectName);
    return scene[index];
}

export function updateEntity(objectName, translation, rotation, scale) {
    const entity = getEntity(objectName);
    if (translation) entity.translation = translation;
    if (rotation) entity.rotation = rotation;
    if (scale) entity.scale = scale;
    entity.updateModelMatrix();
}

// | our hardcoded entity updates
export function updateEntities() {
    
    const scale = glMatrix.vec3.fromValues(0.01,0.01,0.01);
    const rotation = glMatrix.vec3.fromValues(0, 4.5, 0);
    updateEntity('stop-sign', 0, rotation, scale);
}

import OBJFile from './node_modules/obj-file-parser/dist/OBJFile.js';
import * as glMatrix from 'gl-matrix'

import { createMesh } from './mesh.js';
import { Entity } from './entity.js';
import { getDevice } from './webgpu.js';
import { getMegaMatrixCPUBufferLength } from './matrix.js';

const filePaths = [
    './models/psx-rat/source/rat.obj',
    './models/stop-sign-psx/source/stop-sign.obj'
];

export const sceneNameToIndexMap = new Map([
    ["rat",         0],
    ['stop-sign',   1]
]);

export async function createEntities() {
    let idx = 0;
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

        // | mtl
        const mtlRelativePath = obj.result.materialLibraries[0];
        const lastSlashIdx = path.lastIndexOf('/');
        const result = lastSlashIdx !== -1 ? path.substring(0, lastSlashIdx) : path;
        const mtlPath = result + '/' + mtlRelativePath;

        const mtlBody = await fetch(mtlPath)
                            .then(r => r.text());
        const materials = parseMTL(mtlBody, result);

        const device = getDevice();
        const mesh = createMesh(obj, device);
        const translation = glMatrix.vec3.create();
        const color = glMatrix.vec3.create();

        const modelMatrixIdx = getMegaMatrixCPUBufferLength();
        const entity = new Entity(mesh, color, path, modelMatrixIdx, materials, idx);
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

    glMatrix.vec3.add(entity.translation, entity.translation, translation);
    glMatrix.vec3.add(entity.rotation, entity.rotation, rotation);
    entity.scale = scale;
    entity.updateMatrix();
}

// | our hardcoded entity updates
export function updateEntities() {

    let translation = null;
    let rotation = null;
    let scale = null;
    
    translation = glMatrix.vec3.fromValues(0,0,0);
    scale = glMatrix.vec3.fromValues(0.1,0.1,0.1);
    rotation = glMatrix.vec3.fromValues(0, 0, 0);
    updateEntity('rat', translation, rotation, scale);

    translation = glMatrix.vec3.fromValues(2,2,5);
    scale = glMatrix.vec3.fromValues(0.01,0.01,0.01);
    rotation = glMatrix.vec3.fromValues(0, 4.5, 0);
    updateEntity('stop-sign', translation, rotation, scale);

}
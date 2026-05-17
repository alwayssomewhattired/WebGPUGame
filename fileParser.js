
import OBJFile from './node_modules/obj-file-parser/dist/OBJFile.js';
import * as glMatrix from 'gl-matrix'

import { createMesh } from './mesh.js';
import { Entity } from './entity.js';
import { getDevice } from './webgpu.js';
import { getGlobalModelMatricesLength, createAndStoreModelMatrix } from './matrix.js';

const filePaths = [
    './models/psx-rat/rat.obj'
];

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

        const modelMatrixID = getGlobalModelMatricesLength();
        const entity = new Entity(mesh, color, path, modelMatrixID);
        
    }
}

// | Holds all entities
// | Every Entity holds 
const scene = [];

export function getScene() {
    if (scene.length > 0) {
        return scene ;
    } else {
        throw new Error ("Scene is empty!!!");
    }
}

export function setScene(entity) {
    scene.push(entity);
}


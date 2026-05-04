
import OBJFile from './node_modules/obj-file-parser/dist/OBJFile.js';
import * as glMatrix from 'gl-matrix'

import { createMesh } from './mesh.js';
import { Entity, scene } from './entity.js';
import { getDevice } from './webgpu.js';

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
        const positions = glMatrix.vec3.create();
        const color = glMatrix.vec3.create();
        const entity = new Entity(mesh, positions, color, path);
        scene.push(entity);
    }
}


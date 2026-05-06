
import * as glMatrix from 'gl-matrix'

import { getDevice } from './webgpu.js';
import { createGPUBuffer } from './buffer.js';

export class Entity {
    constructor(mesh, translation, color, id) {
        this.mesh = mesh;
        this.translation = glMatrix.vec3.clone(translation);
        this.rotation = glMatrix.vec3.fromValues(0, 0, 0);
        this.scale = glMatrix.vec3.fromValues(1, 1, 1);
        this.color = color;
        this.modelMatrix = glMatrix.mat4.create();
        this.boundingBox_ls = {
            min: [-1.0, -1.0, -1.0],
            max: [1.0, 1.0, 1.0]
        };
        // this.aabbGPUBuffer = createGPUBuffer(getDevice(), this.boundingBox_ls, this.boundingBox_ls.byteLength, GPUBufferUsage.VERTEX);
        this.id = id;
        scene.push(this);
    }

    updateModelMatrix() {
        glMatrix.mat4.identity(this.modelMatrix);
        glMatrix.mat4.translate(this.modelMatrix, this.modelMatrix, this.translation);
        glMatrix.mat4.rotateX(this.modelMatrix, this.modelMatrix, this.rotation[0]);
        glMatrix.mat4.rotateY(this.modelMatrix, this.modelMatrix, this.rotation[1]);
        glMatrix.mat4.rotateZ(this.modelMatrix, this.modelMatrix, this.rotation[2]);
        glMatrix.mat4.scale(this.modelMatrix, this.modelMatrix, this.scale);
    }
}

// | Holds all entities
const scene = [];

export function getScene() {
    if (scene.length > 0) {
        return scene ;
    } else {
        throw new Error ("Scene is empty!!!");
    }
}


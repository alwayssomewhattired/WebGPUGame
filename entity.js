
import * as glMatrix from 'gl-matrix'

import { createGPUBuffer } from './buffer.js';
import { getScene, setScene } from './fileParser.js';

export class Entity {
    constructor(mesh, color, id) {
        this.mesh = mesh;
        this.translation = glMatrix.vec3.fromValues(0.0, 0.0, -10.0);
        this.rotation = glMatrix.vec3.fromValues(0, 0, 0);
        this.scale = glMatrix.vec3.fromValues(0.2, 0.2, 0.2);
                
        this.color = color;
        this.modelMatrix = glMatrix.mat4.create();
        this.id = id;
        setScene(this);
        this.updateModelMatrix();
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
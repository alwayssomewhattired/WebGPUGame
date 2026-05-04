
import * as glMatrix from 'gl-matrix'

export class Entity {
    constructor(mesh, position, color, id) {
        this.mesh = mesh;
        this.position = glMatrix.vec3.clone(position);
        this.rotation = glMatrix.vec3.fromValues(0, 0, 0);
        this.scale = glMatrix.vec3.fromValues(1, 1, 1);
        this.color = color;
        this.modelMatrix = glMatrix.mat4.create();
        this.id = id;
    }

    updateMatrix() {
        glMatrix.mat4.identity(this.modelMatrix);
        glMatrix.mat4.translate(this.modelMatrix, this.modelMatrix, this.position);
        glMatrix.mat4.rotateX(this.modelMatrix, this.modelMatrix, this.rotation[0]);
        glMatrix.mat4.rotateY(this.modelMatrix, this.modelMatrix, this.rotation[1]);
        glMatrix.mat4.rotateZ(this.modelMatrix, this.modelMatrix, this.rotation[2]);
        glMatrix.mat4.scale(this.modelMatrix, this.modelMatrix, this.scale);
    }
}

// | Holds all entities
export const scene = [];


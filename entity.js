
import * as glMatrix from 'gl-matrix'

import { createGPUBuffer } from './buffer.js';
import { getScene, setScene } from './fileParser.js';
import { createModelMatrix, getModelMatrix } from './matrix.js';

export class Entity {
    constructor(mesh, color, id, modelMatrixIdx) {
        this.mesh = mesh;
        this.translation = glMatrix.vec3.fromValues(0.0, 0.0, -10.0);
        this.rotation = glMatrix.vec3.fromValues(0, 0, 0);
        this.scale = glMatrix.vec3.fromValues(0.2, 0.2, 0.2);
                
        this.color = color;

        this.modelMatrixIdx = modelMatrixIdx;
        this.aabbModelIdx = modelMatrixIdx + 1;
        this.axisArrows = {
            modelIdx: modelMatrixIdx + 2,
            aabbModelIdx: modelMatrixIdx + 3
        };

        this.isSelected = false;
        this.pipeline = "main";
        this.id = id;
        setScene(this);
        // this.updateModelMatrix();
        this.initModelMatrix();
    }

    initModelMatrix() {

        const modelMatrix = createModelMatrix();

        glMatrix.mat4.identity(modelMatrix);
        glMatrix.mat4.translate(modelMatrix, modelMatrix, this.translation);
        glMatrix.mat4.rotateX(modelMatrix, modelMatrix, this.rotation[0]);
        glMatrix.mat4.rotateY(modelMatrix, modelMatrix, this.rotation[1]);
        glMatrix.mat4.rotateZ(modelMatrix, modelMatrix, this.rotation[2]);
        glMatrix.mat4.scale(modelMatrix, modelMatrix, this.scale);

        const aabbModelMatrix = createModelMatrix();

        glMatrix.mat4.identity(aabbModelMatrix);
        glMatrix.mat4.translate(aabbModelMatrix, aabbModelMatrix, this.translation);
        glMatrix.mat4.rotateX(aabbModelMatrix, aabbModelMatrix, this.rotation[0]);
        glMatrix.mat4.rotateY(aabbModelMatrix, aabbModelMatrix, this.rotation[1]);
        glMatrix.mat4.rotateZ(aabbModelMatrix, aabbModelMatrix, this.rotation[2]);
        glMatrix.mat4.scale(aabbModelMatrix, aabbModelMatrix, this.scale);

        const axisArrowsModelMatrix = createModelMatrix();
        const axisArrowsScale = glMatrix.vec3.fromValues(1.0, 1.0, 1.0);
        glMatrix.mat4.identity(axisArrowsModelMatrix);
        glMatrix.mat4.translate(axisArrowsModelMatrix, axisArrowsModelMatrix, this.translation);
        glMatrix.mat4.rotateX(axisArrowsModelMatrix, axisArrowsModelMatrix, this.rotation[0]);
        glMatrix.mat4.rotateY(axisArrowsModelMatrix, axisArrowsModelMatrix, this.rotation[1]);
        glMatrix.mat4.rotateZ(axisArrowsModelMatrix, axisArrowsModelMatrix, this.rotation[2]);
        glMatrix.mat4.scale(axisArrowsModelMatrix, axisArrowsModelMatrix, axisArrowsScale);

        
        const axisArrowsAABBModelMatrix = createModelMatrix();

        glMatrix.mat4.identity(aabbModelMatrix);
        glMatrix.mat4.translate(aabbModelMatrix, aabbModelMatrix, this.translation);
        glMatrix.mat4.rotateX(aabbModelMatrix, aabbModelMatrix, this.rotation[0]);
        glMatrix.mat4.rotateY(aabbModelMatrix, aabbModelMatrix, this.rotation[1]);
        glMatrix.mat4.rotateZ(aabbModelMatrix, aabbModelMatrix, this.rotation[2]);
        glMatrix.mat4.scale(aabbModelMatrix, aabbModelMatrix, axisArrowsScale);
    }
}
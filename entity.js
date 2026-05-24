
import * as glMatrix from 'gl-matrix'

import { createGPUBuffer, getAlignedSize, updateDynamicGPUBuffer } from './buffer.js';
import { updateModelMatrix as bufferUpdateModelMatrix } from './matrix.js';
import { getScene, setScene } from './fileParser.js';
import { createAndStoreModelMatrix, getModelMatrix } from './matrix.js';
import { getDynamicModelMatrixUBO } from './uniform.js';


// | Entity holds four indices
// | Entity holds four model matrices
export class Entity {
    constructor(mesh, color, id, modelMatrixIdx) {
        this.mesh = mesh;
        this.translation = glMatrix.vec3.fromValues(0.0, 0.0, -10.0);
        this.rotation = glMatrix.vec3.fromValues(0, 0, 0);
        this.scale = glMatrix.vec3.fromValues(0.2, 0.2, 0.2);
                
        this.color = color;

        this.modelMatrixLength = 4; 
        this.modelMatrixIdx = modelMatrixIdx;
        this.aabbModelIdx = modelMatrixIdx + 1;
        this.axisArrowsModelIdx = modelMatrixIdx + 2
        this.axisArrowsAABBModelIdx = modelMatrixIdx + 3;
        this.rotationArcModelIdx = modelMatrixIdx + 4;
        this.rotationArcHeadModelIdx = modelMatrixIdx + 5;

        this.modelMatrixBufferOffset 

        this.isSelected = false;
        this.pipeline = "main";
        this.id = id;
        setScene(this);
        // this.updateModelMatrix();
        this.initModelMatrix();
    }

    initModelMatrix() {
        const modelMatrix = glMatrix.mat4.create();
        glMatrix.mat4.identity(modelMatrix);
        glMatrix.mat4.translate(modelMatrix, modelMatrix, this.translation);
        glMatrix.mat4.rotateX(modelMatrix, modelMatrix, this.rotation[0]);
        glMatrix.mat4.rotateY(modelMatrix, modelMatrix, this.rotation[1]);
        glMatrix.mat4.rotateZ(modelMatrix, modelMatrix, this.rotation[2]);
        glMatrix.mat4.scale(modelMatrix, modelMatrix, this.scale);
        createAndStoreModelMatrix(modelMatrix);


        const aabbModelMatrix = glMatrix.mat4.create();
        glMatrix.mat4.identity(aabbModelMatrix);
        glMatrix.mat4.translate(aabbModelMatrix, aabbModelMatrix, this.translation);
        glMatrix.mat4.rotateX(aabbModelMatrix, aabbModelMatrix, this.rotation[0]);
        glMatrix.mat4.rotateY(aabbModelMatrix, aabbModelMatrix, this.rotation[1]);
        glMatrix.mat4.rotateZ(aabbModelMatrix, aabbModelMatrix, this.rotation[2]);
        glMatrix.mat4.scale(aabbModelMatrix, aabbModelMatrix, this.scale);
        createAndStoreModelMatrix(aabbModelMatrix);

        const axisArrowsModelMatrix = glMatrix.mat4.create();
        const axisArrowsScale = glMatrix.vec3.fromValues(1.0, 1.0, 1.0);
        glMatrix.mat4.identity(axisArrowsModelMatrix);
        glMatrix.mat4.translate(axisArrowsModelMatrix, axisArrowsModelMatrix, this.translation);
        glMatrix.mat4.rotateX(axisArrowsModelMatrix, axisArrowsModelMatrix, this.rotation[0]);
        glMatrix.mat4.rotateY(axisArrowsModelMatrix, axisArrowsModelMatrix, this.rotation[1]);
        glMatrix.mat4.rotateZ(axisArrowsModelMatrix, axisArrowsModelMatrix, this.rotation[2]);
        glMatrix.mat4.scale(axisArrowsModelMatrix, axisArrowsModelMatrix, axisArrowsScale);
        createAndStoreModelMatrix(axisArrowsModelMatrix);
        
        const axisArrowsAABBModelMatrix = glMatrix.mat4.create();
        const axisArrowsAABBScale = glMatrix.vec3.fromValues(1.0, 1.0, 1.0);
        glMatrix.mat4.identity(axisArrowsAABBModelMatrix);
        glMatrix.mat4.translate(axisArrowsAABBModelMatrix, axisArrowsAABBModelMatrix, this.translation);
        glMatrix.mat4.rotateX(axisArrowsAABBModelMatrix, axisArrowsAABBModelMatrix, this.rotation[0]);
        glMatrix.mat4.rotateY(axisArrowsAABBModelMatrix, axisArrowsAABBModelMatrix, this.rotation[1]);
        glMatrix.mat4.rotateZ(axisArrowsAABBModelMatrix, axisArrowsAABBModelMatrix, this.rotation[2]);
        glMatrix.mat4.scale(axisArrowsAABBModelMatrix, axisArrowsAABBModelMatrix, axisArrowsAABBScale);
        createAndStoreModelMatrix(axisArrowsAABBModelMatrix);

        const rotationArcModelMatrix = glMatrix.mat4.create();
        glMatrix.mat4.identity(rotationArcModelMatrix);
        glMatrix.mat4.translate(rotationArcModelMatrix, rotationArcModelMatrix, this.translation);
        glMatrix.mat4.rotateX(rotationArcModelMatrix, rotationArcModelMatrix, this.rotation[0]);
        glMatrix.mat4.rotateY(rotationArcModelMatrix, rotationArcModelMatrix, this.rotation[1]);
        glMatrix.mat4.rotateZ(rotationArcModelMatrix, rotationArcModelMatrix, this.rotation[2]);
        createAndStoreModelMatrix(rotationArcModelMatrix);

        const rotationArcHeadModelMatrix = glMatrix.mat4.create();
        const rotationArcHeadScale = glMatrix.vec3.fromValues(0.1, 0.1, 0.1);
        glMatrix.mat4.identity(rotationArcHeadModelMatrix);
        glMatrix.mat4.translate(rotationArcHeadModelMatrix, rotationArcHeadModelMatrix, this.translation);
        glMatrix.mat4.translate(rotationArcHeadModelMatrix, rotationArcHeadModelMatrix, [1.0, 0, 0]);
        glMatrix.mat4.rotateX(rotationArcHeadModelMatrix, rotationArcHeadModelMatrix, this.rotation[0]);
        glMatrix.mat4.rotateY(rotationArcHeadModelMatrix, rotationArcHeadModelMatrix, this.rotation[1]);
        glMatrix.mat4.rotateZ(rotationArcHeadModelMatrix, rotationArcHeadModelMatrix, this.rotation[2]);
        glMatrix.mat4.scale(rotationArcHeadModelMatrix, rotationArcHeadModelMatrix, rotationArcHeadScale);

        createAndStoreModelMatrix(rotationArcHeadModelMatrix);

    }

    updateModelMatrix() {
        // const modelMatrix = glMatrix.mat4.create();
        // glMatrix.mat4.identity(modelMatrix);
        // glMatrix.mat4.translate(modelMatrix, modelMatrix, this.translation);
        // glMatrix.mat4.rotateX(modelMatrix, modelMatrix, this.rotation[0]);
        // glMatrix.mat4.rotateY(modelMatrix, modelMatrix, this.rotation[1]);
        // glMatrix.mat4.rotateZ(modelMatrix, modelMatrix, this.rotation[2]);
        // glMatrix.mat4.scale(modelMatrix, modelMatrix, this.scale);

        bufferUpdateModelMatrix(this);

        const alignedSize = getAlignedSize(64);
        updateDynamicGPUBuffer(alignedSize, this, getDynamicModelMatrixUBO());
    }
}

import * as glMatrix from 'gl-matrix'

import { getAlignedSize } from './buffer.js';
import { getMegaMatrixCPUBufferLength, getViewMatrix } from './matrix.js';
import { getScene } from './fileParser.js';
import { updateMatrix as matrix_updateMatrix, createAndStoreMatrix, getMatrix } from './matrix.js';
import { getMegaMatrixUBO } from './uniform.js';

export class Entity {
    constructor(meshes, color, id, modelMatrixIdx, materials, idx, fileExt, perEntityGlobalVertexBuffer) {

        this.idx = idx;
        this.fileExt = fileExt;

        this.textureIdx = null;
        this.textureOffset = null;

        this.meshes = meshes;
        this.perEntityGlobalVertexBuffer = perEntityGlobalVertexBuffer;
            // this.translation = glMatrix.vec3.fromValues(0.0, 0.0, -10.0);
            // this.rotation = glMatrix.vec3.fromValues(0, 0, 0);
            // this.scale = glMatrix.vec3.fromValues(0.2, 0.2, 0.2);

        this.materials = materials;

        this.color = color;

        this.modelMatrixLength = 8; 
        // this.modelMatrixIdx = modelMatrixIdx;
        // this.aabbModelIdx = modelMatrixIdx + 1;
        // this.axisArrowsModelIdx = modelMatrixIdx + 2
        // this.axisArrowsAABBModelIdx = modelMatrixIdx + 3;
        // this.rotationArcModelIdx = modelMatrixIdx + 4;
        // this.rotationArcHeadModelIdx = modelMatrixIdx + 5;
        // this.modelViewIdx = modelMatrixIdx + 6;
        // this.normalMatrixIdx = modelMatrixIdx + 7;

        // this.modelMatrixBufferOffset;

        this.isSelected = false;
        this.pipeline = "main";
        this.id = id;
        // this.initMatrixIndices();
        // this.initModelMatrix();
    }

    // initMatrixIndices() {
    //     let matrixCount = getMegaMatrixCPUBufferLength();
    //     for (const mesh of this.meshes) {
    //         mesh.modelMatrixIdx = matrixCount;
    //         matrixCount += this.modelMatrixLength;
    //     }
    // }

    // initModelMatrix() {
    //     for (const mesh of this.meshes) {
    //         const translation = mesh.getTranslation();
    //         const rotation = mesh.getRotation();
    //         const scale = mesh.getScale()
    //         const modelMatrix = glMatrix.mat4.create();
    //         glMatrix.mat4.identity(modelMatrix);
    //         glMatrix.mat4.translate(modelMatrix, modelMatrix, mesh.getTranslation());
    //         glMatrix.mat4.rotateX(modelMatrix, modelMatrix, rotation[0]);
    //         glMatrix.mat4.rotateY(modelMatrix, modelMatrix, rotation[1]);
    //         glMatrix.mat4.rotateZ(modelMatrix, modelMatrix, rotation[2]);
    //         glMatrix.mat4.scale(modelMatrix, modelMatrix, scale);
    //         mesh.modelMatrixIdx = createAndStoreMatrix(modelMatrix);

    //         const aabbModelMatrix = glMatrix.mat4.create();
    //         glMatrix.mat4.identity(aabbModelMatrix);
    //         glMatrix.mat4.translate(aabbModelMatrix, aabbModelMatrix, translation);
    //         glMatrix.mat4.rotateX(aabbModelMatrix, aabbModelMatrix, rotation[0]);
    //         glMatrix.mat4.rotateY(aabbModelMatrix, aabbModelMatrix, rotation[1]);
    //         glMatrix.mat4.rotateZ(aabbModelMatrix, aabbModelMatrix, rotation[2]);
    //         glMatrix.mat4.scale(aabbModelMatrix, aabbModelMatrix, scale);
    //         mesh.aabbModelIdx = createAndStoreMatrix(aabbModelMatrix);

    //         const axisArrowsModelMatrix = glMatrix.mat4.create();
    //         const axisArrowsScale = glMatrix.vec3.fromValues(1.0, 1.0, 1.0);
    //         glMatrix.mat4.identity(axisArrowsModelMatrix);
    //         glMatrix.mat4.translate(axisArrowsModelMatrix, axisArrowsModelMatrix, translation);
    //         glMatrix.mat4.rotateX(axisArrowsModelMatrix, axisArrowsModelMatrix, rotation[0]);
    //         glMatrix.mat4.rotateY(axisArrowsModelMatrix, axisArrowsModelMatrix, rotation[1]);
    //         glMatrix.mat4.rotateZ(axisArrowsModelMatrix, axisArrowsModelMatrix, rotation[2]);
    //         glMatrix.mat4.scale(axisArrowsModelMatrix, axisArrowsModelMatrix, axisArrowsScale);
    //         mesh.axisArrowsModelIdx = createAndStoreMatrix(axisArrowsModelMatrix);

    //         const axisArrowsAABBModelMatrix = glMatrix.mat4.create();
    //         const axisArrowsAABBScale = glMatrix.vec3.fromValues(1.0, 1.0, 1.0);
    //         glMatrix.mat4.identity(axisArrowsAABBModelMatrix);
    //         glMatrix.mat4.translate(axisArrowsAABBModelMatrix, axisArrowsAABBModelMatrix, translation);
    //         glMatrix.mat4.rotateX(axisArrowsAABBModelMatrix, axisArrowsAABBModelMatrix, rotation[0]);
    //         glMatrix.mat4.rotateY(axisArrowsAABBModelMatrix, axisArrowsAABBModelMatrix, rotation[1]);
    //         glMatrix.mat4.rotateZ(axisArrowsAABBModelMatrix, axisArrowsAABBModelMatrix, rotation[2]);
    //         glMatrix.mat4.scale(axisArrowsAABBModelMatrix, axisArrowsAABBModelMatrix, axisArrowsAABBScale);
    //         mesh.axisArrowsAABBModelIdx = createAndStoreMatrix(axisArrowsAABBModelMatrix);

    //         const rotationArcModelMatrix = glMatrix.mat4.create();
    //         glMatrix.mat4.identity(rotationArcModelMatrix);
    //         glMatrix.mat4.translate(rotationArcModelMatrix, rotationArcModelMatrix, translation);
    //         glMatrix.mat4.rotateX(rotationArcModelMatrix, rotationArcModelMatrix, rotation[0]);
    //         glMatrix.mat4.rotateY(rotationArcModelMatrix, rotationArcModelMatrix, rotation[1]);
    //         glMatrix.mat4.rotateZ(rotationArcModelMatrix, rotationArcModelMatrix, rotation[2]);
    //         mesh.rotationArcModelIdx = createAndStoreMatrix(rotationArcModelMatrix);


    //         const rotationArcHeadModelMatrix = glMatrix.mat4.create();
    //         const rotationArcHeadScale = glMatrix.vec3.fromValues(0.1, 0.1, 0.1);
    //         glMatrix.mat4.identity(rotationArcHeadModelMatrix);
    //         glMatrix.mat4.translate(rotationArcHeadModelMatrix, rotationArcHeadModelMatrix, translation);
    //         glMatrix.mat4.translate(rotationArcHeadModelMatrix, rotationArcHeadModelMatrix, [1.0, 0, 0]);
    //         glMatrix.mat4.rotateX(rotationArcHeadModelMatrix, rotationArcHeadModelMatrix, rotation[0]);
    //         glMatrix.mat4.rotateY(rotationArcHeadModelMatrix, rotationArcHeadModelMatrix, rotation[1]);
    //         glMatrix.mat4.rotateZ(rotationArcHeadModelMatrix, rotationArcHeadModelMatrix, rotation[2]);
    //         glMatrix.mat4.scale(rotationArcHeadModelMatrix, rotationArcHeadModelMatrix, rotationArcHeadScale);
    //         mesh.rotationArcHeadModelIdx = createAndStoreMatrix(rotationArcHeadModelMatrix);

    //         const viewMatrix = getViewMatrix();
    //         const modelViewMatrix = glMatrix.mat4.create();
    //         glMatrix.mat4.multiply(modelViewMatrix, modelMatrix, viewMatrix);
    //         mesh.modelViewIdx = createAndStoreMatrix(modelViewMatrix);

    //         const normalMatrix = glMatrix.mat4.create();
    //         glMatrix.mat4.invert(normalMatrix, modelViewMatrix);
    //         glMatrix.mat4.transpose(normalMatrix, normalMatrix);
    //         mesh.normalMatrixIdx = createAndStoreMatrix(normalMatrix);
    //         // console.log(mesh.normalMatrixIdx);
            
    //         mesh.updateMatrix();

    //     }

    }




///////


export function getEntityModelMatricesCount() {
    return getScene()[0].modelMatrixLength;
}
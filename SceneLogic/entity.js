
import * as glMatrix from 'gl-matrix'

import { getAlignedSize } from '../Renderer/buffer.js';
import { getMegaMatrixCPUBufferLength, getViewMatrix, updateMatrix } from './matrix.js';
import { updateMatrix as matrix_updateMatrix, createAndStoreMatrix, getMatrix } from './matrix.js';
import { getMegaMatrixUBO } from '../Renderer/uniform.js';
import { getEntity } from './scene.js';

export class Entity {
    constructor(meshes, color, id, modelMatrixIdx, materials, idx, fileExt,
        json, binBuffer, textureIdx, name
    ) {

        this.globalTextureOffset = textureIdx;
        this.name = name;
        this.idx = idx;
        this.fileExt = fileExt; // 'glb, obj'
    
        // only for glb
        // will be null after texture initialization
        this.json = json;
        this.binBuffer = binBuffer

        this.meshes = meshes;
        // this.perEntityGlobalVertexBuffer = perEntityGlobalVertexBuffer;

        this.materials = materials; // -currently only support for obj while null for glb

        this.color = color;

        this.modelMatrixLength = 8; 

        this.isSelected = false;
        this.pipeline = "main";
        this.id = id;
    }

}




///////


export function getEntityModelMatricesCount() {
    return 8;
}

export function updateEntity(objectName, translation, rotation, scale) {
    const entity = getEntity(objectName);
    for (const mesh of entity.meshes) {
        const translationOut = mesh.getMeshTranslation();
        const rotationOut = mesh.getRotation();
        mesh.setTranslation(glMatrix.vec3.add(translationOut, translationOut, translation));
        mesh.setRotation(glMatrix.vec3.add(rotationOut, rotationOut, rotation));
        mesh.setScale(scale);
        updateMatrix(mesh);
    }
}

// | our hardcoded entity updates
export function updateEntities() {

    let translation = null;
    let rotation = null;
    let scale = null;

    // translation = glMatrix.vec3.fromValues(0, 0, 0);
    // scale = glMatrix.vec3.fromValues(0.1, 0.1, 0.1);
    // rotation = glMatrix.vec3.fromValues(0, 0, 0);
    // updateEntity('psx-rat', translation, rotation, scale);

    // translation = glMatrix.vec3.fromValues(-2, 2, 5);
    // scale = glMatrix.vec3.fromValues(0.01, 0.01, 0.01);
    // rotation = glMatrix.vec3.fromValues(0, 4.5, 0);
    // updateEntity('stop-sign-psx', translation, rotation, scale);

    // translation = glMatrix.vec3.fromValues(-15, 0, -25);
    // scale = glMatrix.vec3.fromValues(5.0, 5.0, 5.0);
    // rotation = glMatrix.vec3.fromValues(4.75, 0.0, 0);
    // updateEntity('psx_japanese_warehouse', translation, rotation, scale);
    
    // translation = glMatrix.vec3.fromValues(2, 2, 5);
    // scale = glMatrix.vec3.fromValues(0.01, 0.01, 0.01);
    // rotation = glMatrix.vec3.fromValues(0, 4.5, 0);
    // updateEntity('pizzeria', translation, rotation, scale);

    translation = glMatrix.vec3.fromValues(8, 0, -10);
    scale = glMatrix.vec3.fromValues(5.0, 5.0, 5.0);
    rotation = glMatrix.vec3.fromValues(0, 0, 0);
    updateEntity('pyramid_head', translation, rotation, scale);

}
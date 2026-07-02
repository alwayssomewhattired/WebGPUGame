
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

        this.materials = materials;

        this.color = color;

        this.modelMatrixLength = 8; 

        this.isSelected = false;
        this.pipeline = "main";
        this.id = id;
    }

}




///////


export function getEntityModelMatricesCount() {
    return getScene()[0].modelMatrixLength;
}
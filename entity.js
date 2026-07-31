
import * as glMatrix from 'gl-matrix'

import { getAlignedSize } from './buffer.js';
import { getMegaMatrixCPUBufferLength, getViewMatrix } from './matrix.js';
import { getScene } from './fileParser.js';
import { updateMatrix as matrix_updateMatrix, createAndStoreMatrix, getMatrix } from './matrix.js';
import { getMegaMatrixUBO } from './uniform.js';

export class Entity {
    constructor(meshes, color, id, modelMatrixIdx, materials, idx, fileExt, perEntityGlobalVertexBuffer,
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
        this.perEntityGlobalVertexBuffer = perEntityGlobalVertexBuffer;

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
    return getScene()[0].modelMatrixLength;
}
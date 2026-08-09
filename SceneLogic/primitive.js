
export class Primitive {
    constructor(vertexOffsetBytes, vertexSizeBytes, vertexOffset, idxOffset, idxSize, idxOffsetBytes, idxSizeBytes,
        vertexStrideBytes, idxType, vertexSize, vertexCount, materialIdx
    ) {
        this.globalMaterialIdx = materialIdx;

        // | everything past this point is per mesh, NOT GLOBAL
        this.vertexOffsetBytes =  vertexOffsetBytes;
        this.vertexSizeBytes =   vertexSizeBytes;
        this.vertexOffset =        vertexOffset;
        this.vertexSize = vertexSize;
        this.vertexCount = vertexCount;
        this.vertexStrideBytes = vertexStrideBytes;

        this.idxOffset =    idxOffset;
        this.idxSize =      idxSize;
        this.idxType = idxType;

        this.idxOffsetBytes =    idxOffsetBytes;
        this.idxSizeBytes =      idxSizeBytes;
    }
}
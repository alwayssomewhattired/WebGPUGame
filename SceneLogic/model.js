
export class Model {
    constructor(positions, texcoords, normals, indices, vertices, name) {
        this.positions = positions;
        this.texcoords = texcoords;
        this.normals = normals;
        this.indices = indices;
        this.vertices = vertices;
        this.name = name;
    }
}
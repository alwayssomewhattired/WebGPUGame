

export function fanTriangulation(face) {
    const vertices = [];
    for (let i=1; i<face.length - 1; i++) {
        vertices.push(face[0]);
        vertices.push(face[i]);
        vertices.push(face[i+1]);
    }

    return vertices;
}
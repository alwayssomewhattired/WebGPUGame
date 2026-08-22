
// arbitrary size
const vertexBuffer = new Float32Array(1000000);

let currentIdx = 0;

// returns idx to uploaded primitive
export function updateVertexBuffer(element) {
    vertexBuffer[currentIdx] = element;
    currentIdx++;

    return currentIdx - 1; 
}

export function getVertexBufferLength() {
    return currentIdx;
}

export function getVertexBuffer() {
    return vertexBuffer;
}
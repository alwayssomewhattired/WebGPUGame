

// arbitrary size
const debugVertexBuffer = new Float32Array(1000000);

let currentIdx = 0;

// returns idx to uploaded primitive
export function updateDebugVertexBuffer(element) {
    debugVertexBuffer[currentIdx] = element;
    currentIdx++;

    return currentIdx - 1; 
}

export function getDebugVertexBufferLength() {
    return currentIdx;
}

export function getDebugVertexBuffer() {
    return debugVertexBuffer;
}
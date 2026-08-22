
// arbitrary size
const indexBuffer = new Uint32Array(1000000);

let currentIdx = 0;

// returns idx to uploaded primitive
export function updateIndexBuffer(element) {
    indexBuffer[currentIdx] = element;
    currentIdx++;

    return currentIdx - 1; 
}

export function getIndexBufferLength() {
    return currentIdx;
}

export function getIndexBuffer() {
    return indexBuffer;
}

const fuckyouIndexBuffer = [];

export function getFuckyouIndexBuffer() {
    for (let i=0; i < 50000; i++) {
        fuckyouIndexBuffer.push(i);
    }

    return fuckyouIndexBuffer;
}
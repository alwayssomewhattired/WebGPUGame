
import { getDevice } from './webgpu.js' 
import { createGPUBuffer } from './buffer.js';

let m_indexBuffer = null;
let m_indexBuffer2 = null

export function initIndexBuffer() {
    const device = getDevice();
    const indices = new Uint16Array([0, 1, 2, 3, 4, 5, 6, 7, 0 ,1]);
    m_indexBuffer = createGPUBuffer(device, indices, GPUBufferUsage.INDEX);
    const indices2 = new Uint16Array([3, 1, 5, 7]);
    m_indexBuffer2 = createGPUBuffer(device, indices2, GPUBufferUsage.INDEX);
}

export function getIndexBuffer() {
    if (!m_indexBuffer) {
        throw new Error("Index Buffer is not initialized!")
    }

    return m_indexBuffer;
}

export function getIndexBuffer2() {
    if (!m_indexBuffer2) {
        throw new Error("Index Buffer 2 is not initialized!")
    }

    return m_indexBuffer2;
}
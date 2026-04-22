
import { getDevice } from "./webgpu.js"
import { getShaderModule} from './webgpu.js'

let m_pipeline = null;
let m_positionColorBuffer = null;

function createGPUBuffer(device, buffer, usage) {
    const bufferDesc = {
        size: buffer.byteLength,
        usage: usage,
        mappedAtCreation: true
    };

    let gpuBuffer = device.createBuffer(bufferDesc);

    if (buffer instanceof Float32Array) {
        const writeArrayNormal = new Float32Array(gpuBuffer.getMappedRange());
        writeArrayNormal.set(buffer);
    } else if (buffer instanceof Uint16Array) {
        const writeArrayNormal = new Uint16Array(gpuBuffer.getMappedRange());
        writeArrayNormal.set(buffer);
    } else if (buffer instanceof Uint8Array) {
        const writeArrayNormal = new Uint8Array(gpuBuffer.getMappedRange());
        writeArrayNormal.set(buffer);
    } else if (buffer instanceof Uint32Array) {
    const writeArrayNormal = new Uint32Array(gpuBuffer.getMappedRange());
    writeArrayNormal.set(buffer);
    } else {
        const writeArrayNormal = Float32Array(gpuBuffer.getMappedRange());
        writeArrayNormal.set(buffer);
        console.error("Unhandled buffer format ", typeof gpuBuffer);
    }

    gpuBuffer.unmap();
    return gpuBuffer;

}

export function initPipeline() {
    const device = getDevice();
    const shaderModule = getShaderModule();
    
    const pipelineLayoutDesc = { bindGroupLayouts: [] };
    const layout = device.createPipelineLayout(pipelineLayoutDesc);

    const colorState = {
        format: 'bgra8unorm'
    };

    const positionAttribDesc = {
        shaderLocation: 0, // location(0)
        offset: 0,
        format: 'float32x3'
    };

    const colorAttribDesc = {
        shaderLocation: 1,
        offset: 4 * 3,
        format: 'float32x3'
    }

    const positionColorBufferLayoutDesc = {
        attributes: [positionAttribDesc, colorAttribDesc],
        arrayStride: 4 * 6, // sizeof(float) * 3
        stepMode: 'vertex'
    };

    const positionColors = new Float32Array([
        1.0, -1.0, 0.0, // position
        1.0, 0.0, 0.0, // 🔴
        -1.0, -1.0, 0.0, 
        0.0, 1.0, 0.0, // 🟢
        0.0, 1.0, 0.0,
        0.0, 0.0, 1.0 // 🔵
    ]);

    m_positionColorBuffer = createGPUBuffer(device, positionColors, GPUBufferUsage.VERTEX);

    const pipelineDesc = {
        layout,
        vertex: {
            module: shaderModule,
            entryPoint: 'vs_main',
            buffers: [positionColorBufferLayoutDesc]
        },
        fragment: {
            module: shaderModule,
            entryPoint: 'fs_main',
            targets: [colorState]
        },
        primitive: {
            topology: 'triangle-list',
            frontFace: 'cw',
            cullMode: 'back'
        }
    };
   
    m_pipeline = device.createRenderPipeline(pipelineDesc);
}

export function getPipeline() {
    if (!m_pipeline) {
        throw new Error("Pipeline is not initialized!");
    }

    return m_pipeline;
}

export function getPositionColorBuffer() {
    if (!m_positionColorBuffer) {
        throw new Error("Position } Color buffer is unavailable!");
    }

    return m_positionColorBuffer;
}
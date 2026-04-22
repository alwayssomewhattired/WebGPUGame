
import { getDevice } from "./webgpu.js"
import { getShaderModule} from './webgpu.js'

let m_pipeline = null;
let m_positionBuffer = null;
let m_colorBuffer = null;

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

    const positionBufferLayoutDesc = {
        attributes: [positionAttribDesc],
        arrayStride: 4 * 3, // sizeof float * 3
        stepMode: 'vertex'
    };

    const positions = new Float32Array([
        1.0, -1.0, 0.0, -1.0, -1.0, 0.0, 0.0, 1.0, 0.0
    ]);

    const positionBufferDesc = {
        size: positions.byteLength,
        usage: GPUBufferUsage.VERTEX,
        mappedAtCreation: true
    };

    m_positionBuffer = device.createBuffer(positionBufferDesc);
    const writeArray = new Float32Array(m_positionBuffer.getMappedRange());
    writeArray.set(positions);
    m_positionBuffer.unmap();

    const colorAttribDesc = {
        shaderLocation: 1,
        offset: 0,
        format: 'float32x3'
    }

    const colorBufferLayoutDesc = {
        attributes: [colorAttribDesc],
        arrayStride: 4 * 3,
        stepMode: 'vertex'
    }

    const colors = new Float32Array([
        1.0,
        0.0,
        0.0,
        0.0,
        1.0,
        0.0,
        0.0,
        0.0,
        1.0
    ]);

    m_colorBuffer = createGPUBuffer(device, colors, GPUBufferUsage.VERTEX);

    const pipelineDesc = {
        layout,
        vertex: {
            module: shaderModule,
            entryPoint: 'vs_main',
            buffers: [positionBufferLayoutDesc, colorBufferLayoutDesc]
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

export function getPositionBuffer() {
    if (!m_positionBuffer) {
        throw new Error("Position buffer is unavailable!");
    }

    return m_positionBuffer;
}

export function getColorBuffer() {
    if (!m_colorBuffer) {
        throw new Error("Color buffer is unavailable!");
    }

    return m_colorBuffer;
}
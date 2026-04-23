
import { getDevice } from "./webgpu.js"
import { getShaderModule} from './webgpu.js'
import { createGPUBuffer } from './buffer.js'
import { getUniformBindGroupLayout } from '/uniform.js'

let m_pipeline = null;
let m_positionBuffer = null;
let m_texCoordsBuffer = null

export function initPipeline() {
    const device = getDevice();
    const shaderModule = getShaderModule();
    const uniformBindGroupLayout = getUniformBindGroupLayout();
    
    const pipelineLayoutDesc = { bindGroupLayouts: [uniformBindGroupLayout] };
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
        arrayStride: 4 * 3, // sizeof(float) * elements
        stepMode: 'vertex'
    };

    const positions = new Float32Array([
        100.0, -100.0, 0.0,
        100.0, 100.0, 0.0,
        -100.0, -100.0, 0.0,
        -100.0, 100.0, 0.0
    ]);

    m_positionBuffer = createGPUBuffer(device, positions, GPUBufferUsage.VERTEX);

    const texCoordsAttribDesc = {
        shaderLocation: 1,
        offset: 0,
        format: 'float32x2'
    };

    const texCoordsBufferLayoutDesc = {
        attributes: [texCoordsAttribDesc],
        arrayStride: 4 * 2,
        stepMode: 'vertex'
    };

    const texCoords = new Float32Array([
        1.0,
        0.0,

        1.0,
        1.0,

        0.0,
        0.0,
        
        0.0,
        1.0,
    ]);

    m_texCoordsBuffer = createGPUBuffer(device, texCoords, GPUBufferUsage.VERTEX)

    const pipelineDesc = {
        layout,
        vertex: {
            module: shaderModule,
            entryPoint: 'vs_main',
            buffers: [positionBufferLayoutDesc, texCoordsBufferLayoutDesc]
        },
        fragment: {
            module: shaderModule,
            entryPoint: 'fs_main',
            targets: [colorState]
        },
        primitive: {
            topology: 'triangle-strip',
            frontFace: 'ccw',
            cullMode: 'none'
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

export function getTexCoordsBuffer() {
    if (!m_texCoordsBuffer) {
        throw new Error("Tex Coords buffer is unavailable!");
    }

    return m_texCoordsBuffer;
}
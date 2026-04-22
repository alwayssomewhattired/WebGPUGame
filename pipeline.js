
import { getDevice } from "./webgpu.js"
import { getShaderModule} from './webgpu.js'
import { createGPUBuffer } from './buffer.js'
import { getUniformBindGroupLayout } from '/uniform.js'

let m_pipeline = null;
let m_positionColorBuffer = null;

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
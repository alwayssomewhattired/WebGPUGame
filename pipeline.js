
import { getDevice } from "./webgpu.js"
import { getShaderModule} from './webgpu.js'

let m_pipeline = null;
let m_positionBuffer = null;

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

    const positionLayoutBufferDesc = {
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

    const pipelineDesc = {
        layout,
        vertex: {
            module: shaderModule,
            entryPoint: 'vs_main',
            buffers: [positionLayoutBufferDesc]
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
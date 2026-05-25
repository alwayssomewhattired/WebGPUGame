
import { getDevice } from "../webgpu.js"
import { getShaderModule} from '../webgpu.js'
import { createGPUBuffer } from '../buffer.js'
import { getUniformBindGroupLayout } from '/uniform.js'

let m_pipeline = null;
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

    const vertexBufferLayoutDesc = {
        arrayStride: 4 * 8, // sizeof(float) * elements (x,y,z, u,v, normal.x,normal.y,normal.z)
        stepMode: 'vertex',
        attributes: [
            {
                shaderLocation: 0,
                offset: 0,
                format: 'float32x3'
            },
            {
                shaderLocation: 1,
                offset: 4 * 3,
                format: 'float32x2'
            },
            {
                shaderLocation: 2,
                offset: 4 * 5,
                format: 'float32x3'
            }
        ]
    };

    const pipelineDesc = {
        layout,
        vertex: {
            module: shaderModule,
            entryPoint: 'vs_main',
            buffers: [vertexBufferLayoutDesc]
        },
        fragment: {
            module: shaderModule,
            entryPoint: 'fs_main',
            targets: [colorState]
        },
        primitive: {
            topology: 'triangle-list',
            frontFace: 'ccw',
            cullMode: 'none'
        },
        depthStencil: {
            depthWriteEnabled: true,
            depthCompare: 'less',
            format: 'depth24plus-stencil8'
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

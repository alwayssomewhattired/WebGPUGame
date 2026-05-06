
import { getDevice, getAABBShaderModule } from "../webgpu.js";
import { getAABBUniformBindGroupLayout } from "../uniform.js";

let m_aabbPipeline = null;

function createAABBPipeline() {
    const device = getDevice();
    const shaderModule = getAABBShaderModule();
    const uniformBindGroupLayout = getAABBUniformBindGroupLayout();
    const pipelineLayoutDesc = { bindGroupLayouts: [uniformBindGroupLayout] };
    const layout = device.createPipelineLayout(pipelineLayoutDesc);

    const colorState = {
        format: 'bgra8unorm'
    };

    const positionAttribDesc = {
        shaderLocation: 0,
        offset: 0,
        format: 'float32x3'
    };

    const positionBufferLayoutDesc = {
        attributes: [positionAttribDesc],
        arrayStride: 4 * 3,
        stepMode: 'vertex'
    };

    const pipelineDesc = {
        layout,
        vertex: {
            module: shaderModule,
            entryPoint: 'aabbVertexShader',
            buffers: [positionBufferLayoutDesc]
        },
        fragment: {
            module: shaderModule,
            entryPoint: 'aabbFragShader',
            targets: [colorState]
        },
        primitive: {
            topology: 'line-list',
            frontFace: 'ccw',
            cullMode: 'none'
        },
        depthStencil: {
            depthWriteEnabled: false,
            depthCompare: 'less',
            format: 'depth24plus-stencil8'
        }
    };

    return device.createRenderPipeline(pipelineDesc);
}

export function getAABBPipeline() {
    if (!m_aabbPipeline) {
        m_aabbPipeline = createAABBPipeline();
    }

    return m_aabbPipeline;
}
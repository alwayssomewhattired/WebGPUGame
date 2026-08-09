
import { getGlobalUniformBindGroupLayout, getRotationArcUniformBindGroupLayout } from "../Renderer/uniform.js";
import { getDevice, getInstancedShaderModule } from "../Renderer/webgpu.js";

let m_arcPipeline = null;

export function initArcPipeline() {
    const device = getDevice();
    const shaderModule = getInstancedShaderModule();
    const globalUniformBindGroupLayout = getGlobalUniformBindGroupLayout();
    const uniformBindGroupLayout = getRotationArcUniformBindGroupLayout();

    const pipelineLayoutDesc = { bindGroupLayouts: [globalUniformBindGroupLayout, uniformBindGroupLayout] };
    const layout = device.createPipelineLayout(pipelineLayoutDesc);

    const colorState = {
        format: 'bgra8unorm'
    };

    const positionAttribDesc = {
        shaderLocation: 0,
        offset: 0,
        format: 'float32x3'
    };

    const colorAttribDesc = {
        shaderLocation: 1,
        offset: 4 * 3,
        format: 'float32x3'
    };

    const positionBufferLayoutDesc = {
        attributes: [positionAttribDesc, colorAttribDesc],
        arrayStride: 4 * 6,
        stepMode: 'vertex'
    };

    const pipelineDesc = {
        layout,
        vertex: {
            module: shaderModule,
            entryPoint: 'instancedVertexShader',
            buffers: [positionBufferLayoutDesc]
        },
        fragment: {
            module: shaderModule,
            entryPoint: 'instancedFragmentShader',
            targets: [colorState]
        },
        primitive: {
            topology: 'line-strip',
            frontFace: 'ccw',
            cullMode: 'none'
        },
        depthStencil: {
            depthWriteEnabled: false,
            depthCompare: 'always',
            format: 'depth24plus-stencil8'
        }
    };

    m_arcPipeline = device.createRenderPipeline(pipelineDesc);
}

export function getArcPipeline() {
    if (!m_arcPipeline) throw new Error("Arc Pipeline is null!!");

    return m_arcPipeline;
}
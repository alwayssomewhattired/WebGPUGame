
import { getDevice, getInstancedShaderModule } from "../webgpu.js";
import { getAxisArrowsUniformBindGroupLayout } from "../uniform.js"

export let axisArrowsPipeline = null;

export function initAxisArrowsPipeline() {
    const device = getDevice();
    const shaderModule = getInstancedShaderModule();
    const uniformBindGroupLayout = getAxisArrowsUniformBindGroupLayout();
    
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
        arrayStride: 4 * 3, // sizeof(float) * vertices
        stepMode: 'instance'
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
            topology: 'line-list',
            frontFace: 'ccw',
            cullMode: 'none'
        },
        depthStencil: {
            depthWriteEnabled: false, // | axis arrows should always be visible
            depthCompare: 'less',
            format: 'depth24plus-stencil8'
        }
    };
   
    axisArrowsPipeline = device.createRenderPipeline(pipelineDesc);
}
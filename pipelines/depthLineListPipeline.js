
import { getDebugShaderModule, getDevice } from "../webgpu.js";
import { getColorUniformBindGroupLayout, getGlobalUniformBindGroupLayout } from "../uniform.js"

export let depthLineListPipeline = null;

export function initDepthLineListPipeline() {
    const device = getDevice();
    const shaderModule = getDebugShaderModule();
    const globalUniformBindGroupLayout = getGlobalUniformBindGroupLayout();
    const uniformBindGroupLayout = getColorUniformBindGroupLayout();
    
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

    const positionColorBufferLayoutDesc = {
        attributes: [positionAttribDesc],
        arrayStride: 4 * 3, // sizeof(float) * vertex elements
        stepMode: 'vertex'
    };

    const pipelineDesc = {
        layout,
        vertex: {
            module: shaderModule,
            entryPoint: 'instancedVertexShader',
            buffers: [positionColorBufferLayoutDesc]
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
            depthWriteEnabled: true,
            depthCompare: 'less',
            format: 'depth24plus-stencil8'
        }
    };
   
    depthLineListPipeline = device.createRenderPipeline(pipelineDesc);
}

export function getDepthLineListPipeline() {
    if (!depthLineListPipeline) {
        throw new Error("depth line list Pipeline is not initialized!");
    }

    return depthLineListPipeline;
}

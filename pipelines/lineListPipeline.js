

import { getDevice, getInstancedShaderModule } from "../webgpu.js";
import { getAxisArrowsUniformBindGroupLayout, getGlobalUniformBindGroupLayout } from "../uniform.js"

export let lineListPipeline = null;

export function initLineListPipeline() {
    const device = getDevice();
    const shaderModule = getInstancedShaderModule();
    const globalUniformBindGroupLayout = getGlobalUniformBindGroupLayout();
    const uniformBindGroupLayout = getAxisArrowsUniformBindGroupLayout();
    
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

    const positionColorBufferLayoutDesc = {
        attributes: [positionAttribDesc, colorAttribDesc],
        arrayStride: 4 * 6, // sizeof(float) * vertex elements
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
            depthWriteEnabled: false,
            depthCompare: 'always',
            format: 'depth24plus-stencil8'
        }
    };
   
    lineListPipeline = device.createRenderPipeline(pipelineDesc);
}

export function getLineListPipeline() {
    if (!lineListPipeline) {
        throw new Error("line list Pipeline is not initialized!");
    }

    return lineListPipeline;
}

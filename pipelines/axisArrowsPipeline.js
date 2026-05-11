

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
   
    axisArrowsPipeline = device.createRenderPipeline(pipelineDesc);
}

import { getDevice } from "./webgpu.js"
import { getShaderModule} from './webgpu.js'

let pipeline = null;

export function initPipeline() {
    const device = getDevice();
    const shaderModule = getShaderModule();
    
    const pipelineLayoutDesc = { bindGroupLayouts: [] };
    const layout = device.createPipelineLayout(pipelineLayoutDesc);

    const colorState = {
        format: 'bgra8unorm'
    };

    const pipelineDesc = {
        layout,
        vertex: {
            module: shaderModule,
            entryPoint: 'vs_main',
            buffers: []
        },
        fragment: {
            module: shaderModule,
            entryPoint: 'fs_main',
            targets: [colorState]
        },
        primitive: {
            topology: 'triangle-list',
            frontFace: 'ccw',
            cullMode: 'back'
        }
    };

    pipeline = device.createRenderPipeline(pipelineDesc);
}

export function getPipeline() {
    if (!pipeline) {
        throw new Error("Pipeline is not initialized!");
    }

    return pipeline;
}
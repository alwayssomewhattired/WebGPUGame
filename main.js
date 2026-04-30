
import { initWebGPU } from './webgpu.js';
import { initTextures } from './uniform.js';
import { getDevice } from './webgpu.js';
import { getPipeline} from './pipeline.js'
import { initUniformBuffer } from './uniform.js'
import { initPipeline } from './pipeline.js'
import { initDepthStencil } from './depth_stencil.js';
import { initFileParser } from './fileParser.js';
import { getModel } from './fileParser.js';
import { frame } from './frame.js';
import { render } from './renderer.js';
import { initMouse } from './camera.js';

import { 
    getPositionBuffer, getIndexBuffer, getIndexBufferSize, getNormalBuffer, createModelBuffer 
} from './buffer.js'


export async function main() {
    await initWebGPU();
    await initMouse();
    await initTextures();
    initDepthStencil();
    await initFileParser();
    const device = getDevice();
    const obj = getModel();
    createModelBuffer(obj, device);
    initUniformBuffer();
    initPipeline();
    render();
    requestAnimationFrame(frame);

}

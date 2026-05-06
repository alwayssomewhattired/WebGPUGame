
import { initWebGPU } from './webgpu.js';
import { initTextures } from './uniform.js';
import { getDevice } from './webgpu.js';
import { initPipeline} from './pipelines/pipeline.js'
import { initAxisArrowsPipeline } from './pipelines/axisArrowsPipeline.js';
import { initDepthStencil } from './depth_stencil.js';
import { createEntities } from './fileParser.js';
import { frame } from './frame.js';
import { render } from './renderer.js';
import { initMouse } from './camera.js';
import { createUBO, createAxisArrowsUBO, createAABBUBO } from './uniform.js';
import { initTransformGizmo } from './transformGizmo.js';


export async function main() {
    await initWebGPU();
    await initMouse();
    await initTextures();
    initDepthStencil();
    await createEntities();
    createUBO();
    createAxisArrowsUBO();
    createAABBUBO();
    initPipeline();
    initAxisArrowsPipeline();
    initTransformGizmo();
    render();
    requestAnimationFrame(frame);

}

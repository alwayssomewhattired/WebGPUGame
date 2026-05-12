
import { initWebGPU } from './webgpu.js';
import { initUniformConstructor, createRayUBO, initTextures, createUBO, createAxisArrowsUBO, createAABBUBO } from './uniform.js';
import { getDevice } from './webgpu.js';
import { initPipeline} from './pipelines/pipeline.js'
import { initAxisArrowsPipeline } from './pipelines/axisArrowsPipeline.js';
import { initDepthStencil } from './depth_stencil.js';
import { createEntities, getScene } from './fileParser.js';
import { frame } from './frame.js';
import { render } from './renderer.js';
import { initMouse } from './camera.js';
import { initTransformGizmo } from './transformGizmo.js';


export async function main() {
    await initWebGPU();
    await initMouse();
    initUniformConstructor();
    await initTextures();
    initDepthStencil();
    await createEntities();

    // 1. mouse
    for (const entity of getScene()) {
        createUBO(entity);
        createAxisArrowsUBO(entity);
        createAABBUBO(entity);
    }
    createRayUBO();

    initPipeline();
    initAxisArrowsPipeline();
    initTransformGizmo();

    render();
    requestAnimationFrame(frame);

}

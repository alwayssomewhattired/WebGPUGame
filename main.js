
import { initWebGPU } from './webgpu.js';
import { initTextures } from './uniform.js';
import { getDevice } from './webgpu.js';
import { getPipeline} from './pipeline.js'
import { initPipeline } from './pipeline.js'
import { initDepthStencil } from './depth_stencil.js';
import { createEntities } from './fileParser.js';
import { frame } from './frame.js';
import { render } from './renderer.js';
import { initMouse } from './camera.js';
import { createUBO } from './uniform.js';
import { initTransformGizmo } from './transformGizmo.js';


export async function main() {
    await initWebGPU();
    await initMouse();
    await initTextures();
    initDepthStencil();
    await createEntities();
    createUBO();
    initPipeline();
    initTransformGizmo();
    render();
    requestAnimationFrame(frame);

}

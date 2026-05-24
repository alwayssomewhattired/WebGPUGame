
import { initWebGPU } from './webgpu.js';
import { initUniformConstructor, createRayUBO, initTextures, createUBO, createAxisArrowsUBO, createAABBUBO, createDynamicModelMatrixBuffer, createRotationArcUBO } from './uniform.js';
import { getDevice } from './webgpu.js';
import { initPipeline} from './pipelines/pipeline.js'
import { initAxisArrowsPipeline } from './pipelines/axisArrowsPipeline.js';
import { initDepthStencil } from './depth_stencil.js';
import { createEntities, getScene, updateEntities } from './fileParser.js';
import { frame } from './frame.js';
import { render } from './renderer.js';
import { initMouse } from './camera.js';
import { initTransformGizmo } from './transformGizmo.js';
import { initMegaMatrixCPUBuffer } from './matrix.js';
import { initArcPipeline } from './pipelines/arcPipeline.js';
import { initRotationArcHeadVerticesGPUBuffer, initRotationArcVerticesGPUBuffer } from './buffer.js';
import { initTriangleListPipeline } from './pipelines/triangleListPipeline.js';


export async function main() {
    await initWebGPU();
    await initMouse();
    initUniformConstructor();
    await initTextures();
    initDepthStencil();
    initMegaMatrixCPUBuffer();
    await createEntities();
    const scene = getScene();
    createDynamicModelMatrixBuffer(scene);

    // 1. mouse
    for (const entity of getScene()) {
        createUBO(entity);
        createAxisArrowsUBO(entity);
        createAABBUBO(entity);
        createRotationArcUBO(entity);
    }

    updateEntities();

    createRayUBO();

    initPipeline();
    initAxisArrowsPipeline();
    initArcPipeline();
    initTriangleListPipeline();

    initRotationArcVerticesGPUBuffer();
    initRotationArcHeadVerticesGPUBuffer();
    initTransformGizmo();

    render();
    requestAnimationFrame(frame);

}

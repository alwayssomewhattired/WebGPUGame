
import { initWebGPU } from './webgpu.js';
import { initUniformConstructor, createRayUBO, initTextures, createUBO, createAxisArrowsUBO, createAABBUBO, createMegaMatrixUBO, createRotationArcUBO, getMegaMatrixUBO, createGlobalBindGroup } from './uniform.js';
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
import { getAlignedSize, initRotationArcHeadVerticesGPUBuffer, initRotationArcVerticesGPUBuffer, updateDynamicGPUBuffer } from './buffer.js';
import { initTriangleListPipeline } from './pipelines/triangleListPipeline.js';


export async function main() {
    await initWebGPU();
    await initMouse();
    initUniformConstructor();
    initDepthStencil();
    initMegaMatrixCPUBuffer();
    await createEntities();
    const scene = getScene();
    createMegaMatrixUBO(scene);
    updateEntities();   
    await initTextures();

    createGlobalBindGroup();
    for (const entity of getScene()) {
        createUBO(entity);
        createAxisArrowsUBO(entity);
        createAABBUBO(entity);
        createRotationArcUBO(entity);
    }


    createRayUBO();

    initPipeline();
    initAxisArrowsPipeline();
    initArcPipeline();
    initTriangleListPipeline();

    initRotationArcVerticesGPUBuffer();
    initRotationArcHeadVerticesGPUBuffer();
    initTransformGizmo();
    
    // const offset = getAlignedSize(64);
    // for (const entity of getScene()) updateDynamicGPUBuffer(offset, entity, getMegaMatrixUBO()); 

    render();
    requestAnimationFrame(frame);

}

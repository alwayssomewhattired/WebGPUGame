
import { initWebGPU } from './webgpu.js';
import { initUniformConstructor, createRayUBO, createUBO, createAxisArrowsUBO, createAABBUBO, createMegaMatrixUBO, createRotationArcUBO, getMegaMatrixUBO, createGlobalBindGroup, createColorUBO } from './uniform.js';
import { getDevice } from './webgpu.js';
import { initPipeline} from './pipelines/pipeline.js'
import { initLineListPipeline } from './pipelines/lineListPipeline.js';
import { initDepthStencil } from './depth_stencil.js';
import { createEntities, getScene, updateEntities } from './fileParser.js';
import { frame } from './frame.js';
import { render } from './renderer.js';
import { initMouse } from './camera.js';
import { initTransformGizmo } from './transformGizmo.js';
import { initMegaMatrixCPUBuffer, updateMatrix } from './matrix.js';
import { initArcPipeline } from './pipelines/arcPipeline.js';
import { getAlignedSize, initRotationArcHeadVerticesGPUBuffer, initRotationArcVerticesGPUBuffer, initSphereVerticesGPUBuffer } from './buffer.js';
import { initTriangleListPipeline } from './pipelines/triangleListPipeline.js';
import { initDepthLineListPipeline } from './pipelines/depthLineListPipeline.js';
import { initPointLights } from './light.js';
import { initTextureCount, initTextures } from './texture.js';
import { initHTMLCallbacks } from './GameHTMLCallbacks.js';


export async function main() {
    await initWebGPU();
    initHTMLCallbacks(document);
    await initMouse();
    initUniformConstructor();
    initDepthStencil();
    initMegaMatrixCPUBuffer();
    // initTextureCount();
    await createEntities();
    const scene = getScene();
    createMegaMatrixUBO(scene);
    updateEntities();   
    await initTextures();
    initPointLights();

    createGlobalBindGroup();
    createUBO();
    for (const entity of getScene()) {
        for (const mesh of entity.meshes) {
            updateMatrix(mesh);
            createAxisArrowsUBO(mesh);
            createAABBUBO(mesh);
            createRotationArcUBO(mesh);
            createColorUBO(mesh);
        }
    }

    createRayUBO();
    
    initPipeline();
    initLineListPipeline();
    initDepthLineListPipeline();
    initArcPipeline();
    initTriangleListPipeline();

    
    initRotationArcVerticesGPUBuffer();
    initRotationArcHeadVerticesGPUBuffer();
    initTransformGizmo();
    initSphereVerticesGPUBuffer();
    // const offset = getAlignedSize(64);
    // for (const entity of getScene()) updateDynamicGPUBuffer(offset, entity, getMegaMatrixUBO()); 

    render();
    requestAnimationFrame(frame);

}


import { initWebGPU } from './Renderer/webgpu.js';
import { initUniformConstructor, createRayUBO, createUBO, createAxisArrowsUBO, createAABBUBO, createMegaMatrixUBO, createRotationArcUBO, getMegaMatrixUBO, createGlobalBindGroup, createColorUBO } from './Renderer/uniform.js';
import { getDevice } from './Renderer/webgpu.js';
import { initPipeline} from './pipelines/pipeline.js'
import { initLineListPipeline } from './pipelines/lineListPipeline.js';
import { initDepthStencil } from './Renderer/depth_stencil.js';
import { createEntity, filePaths } from './Asset_Manager/fileParser.js';
import { updateEntities } from './SceneLogic/entity.js';
import { frame } from './frame.js';
import { render } from './Renderer/renderer.js';
import { initMouse } from './SceneLogic/camera.js';
import { initTransformGizmo } from './SceneLogic/transformGizmo.js';
import { initMegaMatrixCPUBuffer, updateMatrix } from './SceneLogic/matrix.js';
import { initArcPipeline } from './pipelines/arcPipeline.js';
import { createGPUDebugVertexBuffer, createGPUIndexBuffer, createGPUVertexBuffer, getAlignedSize, initRotationArcHeadVerticesGPUBuffer, initRotationArcVerticesGPUBuffer, initSphereVerticesGPUBuffer } from './Renderer/buffer.js';
import { initTriangleListPipeline } from './pipelines/triangleListPipeline.js';
import { initDepthLineListPipeline } from './pipelines/depthLineListPipeline.js';
import { initPointLights } from './SceneLogic/light.js';
import { initTextureCount, initTextures } from './Asset_Manager/texture.js';
import { initHTMLCallbacks } from './GameHTMLCallbacks.js';
import { createEntitySceneLogic } from './SceneLogic/scene.js';
import { getScene } from './SceneLogic/scene.js';


export async function main() {
    await initWebGPU();
    initHTMLCallbacks(document);
    await initMouse();
    initUniformConstructor();
    initDepthStencil();
    initMegaMatrixCPUBuffer();
    // initTextureCount();
    for (const path of filePaths) {
        const extension = path.split(".").pop();
        if (extension === "obj") {
        const arrayBuffer = await fetch(path);
        await createEntity(arrayBuffer, path);
        } else {
        const arrayBuffer = await fetch(path).then(r => r.arrayBuffer());
        await createEntity(arrayBuffer, path);
        }
    }
    createGPUVertexBuffer();
    createGPUIndexBuffer();
    createGPUDebugVertexBuffer();

    const scene = getScene();
    createMegaMatrixUBO(scene);
    createEntitySceneLogic();
    // updateEntities();   
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

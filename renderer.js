import { getPipeline, getTexCoordsBuffer } from "./pipelines/pipeline.js";
import { axisArrowsPipeline } from "./pipelines/axisArrowsPipeline.js";
import { getAABBPipeline } from "./pipelines/AABBPipeline.js";
import { getUniformBindGroup, getAxisArrowsUniformBindGroup, getAABBUniformBindGroup, getRayUniformBindGroup, getDynamicModelMatrixUBO, getRotationArcUniformBindGroup } from "./uniform.js";
import { getDepthAttachment } from "./depth_stencil.js";
import { getDevice } from "./webgpu.js";
import { getScene } from "./fileParser.js";
import { createGPUBuffer, getAlignedSize, getAxisArrowsVerticesGPUBuffer, getRotationArcHeadVerticesGPUBuffer, getRotationArcVerticesGPUBuffer, updateDynamicGPUBuffer } from "./buffer.js";
import { getGlobalRotationArcHeadVerticesCount, getGlobalRotationArcVerticesCount, gizmoPositionsCPUBuffer } from "./transformGizmo.js";
import { getAABBGizmoPositionsGPUBuffer } from "./aabb.js";
import { getRayVerticesBuffer } from "./ray.js";
import { keyboardInput } from "./keyboardListeners.js";
import { getModelMatrix } from "./matrix.js";
import { getArcPipeline } from "./pipelines/arcPipeline.js";
import { getTriangleListPipeline } from "./pipelines/triangleListPipeline.js";


export function render() {
    
    const device = getDevice();
    const scene = getScene();
    const pipeline = getPipeline();
    const arcPipeline = getArcPipeline();
    const triangleListPipeline = getTriangleListPipeline();
    const texCoordsBuffer = getTexCoordsBuffer();
    const uniformBindGroup = getUniformBindGroup();
    const depthAttachment = getDepthAttachment();
    const alignedSize = getAlignedSize(64); // mat4x4

    const context = canvas.getContext("webgpu");
    const canvasConfig = {
        device: device,
        format: navigator.gpu.getPreferredCanvasFormat(),
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
        alphaMode: 'opaque'
    };
    context.configure(canvasConfig);
    let colorTexture = context.getCurrentTexture();
    let colorTextureView = colorTexture.createView();
    let colorAttachment = {
        view: colorTextureView,
        clearValue: {r:1, g:0, b:1, a:1},
        loadOp: 'clear',
        storeOp: 'store'
    };
    const renderPassDesc = {
        colorAttachments: [colorAttachment],
        depthStencilAttachment: depthAttachment
    };
    
    const commandEncoder = device.createCommandEncoder();
    const passEncoder = commandEncoder.beginRenderPass(renderPassDesc);
    passEncoder.setViewport(0, 0, canvas.width, canvas.height, 0, 1);

    // | main render
    passEncoder.setPipeline(pipeline);
    for (const entity of scene) {
        const entityMatricesCount = entity.modelMatrixLength;
        const positionBuffer = entity.mesh.vPositionsBuffer;
        const indexBuffer = entity.mesh.vIndicesBuffer;
        const indexBufferSize = entity.mesh.vIndexBufferSize;
        const normalBuffer = entity.mesh.vNormalsBuffer;
        const refinedIdx = alignedSize * ((entityMatricesCount * entity.idx) + 1) ;
        // console.log(refinedIdx);
        passEncoder.setBindGroup(0, uniformBindGroup, [refinedIdx]);
        passEncoder.setVertexBuffer(0, positionBuffer);
        passEncoder.setVertexBuffer(1, texCoordsBuffer);
        passEncoder.setVertexBuffer(2, normalBuffer);
        passEncoder.setIndexBuffer(indexBuffer, 'uint16');
        passEncoder.drawIndexed(indexBufferSize);
        passEncoder.draw(4, 1);
        
    }

    const rotationArcVerticesCount = getGlobalRotationArcVerticesCount();
    const rotationArcHeadVerticesCount = getGlobalRotationArcHeadVerticesCount();
    // const rotationArcHeadVerticesCount = 1;


    for (const entity of scene) {
        if (entity.isSelected) {
            // | renders axisArrows vertices
            passEncoder.setPipeline(axisArrowsPipeline);
            passEncoder.setBindGroup(0, getAxisArrowsUniformBindGroup(), [alignedSize * 3]);
            passEncoder.setVertexBuffer(0, getAxisArrowsVerticesGPUBuffer());
            // passEncoder.setVertexBuffer(1, aabbInstanceBuffer);
            passEncoder.draw(6, 3);
            updateDynamicGPUBuffer(alignedSize, entity, getDynamicModelMatrixUBO());  

            passEncoder.setPipeline(arcPipeline);
            passEncoder.setBindGroup(0, getRotationArcUniformBindGroup(), [alignedSize * 5]);
            passEncoder.setVertexBuffer(0, getRotationArcVerticesGPUBuffer());
            passEncoder.draw(rotationArcVerticesCount, 1);

            passEncoder.setPipeline(triangleListPipeline);
            passEncoder.setBindGroup(0, getRotationArcUniformBindGroup(), [alignedSize * 6]);
            passEncoder.setVertexBuffer(0, getRotationArcHeadVerticesGPUBuffer());
            passEncoder.draw(rotationArcHeadVerticesCount, 1);

            if (keyboardInput.b) {
                // | aabb boxes

                passEncoder.setPipeline(getAABBPipeline());
                passEncoder.setBindGroup(0, getAABBUniformBindGroup(), [alignedSize * 4]);
                passEncoder.setVertexBuffer(0, getAABBGizmoPositionsGPUBuffer());
                const aabbMatrixUBO = getDynamicModelMatrixUBO();
                
                passEncoder.draw(gizmoPositionsCPUBuffer.length / 3, 1);
                
                passEncoder.setVertexBuffer(0, entity.mesh.aabbPositionsBuffer);    
                passEncoder.setBindGroup(0, getAABBUniformBindGroup(), [alignedSize * 2]);

                const aabbModelMatrixOffset = aabbMatrixUBO.length;         

                passEncoder.draw(entity.mesh.aabbPositionsLength, 1);

                passEncoder.setBindGroup(0, getRayUniformBindGroup(), [0]);
                for (const rayBuffer of getRayVerticesBuffer()) {
                    passEncoder.setVertexBuffer(0, rayBuffer);
                    passEncoder.draw(2, 1);
                }
            }
        }
    }

    passEncoder.end();
    device.queue.submit([commandEncoder.finish()]);

}
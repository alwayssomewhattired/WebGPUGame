import { getPipeline  } from "../pipelines/pipeline.js";
import { getLineListPipeline, lineListPipeline } from "../pipelines/lineListPipeline.js";
import { getAABBPipeline } from "../pipelines/AABBPipeline.js";
import { getUniformBindGroup, getAxisArrowsUniformBindGroup, getAABBUniformBindGroup, getRayUniformBindGroup, getMegaMatrixUBO, getRotationArcUniformBindGroup, getGlobalUniformBindGroup, getRayUniformBindGroupLayout, getColorUniformBindGroup } from "../Renderer/uniform.js";
import { getDepthAttachment } from "./depth_stencil.js";
import { getDevice } from "./webgpu.js";
import { getAlignedSize, getAxisArrowsVerticesGPUBuffer, getRotationArcHeadVerticesGPUBuffer, getRotationArcVerticesGPUBuffer, getSphereVerticesGPUBuffer, updateDynamicGPUBuffer } from "./buffer.js";
import { getGlobalRotationArcHeadVerticesCount, getGlobalRotationArcVerticesCount, gizmoPositionsCPUBuffer } from "../SceneLogic/transformGizmo.js";
import { getAABBGizmoPositionsGPUBuffer } from "../SceneLogic/aabb.js";
import { getRayVerticesBuffer } from "../SceneLogic/ray.js";
import { keyboardInput, toggleDebugNormals } from "../keyboardListeners.js";
import { getArcPipeline } from "../pipelines/arcPipeline.js";
import { getTriangleListPipeline } from "../pipelines/triangleListPipeline.js";
import { getSphereRawVertexCount } from "../SceneLogic/light.js";
import { getDepthLineListPipeline } from "../pipelines/depthLineListPipeline.js";
import { getScene } from "../SceneLogic/scene.js";


export function render() {
    
    const device = getDevice();
    const scene = getScene();
    const pipeline = getPipeline();
    const arcPipeline = getArcPipeline();
    const triangleListPipeline = getTriangleListPipeline();
    const depthLineListPipeline = getDepthLineListPipeline();
    const lineListPipeline = getLineListPipeline();
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
    passEncoder.setBindGroup(0, getGlobalUniformBindGroup());

    let offset = alignedSize;
    let textureOffset = 0;
    
    passEncoder.setPipeline(pipeline);
    for (const entity of scene) {
        const entityMatricesCount = entity.modelMatrixLength;
        
        for (const mesh of entity.meshes) {
            const indexBuffer = mesh.vIndicesBuffer;
            
            if (entity.fileExt === 'glb') {
                const vDataBuffer = mesh.vDataBuffer;
                for (const primitive of mesh.primitives) {
                    passEncoder.setBindGroup(1, uniformBindGroup, [offset, offset, alignedSize * primitive.globalMaterialIdx]);
                    passEncoder.setVertexBuffer(0, vDataBuffer, primitive.vertexOffsetBytes, primitive.vertexSizeBytes);
                    if (primitive.idxType === 'Uint32Array') {
                        passEncoder.setIndexBuffer(indexBuffer, 'uint32', primitive.idxOffsetBytes, primitive.idxSizeBytes);
                    }
                    else if (primitive.idxType === 'Uint16Array') {
                        passEncoder.setIndexBuffer(indexBuffer, 'uint16', primitive.idxOffsetBytes, primitive.idxSizeBytes);
                    }
                    passEncoder.drawIndexed(primitive.idxSize, 1, 0, primitive.vertexOffset);
                }
            } else {
                for (const primitive of mesh.primitives) {
                passEncoder.setBindGroup(1, uniformBindGroup, [offset, offset, alignedSize * entity.globalTextureOffset]);

                const vDataBuffer = mesh.vDataBuffer;
                passEncoder.setVertexBuffer(0, vDataBuffer);
                passEncoder.draw(mesh.vCount, 1);
                }
            }
            // - we add 1 because we have a default model matrix
            offset += alignedSize * (entityMatricesCount + 1);
            
        }
        
        textureOffset += alignedSize;
    }

    offset = alignedSize;
    // ||| normals debug render
    if (toggleDebugNormals) {
        passEncoder.setPipeline(depthLineListPipeline);
        for (const entity of scene) {
            for (const mesh of entity.meshes) {
                passEncoder.setBindGroup(1, getColorUniformBindGroup(), [
                    alignedSize * (mesh.modelMatrixIdx + 1), 
                    alignedSize * (mesh.normalMatrixIdx + 1)
                ]);
                const vDataBuffer = mesh.debugVertexBuffer;
                // only pass positions in vertex buffer
                // pass single color as ubo
                passEncoder.setVertexBuffer(0, vDataBuffer);
                passEncoder.draw(mesh.debugVertexCount, 1);

                offset += alignedSize * (entity.modelMatrixLength + 1);
            }
        }
    }

    const rotationArcVerticesCount = getGlobalRotationArcVerticesCount();
    const rotationArcHeadVerticesCount = getGlobalRotationArcHeadVerticesCount();
    // const rotationArcHeadVerticesCount = 1;

    offset = alignedSize;
    for (const entity of scene) {
        const entityMatricesCount = entity.modelMatrixLength;
        let entityMatricesCountOffset = entityMatricesCount * entity.idx;
        if (entity.isSelected) {
            // | renders axisArrows vertices
            passEncoder.setPipeline(lineListPipeline);
            passEncoder.setBindGroup(
                1, 
                getAxisArrowsUniformBindGroup(), 
                [offset * entity.meshes[0].axisArrowsModelIdx]
            );
            
            passEncoder.setVertexBuffer(0, getAxisArrowsVerticesGPUBuffer());
            passEncoder.draw(6, 3);
            passEncoder.setPipeline(arcPipeline);
            passEncoder.setBindGroup(
                1, 
                getRotationArcUniformBindGroup(), 
                [offset * entity.meshes[0].rotationArcModelIdx]
            );
            
            passEncoder.setVertexBuffer(0, getRotationArcVerticesGPUBuffer());
            passEncoder.draw(rotationArcVerticesCount, 1);

            passEncoder.setPipeline(triangleListPipeline);
            passEncoder.setBindGroup(
                1, 
                getRotationArcUniformBindGroup(), 
                [offset * entity.meshes[0].rotationArcHeadModelIdx]
            );
            passEncoder.setVertexBuffer(0, getRotationArcHeadVerticesGPUBuffer());
            passEncoder.draw(rotationArcHeadVerticesCount, 1);

            if (keyboardInput.b) {
                // | aabb boxes

                passEncoder.setPipeline(getAABBPipeline());
                passEncoder.setBindGroup(
                    1, 
                    getAABBUniformBindGroup(), 
                    [offset * entity.meshes[0].axisArrowsAABBModelIdx]
                );
                passEncoder.setVertexBuffer(0, getAABBGizmoPositionsGPUBuffer());
                const aabbMatrixUBO = getMegaMatrixUBO();
                
                passEncoder.draw(gizmoPositionsCPUBuffer.length / 3, 1);
                
                passEncoder.setVertexBuffer(0, entity.meshes[0].aabbPositionsBuffer);    
                passEncoder.setBindGroup(
                    1, 
                    getAABBUniformBindGroup(), 
                    [offset * entity.meshes[0].aabbModelIdx]
                );

                const aabbModelMatrixOffset = aabbMatrixUBO.length;         

                passEncoder.draw(entity.meshes[0].aabbPositionsLength, 1);

                passEncoder.setBindGroup(1, getRayUniformBindGroup(), [0]);
                for (const rayBuffer of getRayVerticesBuffer()) {
                    passEncoder.setVertexBuffer(0, rayBuffer);
                    passEncoder.draw(2, 1);
                }
            }
        }
    }

    passEncoder.setPipeline(triangleListPipeline)
    passEncoder.setBindGroup(1, getRotationArcUniformBindGroup(), [0]);
    passEncoder.setVertexBuffer(0, getSphereVerticesGPUBuffer());
    // console.log(getSphereVertexCount());
    passEncoder.draw(getSphereRawVertexCount());

    passEncoder.end();
    device.queue.submit([commandEncoder.finish()]);

}





















            // for (const primitive of entity.mesh.primitives) {
            //     passEncoder.setVertexBuffer(0, vDataBuffer, primitive.offset, primitive.size);
            //     passEncoder.setIndexBuffer(indexBuffer, 'uint16', primitive.idxOffsetBytes, primitive.idxSizeBytes);
            //     passEncoder.drawIndexed(primitive.idxSize, 1, primitive.idxOffset, 0);
            // }














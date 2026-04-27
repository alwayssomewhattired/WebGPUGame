
import { initWebGPU } from './webgpu.js';
import { getDevice } from './webgpu.js';
import { getPipeline} from './pipeline.js'
import { getTexCoordsBuffer } from './pipeline.js';
import { initUniformBuffer } from './uniform.js'
import { getUniformBindGroup } from './uniform.js';
import { initPipeline } from './pipeline.js'
import { initTextures } from './uniform.js';
import { initDepthStencil } from './depth_stencil.js';
import { getDepthAttachment } from './depth_stencil.js';
import { initFileParser } from './fileParser.js';
import { getModel } from './fileParser.js';

import { 
    getPositionBuffer, getIndexBuffer, getIndexBufferSize, getNormalBuffer, createModelBuffer 
} from './buffer.js'


export async function main() {
    await initWebGPU();
    await initTextures();
    initDepthStencil();
    await initFileParser();
    const device = getDevice();
    const obj = getModel();
    createModelBuffer(obj, device);
    initUniformBuffer();
    initPipeline();
    const pipeline = getPipeline();
    const positionBuffer = getPositionBuffer();
    const indexBuffer = getIndexBuffer();
    const texCoordsBuffer = getTexCoordsBuffer();
    const normalBuffer = getNormalBuffer();
    const uniformBindGroup = getUniformBindGroup();
    const depthAttachment = getDepthAttachment();

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
        clearValue: {r:1, g:0, b:0, a:1},
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
    passEncoder.setPipeline(pipeline);
    passEncoder.setBindGroup(0, uniformBindGroup);
    passEncoder.setVertexBuffer(0, positionBuffer);
    passEncoder.setVertexBuffer(1, texCoordsBuffer);
    passEncoder.setVertexBuffer(2, normalBuffer);
    passEncoder.setIndexBuffer(indexBuffer, 'uint16');
    const indexBufferSize = getIndexBufferSize();
    passEncoder.drawIndexed(indexBufferSize);
    passEncoder.draw(4, 1);
    passEncoder.end();  
    device.queue.submit([commandEncoder.finish()]);

}

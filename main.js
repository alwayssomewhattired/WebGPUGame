
import { initWebGPU } from './webgpu.js';
import { getDevice } from './webgpu.js';
import { getPipeline} from './pipeline.js'
// import { getPositionBuffer } from './pipeline.js';
import { getTexCoordsBuffer } from './pipeline.js';
import { initUniformBuffer } from './uniform.js'
import { getUniformBindGroup } from './uniform.js';
import { initPipeline } from './pipeline.js'
import { initTextures } from './uniform.js';
import { initDepthStencil } from './depth_stencil.js';
import { getDepthAttachment } from './depth_stencil.js';
// import { initIndexBuffer } from './indexBuffer.js';
// import { getIndexBuffer } from './indexBuffer.js';
// import { getIndexBuffer2 } from './indexBuffer.js';
import { initFileParser } from './fileParser.js';
import { getModel } from './fileParser.js';
import { createIndexBuffer } from './buffer.js'
import { getIndexBuffer } from './buffer.js'
import { createPositionBuffer } from './buffer.js'
import { getPositionBuffer } from './buffer.js'
import { getIndexBufferSize } from './buffer.js';

export async function main() {
    await initWebGPU();
    await initTextures();
    initDepthStencil();
    initUniformBuffer();
    await initFileParser();
    const device = getDevice();
    const obj = getModel();
    createPositionBuffer(obj, device);
    createIndexBuffer(obj, device);
    initPipeline();
    const pipeline = getPipeline();
    const positionBuffer = getPositionBuffer();
    const indexBuffer = getIndexBuffer();
    const texCoordsBuffer = getTexCoordsBuffer();
    const uniformBindGroup = getUniformBindGroup();
    const depthAttachment = getDepthAttachment();
    // const indexBuffer = getIndexBuffer();
    // const indexBuffer2 = getIndexBuffer2();

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
    passEncoder.setIndexBuffer(indexBuffer, 'uint16');
    const indexBufferSize = getIndexBufferSize();
    console.log(indexBufferSize);
    passEncoder.drawIndexed(indexBufferSize);
    // passEncoder.setIndexBuffer(indexBuffer2, 'uint16');
    // passEncoder.drawIndexed(4);
    passEncoder.draw(4, 1);
    passEncoder.end();  
    device.queue.submit([commandEncoder.finish()]);

}

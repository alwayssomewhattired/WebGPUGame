import { getPipeline } from "./pipeline.js";
import { getPositionBuffer } from "./buffer.js";
import { getIndexBuffer } from "./buffer.js";
import { getIndexBufferSize } from "./buffer.js";
import { getTexCoordsBuffer } from "./pipeline.js";
import { getNormalBuffer } from "./buffer.js";
import { getUniformBindGroup } from "./uniform.js";
import { getDepthAttachment } from "./depth_stencil.js";
import { getDevice } from "./webgpu.js";


export function render() {
    const device = getDevice();
    const pipeline = getPipeline();
    const positionBuffer = getPositionBuffer();
    const indexBuffer = getIndexBuffer();
    const indexBufferSize = getIndexBufferSize();
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
    passEncoder.drawIndexed(indexBufferSize);
    passEncoder.draw(4, 1);
    passEncoder.end();  
    device.queue.submit([commandEncoder.finish()]);
}
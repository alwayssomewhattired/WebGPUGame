
import { initWebGPU } from './webgpu.js';
import { getDevice } from './webgpu.js';
import { getPipeline} from './pipeline.js'

export async function main() {
    console.log("hello");
    await initWebGPU();
    const device = getDevice();
    const pipeline = getPipeline();

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
    const renderPassDesc = {colorAttachments: [colorAttachment]};
    const commandEncoder = device.createCommandEncoder();
    const passEncoder = commandEncoder.beginRenderPass(renderPassDesc);
    passEncoder.setViewport(0, 0, canvas.width, canvas.height, 0, 1);
    passEncoder.setPipeline(pipeline);
    passEncoder.draw(3, 1);
    passEncoder.end();  
    device.queue.submit([commandEncoder.finish()]);

}

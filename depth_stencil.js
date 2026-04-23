
import { getDevice } from './webgpu.js';

let m_depthAttachment = null;

export function initDepthStencil() {
    const device = getDevice();

    const depthTextureDesc = {
        size: [canvas.width, canvas.height, 1],
        dimension: '2d',
        format: 'depth24plus-stencil8',
        usage: GPUTextureUsage.RENDER_ATTACHMENT
    };

    let depthTexture = device.createTexture(depthTextureDesc);
    let depthTextureView = depthTexture.createView();

    m_depthAttachment = {
        view: depthTextureView,
        depthClearValue: 1,
        depthLoadOp: 'clear',
        depthStoreOp: 'store',
        stencilClearValue: 0,
        stencilLoadOp: 'clear',
        stencilStoreOp: 'store'
    };
}

export function getDepthAttachment() {
    if (!m_depthAttachment) {
        throw new Error("Depth Attachment is uninitialized!");
    }

    return m_depthAttachment;
}
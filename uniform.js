
import * as glMatrix from 'gl-matrix';

import { createGPUBuffer } from './buffer.js'
import { getDevice } from './webgpu.js'

let m_uniformBindGroup = null;
let m_uniformBindGroupLayout = null;
let m_texture = null;
let m_sampler = null

export function initUniformBuffer() {
    const device = getDevice();
    const texture = getTexture();
    const sampler = getSampler();
    
    // let translateMatrix = glMatrix.mat4.fromTranslation(
    //     glMatrix.mat4.create(), 
    //     glMatrix.vec3.fromValues(-0.5, -0.5, 0.0)
    // );

    // let uniformBuffer = createGPUBuffer(device, translateMatrix, GPUBufferUsage.UNIFORM);

    let transformationMatrix = glMatrix.mat4.lookAt(
        glMatrix.mat4.create(),
        glMatrix.vec3.fromValues(20, 20, 20),
        glMatrix.vec3.fromValues(0, 0, 0),
        glMatrix.vec3.fromValues(0.0, 0.0, 1.0)
    );

    let projectionMatrix = glMatrix.mat4.perspective(
        glMatrix.mat4.create(),
        1.4,
        1500.0 / 700.0,
        0.1,
        1000.0
    );
    

    let transformationMatrixUniformBuffer = createGPUBuffer(device, transformationMatrix, GPUBufferUsage.UNIFORM);
    let projectionMatrixUniformBuffer = createGPUBuffer(device, projectionMatrix, GPUBufferUsage.UNIFORM);

    m_uniformBindGroupLayout = device.createBindGroupLayout({
        entries: [
            {
                binding: 0,
                visibility: GPUShaderStage.VERTEX,
                buffer: {}
            },
            {
                binding: 1,
                visibility: GPUShaderStage.VERTEX,
                buffer: {}
            },
            {
                binding: 2,
                visibility: GPUShaderStage.FRAGMENT,
                texture: {}
            },
            {
                binding: 3,
                visibility: GPUShaderStage.FRAGMENT,
                sampler: {}
            }
        ]
    });

    m_uniformBindGroup = device.createBindGroup({
        layout: m_uniformBindGroupLayout,
        entries: [
            {
                binding: 0,
                resource: {
                    buffer: transformationMatrixUniformBuffer
                }
            },
            {
                binding: 1,
                resource: {
                    buffer: projectionMatrixUniformBuffer
                }
            },
            {
                binding: 2,
                resource: texture.createView()
            },
            {
                binding: 3,
                resource: sampler
            }
        ]
    });

}

export async function initTextures() {
    const device = getDevice();
    const response = await fetch('./textures/Grass_Texture.png');
    const blob = await response.blob();
    const imgBitmap = await createImageBitmap(blob);
    
    const textureDescriptor = {
        size: { width: imgBitmap.width, height: imgBitmap.height },
        format: 'rgba8unorm',
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT 
    };
    
    m_texture = device.createTexture(textureDescriptor);
    const texture = m_texture;

    device.queue.copyExternalImageToTexture({ source: imgBitmap }, { texture }, textureDescriptor.size);
    imgBitmap.close();

    m_sampler = device.createSampler({
        addressModeU: 'repeat',
        addressModeV: 'repeat',
        magFilter: 'linear',
        minFilter: 'linear',
        minmapFilter: 'linear',
    });

}

export function getUniformBindGroup() {
    if (!m_uniformBindGroup) {
        throw new Error("UniformBufferBindGroup not initialized!");
    }

    return m_uniformBindGroup;
}

export function getUniformBindGroupLayout() {
    if (!m_uniformBindGroupLayout) {
        throw new Error("UniformBufferBindGroupLayout not initialized!");
    }

    return m_uniformBindGroupLayout;
}

export function getTexture() {
    if (!m_texture) {
        throw new Error("Texture not initialized!");
    }

    return m_texture;
}

export function getSampler() {
    if (!m_sampler) {
        throw new Error("Sampler not initialized!");
    }

    return m_sampler;
}

import * as glMatrix from 'gl-matrix';

import { createGPUBuffer } from './buffer.js'
import { getDevice } from './webgpu.js'
import { getNormalBuffer } from './buffer.js'


let m_modelMatrixUBO = null;
let m_viewMatrixUBO = null;
let m_uniformBindGroup = null;
let m_uniformBindGroupLayout = null;
let m_texture = null;
let m_sampler = null

export function initUniformBuffer() {
    const device = getDevice();
    const texture = getTexture();
    const sampler = getSampler();

    const modelMatrix = glMatrix.mat4.create();
    // glMatrix.mat4.rotateZ(modelMatrix, modelMatrix, 0.5);
    // glMatrix.mat4.rotateX(modelMatrix, modelMatrix, 50.5);

    const viewMatrix = glMatrix.mat4.lookAt(
        glMatrix.mat4.create(),
        glMatrix.vec3.fromValues(0,0, 0),
        glMatrix.vec3.fromValues(0, 0, 0),
        glMatrix.vec3.fromValues(0.0, 0.0, 1.0)
    );

    const modelViewMatrix = glMatrix.mat4.create();
    glMatrix.mat4.multiply(modelViewMatrix, modelMatrix, viewMatrix);

    const projectionMatrix = glMatrix.mat4.perspective(
        glMatrix.mat4.create(),
        1.0,
        1500.0 / 700.0,
        0.1,
        1000.0
    );

    const normalMatrix = glMatrix.mat4.create();
    glMatrix.mat4.invert(normalMatrix, modelViewMatrix);
    glMatrix.mat4.transpose(normalMatrix, normalMatrix);

    const lightDirectionBuffer = new Float32Array([-1.0, -1.0, -1.0]);
    const lightDirectionUBO = createGPUBuffer(device, lightDirectionBuffer, GPUBufferUsage.UNIFORM);
    const viewDirectionBuffer = new Float32Array([-1.0, -1.0, -1.0]);
    const viewDirectionUBO = createGPUBuffer(device, viewDirectionBuffer, GPUBufferUsage.UNIFORM);

    m_modelMatrixUBO = createGPUBuffer(device, modelMatrix, GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST);
    m_viewMatrixUBO = createGPUBuffer(device, viewMatrix, GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST);
    // let modelViewMatrixUniformBuffer = createGPUBuffer(device, modelViewMatrix, GPUBufferUsage.UNIFORM);
    const projectionMatrixUniformBuffer = createGPUBuffer(device, projectionMatrix, GPUBufferUsage.UNIFORM);
    const normalMatrixUniformBuffer = createGPUBuffer(device, normalMatrix, GPUBufferUsage.UNIFORM);

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
                visibility: GPUShaderStage.VERTEX,
                buffer: {}
            },
            {
                binding: 3,
                visibility: GPUShaderStage.VERTEX,
                buffer: { type: 'uniform'}
            },
            {
                binding: 4,
                visibility: GPUShaderStage.FRAGMENT,
                texture: {}
            },
            {
                binding: 5,
                visibility: GPUShaderStage.FRAGMENT,
                sampler: {}
            },
            {
                binding: 6,
                visibility: GPUShaderStage.VERTEX,
                buffer: {}
            },
            {
                binding: 7,
                visibility: GPUShaderStage.VERTEX,
                buffer: {}
            },
        ]
    });

    m_uniformBindGroup = device.createBindGroup({
        layout: m_uniformBindGroupLayout,
        entries: [
            {
                binding: 0,
                resource: {
                    buffer: m_modelMatrixUBO
                }
            },
            {
                binding: 1,
                resource: {
                    buffer: m_viewMatrixUBO
                }
            },
            {
                binding: 2,
                resource: {
                    buffer: projectionMatrixUniformBuffer
                }
            },
            {
                binding: 3,
                resource: {
                    buffer: normalMatrixUniformBuffer
                }
            },
            {
                binding: 4,
                resource: texture.createView()
            },
            {
                binding: 5,
                resource: sampler
            },
            {
                binding: 6,
                resource: {
                    buffer: lightDirectionUBO
                }
            },
            {
                binding: 7,
                resource: {
                    buffer: viewDirectionUBO
                }
            },
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

export function getModelMatrixUBO() {
    if (!m_modelMatrixUBO) {
        throw new Error("Model Matrix UBO not initialized!");
    }

    return m_modelMatrixUBO;
}

export function getViewMatrixUBO() {
    if (!m_viewMatrixUBO) {
        throw new Error("View Matrix UBO not initialized!");
    }

    return m_viewMatrixUBO;
}
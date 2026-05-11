
import * as glMatrix from 'gl-matrix';

import { createGPUBuffer, getAxisArrowsPositionsGPUBuffer, getAABBColorGPUBuffer, 
    getRayColorGPUBuffer } from './buffer.js'
import { getDevice } from './webgpu.js'
import { getScene } from './fileParser.js';
import { getModelMatrix, getViewMatrix, getProjectionMatrix } from './matrix.js';

let m_modelMatrixUBO = null;
let m_rayModelMatrixUBO = null;
let m_viewMatrixUBO = null;
let m_projectionMatrixUBO = null;

let m_uniformBindGroup = null;
let m_uniformBindGroupLayout = null;
let m_axisArrowsUniformBindGroup = null;
let m_axisArrowsUniformBindGroupLayout = null;
let m_aabbUniformBindGroup = null;
let m_aabbUniformBindGroupLayout = null;
let m_rayUniformBindGroup = null;
let m_rayUniformBindGroupLayout = null;
let m_texture = null;
let m_sampler = null

export function createUBO(entity) {
    const device = getDevice();
    const texture = getTexture();
    const sampler = getSampler();

    const modelMatrix = entity.modelMatrix;
    const modelMatrixByteLength = 64 * getScene().length;
    const viewMatrix = getViewMatrix();
    const modelViewMatrix = glMatrix.mat4.create();
    glMatrix.mat4.multiply(modelViewMatrix, modelMatrix, viewMatrix);
    const projectionMatrix = getProjectionMatrix();

    const normalMatrix = glMatrix.mat4.create();
    glMatrix.mat4.invert(normalMatrix, modelViewMatrix);
    glMatrix.mat4.transpose(normalMatrix, normalMatrix);

    const lightDirectionBuffer = new Float32Array([-1.0, -1.0, -1.0]);
    const lightDirectionUBO = createGPUBuffer(device, lightDirectionBuffer, lightDirectionBuffer.byteLength, 
        GPUBufferUsage.UNIFORM);
    const viewDirectionBuffer = new Float32Array([-1.0, -1.0, -1.0]);
    const viewDirectionUBO = createGPUBuffer(device, viewDirectionBuffer, viewDirectionBuffer.byteLength, 
        GPUBufferUsage.UNIFORM);
    m_modelMatrixUBO = createGPUBuffer(device, modelMatrix, modelMatrix.byteLength, 
        GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST);
    m_viewMatrixUBO = createGPUBuffer(device, viewMatrix, viewMatrix.byteLength, GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST);
    // let modelViewMatrixUniformBuffer = createGPUBuffer(device, modelViewMatrix, GPUBufferUsage.UNIFORM);
    m_projectionMatrixUBO = createGPUBuffer(device, projectionMatrix, projectionMatrix.byteLength, 
        GPUBufferUsage.UNIFORM);
    const normalMatrixUniformBuffer = createGPUBuffer(device, normalMatrix, normalMatrix.byteLength, 
        GPUBufferUsage.UNIFORM);

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
                    buffer: m_projectionMatrixUBO
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

export function createAxisArrowsUBO(entity) {
    const device = getDevice();
    const model = entity.modelMatrix;
    glMatrix.mat4.scale(model, model, glMatrix.vec3.fromValues(4.0,4.0,4.0));
    const axisArrowsUBO = createGPUBuffer(device, model, model.byteLength, GPUBufferUsage.UNIFORM);
    m_axisArrowsUniformBindGroupLayout = device.createBindGroupLayout({
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
        ]
    });

    m_axisArrowsUniformBindGroup = device.createBindGroup({
        layout: m_axisArrowsUniformBindGroupLayout,
        entries: [
            {
                binding: 0,
                resource: {
                    buffer: axisArrowsUBO
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
                    buffer: m_projectionMatrixUBO
                }
            },
        ]
    });
}

export function createAABBUBO(entity) {
    const device = getDevice();
    const model = entity.modelMatrix;
    // const model = getModelMatrix();
    // glMatrix.mat4.translate(model, model, glMatrix.vec3.fromValues(0.0, 0.0, -10.0));
    // glMatrix.mat4.scale(model, model, glMatrix.vec3.fromValues(2.0,2.0,2.0));
    const modelUBO = createGPUBuffer(device, model, model.byteLength, GPUBufferUsage.UNIFORM);
    m_aabbUniformBindGroupLayout = device.createBindGroupLayout({
        entries: [
            {
                binding: 0,
                visibility: GPUShaderStage.FRAGMENT,
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
                buffer: {}
            },
        ]
    });

    m_aabbUniformBindGroup = device.createBindGroup({
        layout: m_aabbUniformBindGroupLayout,
        entries: [
            {
                binding: 0,
                resource: {
                    buffer: getAABBColorGPUBuffer()
                }
            },
            {
                binding: 1,
                resource: {
                    buffer: m_modelMatrixUBO
                }
            },
            {
                binding: 2,
                resource: {
                    buffer: m_viewMatrixUBO
                }
            },
            {
                binding: 3,
                resource: {
                    buffer: m_projectionMatrixUBO
                }
            },
        ]
    });
}

export function createRayUBO() {
    const device = getDevice();
    const model = glMatrix.mat4.create();
 
    const m_rayModelMatrixUBO = createGPUBuffer(device, model, model.byteLength, GPUBufferUsage.UNIFORM);
    m_rayUniformBindGroupLayout = device.createBindGroupLayout({
        entries: [
            {
                binding: 0,
                visibility: GPUShaderStage.FRAGMENT,
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
                buffer: {}
            },
        ]
    });

    m_rayUniformBindGroup = device.createBindGroup({
        layout: m_aabbUniformBindGroupLayout,
        entries: [
            {
                binding: 0,
                resource: {
                    buffer: getRayColorGPUBuffer()
                }
            },
            {
                binding: 1,
                resource: {
                    buffer: m_rayModelMatrixUBO
                }
            },
            {
                binding: 2,
                resource: {
                    buffer: m_viewMatrixUBO
                }
            },
            {
                binding: 3,
                resource: {
                    buffer: m_projectionMatrixUBO
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

export function getAxisArrowsUniformBindGroup() {
    if (!m_axisArrowsUniformBindGroup) {
        throw new Error("AxisArrowsUniformBindGroup not initialized!");
    }

    return m_axisArrowsUniformBindGroup;
}

export function getAxisArrowsUniformBindGroupLayout() {
    if (!m_axisArrowsUniformBindGroupLayout) {
        throw new Error("AxisArrowsUniformBindGroupLayout not initialized!");
    }

    return m_axisArrowsUniformBindGroupLayout;
}

export function getAABBUniformBindGroup() {
    if (!m_aabbUniformBindGroup) {
        throw new Error("aabbUniformBindGroup not initialized!");
    }

    return m_aabbUniformBindGroup;
}

export function getAABBUniformBindGroupLayout() {
    if (!m_aabbUniformBindGroupLayout) {
        throw new Error("aabbUniformBindGroupLayout not initialized!");
    }

    return m_aabbUniformBindGroupLayout;
}

export function getRayUniformBindGroup() {
    if (!m_rayUniformBindGroup) {
        throw new Error("rayUniformBindGroup not initialized!");
    }

    return m_rayUniformBindGroup;
}

export function getRayUniformBindGroupLayout() {
    if (!m_rayUniformBindGroupLayout) {
        throw new Error("rayUniformBindGroupLayout not initialized!");
    }

    return m_rayUniformBindGroupLayout;
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
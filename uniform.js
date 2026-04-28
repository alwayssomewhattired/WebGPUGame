
import * as glMatrix from 'gl-matrix';

import { createGPUBuffer } from './buffer.js'
import { getDevice } from './webgpu.js'
import { getNormalBuffer } from './buffer.js'
import { render } from './renderer.js';

let m_modelMatrixUBO = null;
let m_uniformBindGroup = null;
let m_uniformBindGroupLayout = null;
let m_texture = null;
let m_sampler = null
let m_angle = 0;
let m_lastTime = 0;

export function initUniformBuffer() {
    const device = getDevice();
    const texture = getTexture();
    const sampler = getSampler();

    let modelMatrix = glMatrix.mat4.create();
    // glMatrix.mat4.rotateZ(modelMatrix, modelMatrix, 0.5);
    // glMatrix.mat4.rotateX(modelMatrix, modelMatrix, 50.5);

    let viewMatrix = glMatrix.mat4.lookAt(
        glMatrix.mat4.create(),
        glMatrix.vec3.fromValues(20, 20, 20),
        glMatrix.vec3.fromValues(0, 0, 0),
        glMatrix.vec3.fromValues(0.0, 0.0, 1.0)
    );

    let modelViewMatrix = glMatrix.mat4.create();
    glMatrix.mat4.multiply(modelViewMatrix, modelMatrix, viewMatrix);

    let projectionMatrix = glMatrix.mat4.perspective(
        glMatrix.mat4.create(),
        1.4,
        1500.0 / 700.0,
        0.1,
        1000.0
    );

    let normalMatrix = glMatrix.mat4.create();
    glMatrix.mat4.invert(normalMatrix, modelViewMatrix);
    glMatrix.mat4.transpose(normalMatrix, normalMatrix);

    let lightDirectionBuffer = new Float32Array([-1.0, -1.0, -1.0]);
    const lightDirectionUBO = createGPUBuffer(device, lightDirectionBuffer, GPUBufferUsage.UNIFORM);
    let viewDirectionBuffer = new Float32Array([-1.0, -1.0, -1.0]);
    const viewDirectionUBO = createGPUBuffer(device, viewDirectionBuffer, GPUBufferUsage.UNIFORM);

    m_modelMatrixUBO = createGPUBuffer(device, modelMatrix, GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST);
    let viewMatrixUBO = createGPUBuffer(device, viewMatrix, GPUBufferUsage.UNIFORM);
    // let modelViewMatrixUniformBuffer = createGPUBuffer(device, modelViewMatrix, GPUBufferUsage.UNIFORM);
    let projectionMatrixUniformBuffer = createGPUBuffer(device, projectionMatrix, GPUBufferUsage.UNIFORM);
    let normalMatrixUniformBuffer = createGPUBuffer(device, normalMatrix, GPUBufferUsage.UNIFORM);

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
                    buffer: viewMatrixUBO
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

export function frame(time) {
    // console.log(time);
    const device = getDevice();
    const deltaTime = (time - m_lastTime) / 1000;
    m_lastTime = time;
    updateAngle(deltaTime);

    const modelMatrix = glMatrix.mat4.create();    
    glMatrix.mat4.rotateX(modelMatrix, modelMatrix, 1.5);
    glMatrix.mat4.rotateY(modelMatrix, modelMatrix, m_angle);
    const scalingVector = glMatrix.vec3.fromValues(0.5, 0.5, 0.5);
    glMatrix.mat4.scale(modelMatrix, modelMatrix, scalingVector);

    device.queue.writeBuffer(m_modelMatrixUBO, 0, modelMatrix);

    render();

    requestAnimationFrame(frame);
}

function updateAngle(deltaTime) {
    m_angle += deltaTime;
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
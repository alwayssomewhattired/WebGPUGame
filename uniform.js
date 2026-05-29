
import * as glMatrix from 'gl-matrix';

import { createGPUBuffer, getAxisArrowsVerticesGPUBuffer, getAABBColorGPUBuffer, 
    getRayColorGPUBuffer, getAlignedSize,
    updateDynamicGPUBuffer} from './buffer.js'
import { getDevice } from './webgpu.js'
import { getScene } from './fileParser.js';
import { getMatrix, getViewMatrix, getProjectionMatrix } from './matrix.js';

let m_rayModelMatrixUBO = null;
let m_viewMatrixUBO = null;
let m_projectionMatrixUBO = null;
let m_aabbMatrixUBO = null;
let m_dynamicModelMatrixUBO = null;
let m_dynamicModelViewMatrixUBO = null;
let m_megaMatrixUBO = null;

let m_globalTextureArray = null;


let m_uniformBindGroup = null;
let m_uniformBindGroupLayout = null;
let m_axisArrowsUniformBindGroup = null;
let m_axisArrowsUniformBindGroupLayout = null;
let m_rotationArcUniformBindGroup = null;
let m_rotationArcUniformBindGroupLayout = null;
let m_aabbUniformBindGroup = null;
let m_aabbUniformBindGroupLayout = null;
let m_rayUniformBindGroup = null;
let m_rayUniformBindGroupLayout = null;
let m_texture = null;
let m_sampler = null

let m_device = null;

export function initUniformConstructor() {
    m_device = getDevice();
}

// 0: empty mat4
// | PER-ENTITY
// 1: mesh model matrix
// 2: mesh aabb model matrix
// 3: axis arrows model matrix
// 4: axis arrows aabb model matrix
export function createMegaMatrixUBO(scene) {
    const alignedSize = getAlignedSize(64);
    const modelMatrix = glMatrix.mat4.create();
    const modelMatricesSize = scene[0].modelMatrixLength;
    const modelMatrixByteLength = (
        (modelMatrix.byteLength * modelMatricesSize) 
        * scene.length * modelMatricesSize) 
        + alignedSize;
    m_megaMatrixUBO = createGPUBuffer(m_device, modelMatrix, modelMatrixByteLength, GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST);

    for (const entity of scene) {
        updateDynamicGPUBuffer(entity, m_megaMatrixUBO);
    }
}

export function createUBO(entity) {
    const alignedSize = getAlignedSize(64);
    const texture = getTexture();
    const sampler = getSampler();

    const modelMatrix = getMatrix(entity.modelMatrixIdx);
    const viewMatrix = getViewMatrix();
    const modelViewMatrix = getMatrix(entity.modelViewIdx);
    const projectionMatrix = getProjectionMatrix();

    const normalMatrix = glMatrix.mat4.create();
    glMatrix.mat4.invert(normalMatrix, modelViewMatrix);
    glMatrix.mat4.transpose(normalMatrix, normalMatrix);

    const lightDirectionBuffer = new Float32Array([-1.0, -1.0, -1.0]);
    const lightDirectionUBO = createGPUBuffer(m_device, lightDirectionBuffer, lightDirectionBuffer.byteLength, 
        GPUBufferUsage.UNIFORM);
    const viewDirectionBuffer = new Float32Array([-1.0, -1.0, -1.0]);
    const viewDirectionUBO = createGPUBuffer(m_device, viewDirectionBuffer, viewDirectionBuffer.byteLength, 
        GPUBufferUsage.UNIFORM);

    m_viewMatrixUBO = createGPUBuffer(m_device, viewMatrix, viewMatrix.byteLength, GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST);
    m_projectionMatrixUBO = createGPUBuffer(m_device, projectionMatrix, projectionMatrix.byteLength, 
        GPUBufferUsage.UNIFORM);
    const normalMatrixUniformBuffer = createGPUBuffer(m_device, normalMatrix, normalMatrix.byteLength, 
        GPUBufferUsage.UNIFORM);

    m_uniformBindGroupLayout = m_device.createBindGroupLayout({
        entries: [
            {
                binding: 0,
                visibility: GPUShaderStage.VERTEX,
                buffer: {
                    hasDynamicOffset: true
                }
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

    m_uniformBindGroup = m_device.createBindGroup({
        layout: m_uniformBindGroupLayout,
        entries: [
            {
                binding: 0,
                resource: {
                    buffer: m_megaMatrixUBO,
                    offset: 0,
                    size: alignedSize
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
    const model = getMatrix(entity.axisArrowsModelIdx);
    const alignedSize = getAlignedSize(64);
    const axisArrowsUBO = createGPUBuffer(m_device, model, model.byteLength, GPUBufferUsage.UNIFORM);
    m_axisArrowsUniformBindGroupLayout = m_device.createBindGroupLayout({
        entries: [
            {
                binding: 0,
                visibility: GPUShaderStage.VERTEX,
                buffer: {
                    hasDynamicOffset: true
                }
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

    m_axisArrowsUniformBindGroup = m_device.createBindGroup({
        layout: m_axisArrowsUniformBindGroupLayout,
        entries: [
             {
                binding: 0,
                resource: {
                    buffer: m_megaMatrixUBO,
                    offset: 0,
                    size: alignedSize
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

// | - rotation arc
// | - rotation arc head
export function createRotationArcUBO(entity) {
    const model = getMatrix(entity.rotationArcModelIdx);
    const alignedSize = getAlignedSize(64);
    const rotationArcUBO = createGPUBuffer(m_device, model, model.byteLength, GPUBufferUsage.UNIFORM);
    m_rotationArcUniformBindGroupLayout = m_device.createBindGroupLayout({
        entries: [
            {
                binding: 0,
                visibility: GPUShaderStage.VERTEX,
                buffer: {
                    hasDynamicOffset: true
                }
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
7
    m_rotationArcUniformBindGroup = m_device.createBindGroup({
        layout: m_rotationArcUniformBindGroupLayout,
        entries: [
             {
                binding: 0,
                resource: {
                    buffer: m_megaMatrixUBO,
                    offset: 0,
                    size: alignedSize
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
    const objectDataSize = 64 // 16 floats for model matrix
    const alignedSize = getAlignedSize(objectDataSize);
    const bufferAllocationSize = alignedSize * entity.modelMatrixLength;

    m_aabbUniformBindGroupLayout = m_device.createBindGroupLayout({
        entries: [
            {
                binding: 0,
                visibility: GPUShaderStage.FRAGMENT,
                buffer: {}
            },
            {
                binding: 1,
                visibility: GPUShaderStage.VERTEX,
                buffer: {
                    hasDynamicOffset: true
                }
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

    m_aabbUniformBindGroup = m_device.createBindGroup({
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
                    buffer: m_megaMatrixUBO,
                    offset: 0,
                    size: alignedSize
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
    const model = glMatrix.mat4.create();
    const alignedSize = getAlignedSize(64);
 
    m_rayUniformBindGroupLayout = m_device.createBindGroupLayout({
        entries: [
            {
                binding: 0,
                visibility: GPUShaderStage.FRAGMENT,
                buffer: {}
            },
            {
                binding: 1,
                visibility: GPUShaderStage.VERTEX,
                buffer: {
                    hasDynamicOffset: true
                }
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

    m_rayUniformBindGroup = m_device.createBindGroup({
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
                    buffer: m_megaMatrixUBO,
                    offset: 0,
                    size: alignedSize
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

    // we assume all textures are 1024 x 1024
    const textureCount = 2;
    const textureDescriptor = {
        size: { width: 1024, height: 1024, depthOrArrayLayers: textureCount},
        format: 'rgba8unorm',
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT 
    };

    let response = null;
    const scene = getScene();
    let count = 0;
    for (let i = 0; i < scene.length; i++) {
        const entity = scene[i];
        for (const [name, path] of entity.materials) {
            response = await fetch(path);
        
            const blob = await response.blob();
            const imgBitmap = await createImageBitmap(blob);

            const texture = m_device.createTexture(textureDescriptor);

            m_globalTextureArray.push(texture);

            m_device.queue.copyExternalImageToTexture(
                { source: imgBitmap }, 
                { texture }, 
                textureDescriptor.size
            );

            imgBitmap.close();
            
            entity.textureIdx = count;
            count ++;
        }
    }


    m_sampler = m_device.createSampler({
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


export function getRotationArcUniformBindGroup() {
    if (!m_rotationArcUniformBindGroup) {
        throw new Error("RotationArcUniformBindGroup not initialized!");
    }

    return m_rotationArcUniformBindGroup;
}

export function getRotationArcUniformBindGroupLayout() {
    if (!m_rotationArcUniformBindGroupLayout) {
        throw new Error("RotationArcUniformBindGroupLayout not initialized!");
    }

    return m_rotationArcUniformBindGroupLayout;
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

export function getViewMatrixUBO() {
    if (!m_viewMatrixUBO) {
        throw new Error("View Matrix UBO not initialized!");
    }

    return m_viewMatrixUBO;
}

export function getMegaMatrixUBO() {
    if (!m_megaMatrixUBO) {
        throw new Error("Mega Matrix UBO not initialized!");
    }

    return m_megaMatrixUBO;
}
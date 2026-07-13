
import * as glMatrix from 'gl-matrix';

import { createGPUBuffer, getAxisArrowsVerticesGPUBuffer, getAABBColorGPUBuffer, 
    getRayColorGPUBuffer, getAlignedSize,
    updateDynamicGPUBuffer} from './buffer.js'
import { getDevice, ZACH_GAME_PATH } from './webgpu.js'
import { getScene } from './fileParser.js';
import { getMatrix, getViewMatrix, getProjectionMatrix } from './matrix.js';
import { getCameraPosition } from './camera.js';
import { directionLightBuffer, pointLightsData, createDirectionLightBuffer, pointLightBuffer, createPointLightBuffer, createDebugLightBuffer, debugLightBuffer } from './light.js';
import { toggleDirectionLight } from './keyboardListeners.js';
import { parseTexturesFromGLB, textureCount } from './texture.js';
import {textureCount as ext_textureCount } from './texture.js'

let m_rayModelMatrixUBO = null;
let m_viewMatrixUBO = null;
let m_projectionMatrixUBO = null;
let m_aabbMatrixUBO = null;
let m_dynamicModelMatrixUBO = null;
let m_dynamicModelViewMatrixUBO = null;
let m_megaMatrixUBO = null;
let m_cameraPositionUBO = null;
let m_pointLightUBO = null;

let m_globalTextureUBO = null;
let m_textureCount = null;
let m_globalTextureIndices = [];

let m_globalUniformBindGroup = null;
let m_globalUniformBindGroupLayout = null;
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
let m_colorUniformBindGroup = null;
let m_colorUniformBindGroupLayout = null;


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

    let meshCount = 0;
    for (const entity of scene) {
        meshCount += entity.meshes.length;
    }

    const modelMatricesSize = scene[0].modelMatrixLength;
    const modelMatrixByteLength = 
    (
        (modelMatrix.byteLength * modelMatricesSize) 
        * meshCount * modelMatricesSize
    ) + alignedSize;

    m_megaMatrixUBO = createGPUBuffer(m_device, modelMatrix, modelMatrixByteLength, GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST);

    // for (const entity of scene) {
    //     for (const mesh of entity.meshes) {
    //         updateDynamicGPUBuffer(entity, m_megaMatrixUBO);
    //     }
    // }
}

export function createGlobalBindGroup() {

    const sampler = m_sampler;
    const viewMatrix = getViewMatrix();
    const projectionMatrix = getProjectionMatrix();

    m_viewMatrixUBO = createGPUBuffer(m_device, viewMatrix, viewMatrix.byteLength, GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST);
    m_projectionMatrixUBO = createGPUBuffer(m_device, projectionMatrix, projectionMatrix.byteLength, GPUBufferUsage.UNIFORM);

    const textureUBO = m_globalTextureUBO;
    createDirectionLightBuffer(new Float32Array([-1.0, -1.0, -1.0, 0.0]));
    createPointLightBuffer();
    
    m_cameraPositionUBO = createGPUBuffer(m_device, getCameraPosition(), getCameraPosition().byteLength,
        GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    );

    createDebugLightBuffer();

    m_globalUniformBindGroupLayout = m_device.createBindGroupLayout({
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
                texture: {
                    sampleType: 'float',
                    viewDimension: '2d-array'
                }
            },
            {
                binding: 3,
                visibility: GPUShaderStage.FRAGMENT,
                sampler: {}
            },
            {
                binding: 4,
                visibility: GPUShaderStage.VERTEX,
                buffer: {}
            },
            {
                binding: 5,
                visibility: GPUShaderStage.VERTEX,
                buffer: {}
            },
            {
                binding: 6,
                visibility: GPUShaderStage.FRAGMENT,
                buffer: {}
            },
            {
                binding: 7,
                visibility: GPUShaderStage.FRAGMENT,
                buffer: {}
            },
        ]
    });

    m_globalUniformBindGroup = m_device.createBindGroup({
        layout: m_globalUniformBindGroupLayout,
        entries: [
            {
                binding: 0,
                resource: {
                    buffer: m_viewMatrixUBO
                }
            },
            {
                binding: 1,
                resource: {
                    buffer: m_projectionMatrixUBO
                }
            },
            {
                binding: 2,
                resource: m_globalTextureUBO.createView({ dimension: '2d-array'})
            },
            {
                binding: 3,
                resource: sampler
            },
            {
                binding: 4,
                resource: {
                    buffer: directionLightBuffer
                }
            },
            {
                binding: 5,
                resource: {
                    buffer: m_cameraPositionUBO
                }
            },
           {
                binding: 6,
                resource: {
                    buffer: pointLightBuffer
                }
            },
           {
                binding: 7,
                resource: {
                    buffer: debugLightBuffer
                }
            }
        ]
    });
}

export function createUBO() {
    const alignedSize = getAlignedSize(64);

    const alignedTextureSize = alignedSize * ext_textureCount;
    const globalTextureIndicesArray = new Uint32Array(m_globalTextureIndices);

    const textureIndexUBO = createGPUBuffer(m_device, globalTextureIndicesArray, alignedTextureSize, GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST);

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
                buffer: { 
                    hasDynamicOffset: true
                }
            },
            {
                binding: 2,
                visibility: GPUShaderStage.FRAGMENT,
                buffer: {
                    hasDynamicOffset: true
                }
            }
        ]
    });

    // model matrix
    // textures
    // textreIndices
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
                    buffer: m_megaMatrixUBO,
                    offset: alignedSize * 8,
                    size: alignedSize
                }
            },
            {
                binding: 2,
                resource: {
                    buffer: textureIndexUBO,
                    offset: 0,
                    size: alignedSize
                }
            }
        ]
    });
}

export function createAxisArrowsUBO(mesh) {
    const model = getMatrix(mesh.axisArrowsModelIdx);
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
            }
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
            }
        ]
    });
}

export function createColorUBO(mesh) {
    const model = getMatrix(mesh.modelMatrixIdx);
    const alignedSize = getAlignedSize(64);
    const axisArrowsUBO = createGPUBuffer(m_device, model, model.byteLength, GPUBufferUsage.UNIFORM);
    const color = glMatrix.vec4.fromValues(0.25, 0.5, 1.0, 0.0);
    const colorUBO = createGPUBuffer(m_device, color, color.byteLength, GPUBufferUsage.UNIFORM);
    m_colorUniformBindGroupLayout = m_device.createBindGroupLayout({
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
                visibility: GPUShaderStage.FRAGMENT,
                buffer: {}
            },
           {
                binding: 2,
                visibility: GPUShaderStage.VERTEX,
                buffer: {
                    hasDynamicOffset: true
                }
            }
        ]
    });

    m_colorUniformBindGroup = m_device.createBindGroup({
        layout: m_colorUniformBindGroupLayout,
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
                resource: colorUBO
            },
             {
                binding: 2,
                resource: {
                    buffer: m_megaMatrixUBO,
                    offset: 0,
                    size: alignedSize
                }
            }
        ]
    });
}

// | - rotation arc
// | - rotation arc head
export function createRotationArcUBO(mesh) {
    const model = getMatrix(mesh.rotationArcModelIdx);
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
            }
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
            }
        ]
    });
}

export function createAABBUBO(mesh) {
    const objectDataSize = 64 // 16 floats for model matrix
    const alignedSize = getAlignedSize(objectDataSize);
    const bufferAllocationSize = alignedSize * mesh.modelMatrixLength;

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
            }
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
            }
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
            }
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
            }
        ]
    });
}



///////////////////////////////////////

export function updateCameraPosUBO(cameraPos) {
    getDevice().queue.writeBuffer(m_cameraPositionUBO, 0, cameraPos);
};

export async function initTextures() {
    
    const textureDescriptor = {
        size: { width: 1024, height: 1024, depthOrArrayLayers: textureCount},
        format: 'rgba8unorm',
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT 
    };

    m_globalTextureUBO = m_device.createTexture(textureDescriptor);

    let response = null;
    const scene = getScene();
    let count = 0;
    for (let i = 0; i < scene.length; i++) {
        const entity = scene[i];
        if (entity.fileExt === 'glb') {
            parseTexturesFromGLB(entity.json, entity.binBuffer, m_globalTextureUBO, textureDescriptor, count);
        } else if (entity.fileExt === 'obj') {
        for (const [name, path] of entity.materials) {
            response = await fetch(ZACH_GAME_PATH + '/' + path);
        
            const blob = await response.blob();
            const imgBitmap = await createImageBitmap(blob);

            updateGlobalTextureUBO(imgBitmap, count, textureDescriptor)

            imgBitmap.close();
        }
    }
       for (const mesh of entity.meshes) {
            const arr = new Array(64)
            arr[0] = count;
            m_globalTextureIndices.push(...arr);
            count++;
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

export function updateGlobalTextureUBO(imgBitMap, count, textureDescriptor) {
    let imgBitMapCopy = imgBitMap;
    if (imgBitMap.width < 1024 || imgBitMap.height < 1024) {
        // here we stretch image to 1024x1024
        const canvas = new OffscreenCanvas(1024, 1024);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(imgBitMap, 0, 0, 1024, 1024);
        imgBitMapCopy = canvas.transferToImageBitmap();
    }
    m_device.queue.copyExternalImageToTexture(
        { source: imgBitMapCopy }, 
        { texture: m_globalTextureUBO,
          origin: {
                x: 0,
                y: 0,
                z: count
          }
        },
        {
            width: textureDescriptor.size.width,
            height: textureDescriptor.size.height
        }
    );

}

export function getGlobalUniformBindGroup() {
    if (!m_globalUniformBindGroup) {
        throw new Error("Global UniformBufferBindGroup not initialized!");
    }

    return m_globalUniformBindGroup;
}

export function getGlobalUniformBindGroupLayout() {
    if (!m_globalUniformBindGroupLayout) {
        throw new Error("Global UniformBufferBindGroupLayout not initialized!");
    }

    return m_globalUniformBindGroupLayout;
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

export function getColorUniformBindGroup() {
    if (!m_colorUniformBindGroup) {
        throw new Error("colorUniformBindGroup not initialized!");
    }

    return m_colorUniformBindGroup;
}

export function getColorUniformBindGroupLayout() {
    if (!m_colorUniformBindGroupLayout) {
        throw new Error("colorUniformBindGroupLayout not initialized!");
    }

    return m_colorUniformBindGroupLayout;
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

export function getGlobalTextureArray() {
    if (!m_globalTextureArray) throw new Error("global texture array is null!!!");

    return m_globalTextureArray;
}
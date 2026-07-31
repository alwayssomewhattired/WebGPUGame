import { filePaths, getScene, sceneNameToIndexMap } from "./fileParser.js";
import { getAddressMode, getMagFilter, getMinFilter } from "./openglEnums.js";
import { appendGlobalTextureIndices, globalTextureUBO, setGlobalTextureUBO, updateGlobalTextureUBO } from "./uniform.js";
import { getDevice, ZACH_GAME_PATH } from "./webgpu.js";

export let textureCount = 0;
// initializes global texture in a single pass
export function globalTextureCountIncrement(inc) {
    textureCount += inc;
}

export let globalTextureOffset = 0;
// steps through all textures of an entity at a time
export function globalTextureOffsetIncrement(inc) {
    globalTextureOffset += inc;
}

// initialize texture count before we create entities
// necessary for global texture buffer
export async function initTextureCount() {
    for (const path in filePaths) {
        if (path.split('.').pop() === 'glb') {
            const arrayBuffer = await fetch(url).then(r => r.arrayBuffer());
            const view = new DataView(arrayBuffer);

            const magic = String.fromCharCode(
                view.getUint8(0),
                view.getUint8(1),
                view.getUint8(2),
                view.getUint8(3)
            );

            if (magic !== "glTF") throw new Error("File is not GLB");

            const version = view.getUint32(4, true);
            const length = view.getUint32(8, true);

            let offset = 12;

            let json = null;
            let binBuffer = null;
            let binOffset = null;

            while (offset < length) {
                const chunkLength = view.getUint32(offset, true);
                offset += 4;

                const chunkType = view.getUint32(offset, true);
                offset += 4;

                const chunkBytes = new Uint8Array(arrayBuffer, offset, chunkLength);

                // JSON chunk
                if (chunkType === 0x4E4F534A) {
                    json = JSON.parse(new TextDecoder().decode(chunkBytes));
                }

                // BIN chunk
                if (chunkType === 0x004E4942) {
                    // binBuffer = chunkBytes.buffer;
                    binBuffer = arrayBuffer.slice(offset, offset + chunkLength);
                }

                offset += chunkLength;
            }        
        }
    }
}

export async function parseTexturesFromGLB(json, binBuffer, globalTextureBuffer, textureDescriptor, 
    globalTextureOffset
) {
    const device = getDevice();
    const materials = json.materials;
    const textures = json.textures;
    const samplers = json.samplers;
    const images = json.images;
    const bufferViews = json.bufferViews;

    for (const material of materials) {
        const textureIndex = material.pbrMetallicRoughness.baseColorTexture.index;
        const texture = textures[textureIndex];
        const image = images[texture.source];
        const bufferView = bufferViews[image.bufferView];

        // image extraction
        const imageBytes = new Uint8Array(
            binBuffer,
            bufferView.byteOffset,
            bufferView.byteLength
        );
        const blob = new Blob(
            [imageBytes],
            { type: image.mimeType }
        );
        const bitMap = await createImageBitmap(blob);
        updateGlobalTextureUBO(bitMap, globalTextureOffset + textureIndex, textureDescriptor)
        
        bitMap.close();        
        
        // const textureView = gpuTexture.createView();
        
        // const sampler = samplers[texture.sampler];
        
        // const min = getMinFilter(sampler.minFilter);
        
        // const gpuSampler = device.createSampler({
            //     magFilter: getMagFilter(sampler.magFilter),
            //     minFilter: min.minFilter,
            //     minmapFilter: min.mipmapFilter,
            //     addressModeU: getAddressMode(sampler.wrapS),
            //     addressModeV: getAddressMode(sampler.wrapT),
            
            //     addressModeW: "repeat"
            // });
        }

}

export async function parseTexturesFromOBJ(materials, textureDescriptor, globalTextureOffset) {

    for (const [name, path] of materials) {
        const response = await fetch(ZACH_GAME_PATH + '/' + path);
    
        const blob = await response.blob();
        const imgBitmap = await createImageBitmap(blob);

        updateGlobalTextureUBO(imgBitmap, globalTextureOffset, textureDescriptor)

        imgBitmap.close();

    }
}

export let sampler = null;

function createSampler() {
    sampler = getDevice().createSampler({
        addressModeU: 'repeat',
        addressModeV: 'repeat',
        magFilter: 'linear',
        minFilter: 'linear',
        minmapFilter: 'linear',
    });
}

export async function initTextures() {

    createSampler();
    
    const textureDescriptor = {
        size: { width: 1024, height: 1024, depthOrArrayLayers: textureCount},
        format: 'rgba8unorm',
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT 
    };

   setGlobalTextureUBO(textureDescriptor);

    const scene = getScene();
    let count = 0;
    for (let i = 0; i < scene.length; i++) {
        const entity = scene[i];
        if (entity.fileExt === 'glb') {
            parseTexturesFromGLB(entity.json, entity.binBuffer, globalTextureUBO, textureDescriptor, 
                entity.globalTextureOffset);
        } else if (entity.fileExt === 'obj') {
            parseTexturesFromOBJ(entity.materials, textureDescriptor, entity.globalTextureOffset);
        }
        for (const mesh of entity.meshes) {
            appendGlobalTextureIndices();
        }
    }

} 

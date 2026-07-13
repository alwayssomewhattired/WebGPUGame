import { filePaths, sceneNameToIndexMap } from "./fileParser.js";
import { getAddressMode, getMagFilter, getMinFilter } from "./openglEnums.js";
import { updateGlobalTextureUBO } from "./uniform.js";
import { getDevice } from "./webgpu.js";

export let textureCount = 0;

export function globalTextureCountIncrement(inc) {
    textureCount += inc;
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

            textureCount += json.textures.length;
        
        }
    }
}


export async function parseTexturesFromGLB(json, binBuffer, globalTextureBuffer, textureDescriptor, count) {
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

        updateGlobalTextureUBO(bitMap, count, textureDescriptor)

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
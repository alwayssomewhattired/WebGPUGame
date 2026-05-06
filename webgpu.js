

let device = null;
let m_shaderModule = null;
let m_instancedShaderModule = null;
let m_aabbShaderModule = null;

export async function initWebGPU() {
    if (!navigator.gpu) {
        console.error("WebGPU support is not available");
        showWarning("WebGPU support is not available. WebGPU compatible browser is needed in order to run this program");
        throw new Error("WebGPU support is unavailable");
        return;
    }

    const adapter = await navigator.gpu.requestAdapter();
    if(!adapter) {
        console.error("Failed to find adaptor. Needed to find a device.");
        return;
    }

    device = await adapter.requestDevice();
    if(!device) {
        console.error("Failed to request device");
        return;
    }

    let response = await fetch("./shaders/shaders.wgsl");
    let shaderSource = await response.text();

    m_shaderModule = device.createShaderModule({
        label: 'shader',
        code: shaderSource
    });

    response = await fetch("./shaders/instancedShader.wgsl");
    shaderSource = await response.text();

    m_instancedShaderModule = device.createShaderModule({
        label: 'instancedShader',
        code: shaderSource
    });

    response = await fetch("./shaders/aabbShader.wgsl");
    shaderSource = await response.text();

    m_aabbShaderModule = device.createShaderModule({
        label: 'aabbShader',
        code: shaderSource
    });
    
}

export function getDevice() {
    if(!device) {
        throw new Error("WebGPU device has not been initialized yet!");
    }

    return device;
}

export function getShaderModule() {
    if (!m_shaderModule) {
        throw new Error("Shader module is not initialized!")
    }

    return m_shaderModule;
}

export function getInstancedShaderModule() {
    if (!m_instancedShaderModule) {
        throw new Error("Instanced Shader module is not initialized!")
    }

    return m_instancedShaderModule;
}

export function getAABBShaderModule() {
    if (!m_aabbShaderModule) {
        throw new Error("AABB Shader module is not initialized!")
    }

    return m_aabbShaderModule;
}
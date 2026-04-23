

let device = null;
let m_shaderModule = null;

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

    const response = await fetch("./shaders.wgsl");
    const shaderSource = await response.text();

    m_shaderModule = device.createShaderModule({
        label: 'shader',
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
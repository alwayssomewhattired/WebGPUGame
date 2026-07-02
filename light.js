import { createGPUBuffer } from "./buffer.js";
import { getDevice } from "./webgpu.js";


export let directionLightBuffer = null;
export function createDirectionLightBuffer(buffer) {
    directionLightBuffer = createGPUBuffer(getDevice(), buffer, buffer.byteLength, GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST);
};
export function updateDirectionLightBuffer(buffer) {
    getDevice().queue.writeBuffer(directionLightBuffer, 0, buffer);
}

export let pointLightBuffer = null;
export let pointLightsData = null;
const pointLights = [
    {
        positionAndToggle: new Float32Array([-1, 5, 10, 0])
        // color: [0, 1, 0, 3]
    }
];

export function createPointLightBuffer() {
    const buffer = pointLights[0].positionAndToggle;
    pointLightBuffer = createGPUBuffer(getDevice(), buffer, buffer.byteLength, GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST);
};
export function updatePointLightBuffer(buffer) {
    getDevice().queue.writeBuffer(pointLightBuffer, 0, buffer);
}
export function initPointLights() {
    const lightsCount = pointLights.length;
    const pointLightBytes = 8;
    pointLightsData = new Float32Array(pointLights[0].positionAndToggle);

    // for (let i = 0; i < lightsCount; i++) {
    //     const offset = i * pointLightBytes;

    //     pointLightsData.set(lights[i].positionAndToggle, offset);
        // pointLightsData.set(lights[i].color, offset +  4);
    // }
}

// | debug light aka debug light toggle
export let debugLightBuffer = null;
const debugLightData = new Float32Array([0.0, 1.0]); // normals,reg-color
export function createDebugLightBuffer() {
    const buffer = debugLightData;
    debugLightBuffer = createGPUBuffer(getDevice(), buffer, buffer.byteLength, GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST);
};
export function updateDebugLightBuffer(buffer) {
    getDevice().queue.writeBuffer(debugLightBuffer, 0, buffer);
}



let m_sphereRawVertexCount = null;
const m_vertices = [];

export function generateUVSphere(radius, segments) {
    
    for (let lat = 0; lat <= segments; lat++) {
        const theta = (lat * Math.PI) / segments;
        const sinTheta = Math.sin(theta);
        const cosTheta = Math.cos(theta);
        
        for (let lon = 0; lon <= segments; lon++) {
            const phi = (lon * 2 * Math.PI) / segments;
            const sinPhi = Math.sin(phi);
            const cosPhi = Math.cos(phi);
            
            const x = cosPhi * sinTheta;
            const y = cosTheta;
            const z = sinPhi * sinTheta;
            
            const r = 1.0;
            const g = 0.5;
            const b = 0.0;

            m_vertices.push(
                (x * radius) + pointLights[0].positionAndToggle[0], 
                (y * radius) + pointLights[0].positionAndToggle[1], 
                (z * radius) + pointLights[0].positionAndToggle[2], 
                r, g, b
            );
        }
    }
    m_sphereRawVertexCount = m_vertices.length;
    return new Float32Array(m_vertices);
}

export function getSphereRawVertexCount() {
    return m_sphereRawVertexCount / 6;
}
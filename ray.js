
import * as glMatrix from "gl-matrix"

import { getViewProjectionMatrix } from "./matrix.js";
import { getDevice } from "./webgpu.js";
import { createGPUBuffer } from "./buffer.js";

const m_rayVerticesBuffer = [];

export function getRayVerticesBuffer() {
    return m_rayVerticesBuffer;
}

export function createRayVerticesGPUBuffer(origin, direction) {

    const device = getDevice();

    // | calculate ray's 'end' vertices
    const rayLength = 1000.0;
    const end = [
        origin[0] + direction[0] * rayLength,
        origin[1] + direction[1] * rayLength,
        origin[2] + direction[2] * rayLength,
    ];

    const rayVertices = new Float32Array([
        // start
        origin[0],
        origin[1],
        origin[2],

        // end
        end[0],
        end[1],
        end[2]
    ]);

    return createGPUBuffer(device, rayVertices, rayVertices.byteLength, GPUBufferUsage.VERTEX);
}


export function getWorldSpaceRayFromMouse(mouseX, mouseY) {
    const x = (2.0 * mouseX) / canvas.width - 1.0;
    const y = 1.0 - (2.0 * mouseY) / canvas.height;

    const viewProj = getViewProjectionMatrix();
    const invViewProj = glMatrix.mat4.create();
    glMatrix.mat4.invert(invViewProj, viewProj);
    
    // const nearPoint = glMatrix.vec4.fromValues(x, y, -1.0, 1.0);
    // const farPoint = glMatrix.vec4.fromValues(x, y, 1.0, 1.0);

    const nearPoint = glMatrix.vec4.fromValues(x, y, 0, 1.0);
    const farPoint = glMatrix.vec4.fromValues(x, y, 1.0, 1.0);

    // | Transforms both points to world space
    glMatrix.vec4.transformMat4(nearPoint, nearPoint, invViewProj);
    glMatrix.vec4.transformMat4(farPoint, farPoint, invViewProj);

    // | Perspective divide
    glMatrix.vec4.scale(nearPoint, nearPoint, 1.0 / nearPoint[3]);
    glMatrix.vec4.scale(farPoint, farPoint, 1.0 / farPoint[3]);
    const rayOrigin = glMatrix.vec3.fromValues(nearPoint[0], nearPoint[1], nearPoint[2]);
    console.log(rayOrigin)
    const rayDir = glMatrix.vec3.create();
    glMatrix.vec3.subtract(rayDir, farPoint, nearPoint);
    glMatrix.vec3.normalize(rayDir, rayDir);
    
    return { origin: rayOrigin, direction: rayDir };

}
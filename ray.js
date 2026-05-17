
import * as glMatrix from "gl-matrix"

import { getViewProjectionMatrix, getModelMatrix } from "./matrix.js";
import { getDevice } from "./webgpu.js";
import { createGPUBuffer } from "./buffer.js";
import { intersectAABB } from "./transformGizmo.js";

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
    const rayDir = glMatrix.vec3.create();
    glMatrix.vec3.subtract(rayDir, farPoint, nearPoint);
    glMatrix.vec3.normalize(rayDir, rayDir);
    
    return { origin: rayOrigin, direction: rayDir };

}

export function getSelectedObject(worldSpaceRay, scene) {
    let closestDist = Infinity;
    let selected = null;
    const invModelMatrix = glMatrix.mat4.create();

    for (const entity of scene) {
        if (entity.isSelected) entity.isSelected = false;
        glMatrix.mat4.invert(invModelMatrix, getModelMatrix(entity.modelMatrixIdx));

        // | translation bypass (w = 0)
        const dir4 = glMatrix.vec4.fromValues(
            worldSpaceRay.direction[0],
            worldSpaceRay.direction[1],
            worldSpaceRay.direction[2],
            0.0
        )
        glMatrix.vec4.transformMat4(dir4, dir4, invModelMatrix);
        const localDir = glMatrix.vec3.fromValues(dir4[0], dir4[1], dir4[2]);
        glMatrix.vec3.normalize(localDir, localDir);

        const ray_ls = {

            origin: glMatrix.vec3.transformMat4(glMatrix.vec3.create(), worldSpaceRay.origin, invModelMatrix),
            direction: localDir

        };

        const aabbMin = entity.mesh.aabbMin;
        const aabbMax = entity.mesh.aabbMax;
 
        const distance = intersectAABB(ray_ls, { aabbMin, aabbMax});

        if (distance !== null && distance < closestDist) {
            closestDist = distance;
            selected = entity;
        }
    }

    selected.isSelected = true;
    return selected;
}
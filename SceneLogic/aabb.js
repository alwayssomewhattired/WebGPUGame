
import * as glMatrix from 'gl-matrix'

import { getDevice } from "../Renderer/webgpu.js";
import { createGPUBuffer } from "../Renderer/buffer.js";
import { gizmoPositionsCPUBuffer } from "./transformGizmo.js";

let m_aabbGizmoPositionsGPUBuffer = null;

export function getAABBGizmoPositionsGPUBuffer() {
    if (!m_aabbGizmoPositionsGPUBuffer) {
        m_aabbGizmoPositionsGPUBuffer = createGPUBuffer(getDevice(), gizmoPositionsCPUBuffer,
        gizmoPositionsCPUBuffer.byteLength, GPUBufferUsage.VERTEX)
    }
    
    return m_aabbGizmoPositionsGPUBuffer;
}
export const axesBoxes = {
    x: {
        aabbMin: [0.0, -0.1, -0.1],
        aabbMax: [1.0, 0.1, 0.1]
    },
    y: {
        aabbMin: [-0.1, 0.0, -0.1],
        aabbMax: [0.1, 1.0, 0.1]
    },
    z: {
        aabbMin: [-0.1, -0.1, 0.0],
        aabbMax: [0.1, 0.1, 1.0]
    }
};

export function intersectAABB(ray, box) {
    let tMin = -Infinity;
    let tMax = Infinity;

    for (let i = 0; i < 3; i++) {
        const invDir = 1.0 / ray.direction[i];
        let t1 = (box.aabbMin[i] - ray.origin[i]) * invDir;
        let t2 = (box.aabbMax[i] - ray.origin[i]) * invDir;

        // | Makes sure t1 is entry and t2 is exit
        if (t1 > t2) [t1, t2] = [t2, t1];

        tMin = Math.max(tMin, t1);
        tMax = Math.min(tMax, t2);
    }

    // | returns distance to hit
    if (tMax >= tMin && tMax >= 0) {
        return tMin >= 0 ? tMin : tMax;
    }
    return null;
}

export function findAxis(mouseRay, entity) {
    // - broken line needs fixed!!!!!!!!! vvvvv
    const gizmoMatrix_ws = glMatrix.mat4.fromTranslation(glMatrix.mat4.create(), entity.meshes[0].getMeshTranslation());
    
    const invGizmoMatrix_ws = glMatrix.mat4.invert(glMatrix.mat4.create(), gizmoMatrix_ws);
    const invModel3x3 = glMatrix.mat3.fromMat4(glMatrix.mat3.create(), invGizmoMatrix_ws);
    const direction_ls = glMatrix.vec3.transformMat3(glMatrix.vec3.create(), mouseRay.direction, invModel3x3);
    glMatrix.vec3.normalize(direction_ls, direction_ls);

    const ray_ls = {
        origin: glMatrix.vec3.transformMat4(glMatrix.vec3.create(), mouseRay.origin, invGizmoMatrix_ws),
        direction: glMatrix.vec3.normalize(glMatrix.vec3.create(), direction_ls
        )
    };

    let closestAxis = null;
    let minT = Infinity;

    for (const axis in axesBoxes) {
        const box = axesBoxes[axis];
        const t = intersectAABB(ray_ls, box);
        if (t !== null && t < minT) {
            minT = t;
            closestAxis = axis;
        }
    }
    
    return closestAxis;
}
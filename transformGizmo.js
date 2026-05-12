
import * as glMatrix from 'gl-matrix'
import { getViewProjectionMatrix } from './matrix.js';
import { getScene } from "./fileParser.js"
import { createGPUBuffer } from './buffer.js';
import { getDevice } from './webgpu.js';
import { getWorldSpaceRayFromMouse, createRayVerticesGPUBuffer, getRayVerticesBuffer, getSelectedObject } from './ray.js';
import { keyboardInput } from './keyboardListeners.js';

let m_activeAxis = null;
let m_aabbPositionsOffset;
let m_aabbGizmoPositionsGPUBuffer = null;

export const gizmoPositionsCPUBuffer = new Float32Array([
    // bottom square
    -1,-1,-1,  1,-1,-1,
     1,-1,-1,  1,-1, 1,
     1,-1, 1, -1,-1, 1,
    -1,-1, 1, -1,-1,-1,
    // top square
    -1, 1,-1,  1, 1,-1,
     1, 1,-1,  1, 1, 1,
     1, 1, 1, -1, 1, 1,
    -1, 1, 1, -1, 1,-1,
    // vertical lines
    -1,-1,-1, -1, 1,-1,
     1,-1,-1,  1, 1,-1,
     1,-1, 1,  1, 1, 1,
    -1,-1, 1, -1, 1, 1,
]);

export function getAABBGizmoPositionsGPUBuffer() {
    if (!m_aabbGizmoPositionsGPUBuffer) {
        m_aabbGizmoPositionsGPUBuffer = createGPUBuffer(getDevice(), gizmoPositionsCPUBuffer,
        gizmoPositionsCPUBuffer.byteLength, GPUBufferUsage.VERTEX)
    }

    return m_aabbGizmoPositionsGPUBuffer;
}

const axesBoxes = {
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

export function initTransformGizmo() {

    canvas.addEventListener("mousedown", ({x, y}) => {
        const ray_ws = getWorldSpaceRayFromMouse(x, y);
        if (keyboardInput.b) {
        getRayVerticesBuffer().push(createRayVerticesGPUBuffer(ray_ws.origin, ray_ws.direction));
        } 
        // else {
        //     getRayVerticesBuffer().length = 0;
        // }
        const currentEntity = getSelectedObject(ray_ws, getScene());
        if (currentEntity == null) throw new Error ("Entity is null!!!");
        m_activeAxis = findAxis(ray_ws, currentEntity);
    });

    canvas.addEventListener("mousemove", (e) => {
        if (m_activeAxis) {
            const moveDist = calculateWorldDelta(e, m_activeAxis);

            if (m_activeAxis === 'x') currentEntity.position[0] += moveDist;
            if (m_activeAxis === 'y') currentEntity.position[1] += moveDist;
            if (m_activeAxis === 'z') currentEntity.position[2] += moveDist;

            currentEntity.initModelMatrix();
        }
    })

    canvas.addEventListener("mouseup", (e) => {
        if (m_activeAxis) m_activeAxis = null;
    })
}


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

function calculateWorldDelta(event, axis) {
    const planeNormal = getBestPlaneNormal(axis);
    const planePoint = selectedObject.pos;

    const currentHit = intersectRayPlane(ray, planeNormal, planePoint);

    if (!m_lastHitPoint) {
        m_lastHitPoint = currentHit;
        return 0;
    }

    const delta = currentHit[axisIndex(axis)] - m_lastHitPoint[axisIndex(axis)];

    m_lastHitPoint = currentHit;

    return delta;
}

function findAxis(mouseRay, entity) {
    const gizmoMatrix_ws = glMatrix.mat4.fromTranslation(glMatrix.mat4.create(), entity.translation);
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
    // - closest Axis is always null here
    return closestAxis;
}
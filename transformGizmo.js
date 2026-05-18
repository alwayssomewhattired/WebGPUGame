
import * as glMatrix from 'gl-matrix'
import { getModelMatrix, getViewProjectionMatrix } from './matrix.js';
import { getScene } from "./fileParser.js"
import { createGPUBuffer, updateDynamicGPUBuffer } from './buffer.js';
import { getDevice } from './webgpu.js';
import { getWorldSpaceRayFromMouse, createRayVerticesGPUBuffer, getRayVerticesBuffer, getSelectedObject } from './ray.js';
import { keyboardInput } from './keyboardListeners.js';

let m_activeAxis = null;
let m_aabbPositionsOffset;
let m_aabbGizmoPositionsGPUBuffer = null;
let m_currentEntity = null;
let m_ray_ws = null;
let m_lastHitPoint = null;

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
        m_ray_ws = getWorldSpaceRayFromMouse(x, y);
        if (keyboardInput.b) {
        getRayVerticesBuffer().push(createRayVerticesGPUBuffer(m_ray_ws.origin, m_ray_ws.direction));
        } 

        m_currentEntity = getSelectedObject(m_ray_ws, getScene());
        if (!m_currentEntity) return;
        m_activeAxis = findAxis(m_ray_ws, m_currentEntity);
    });

    canvas.addEventListener("mousemove", (e) => {
        if (m_activeAxis) {
            m_ray_ws = getWorldSpaceRayFromMouse(e.x, e.y);
            let moveDist = calculateWorldDelta(e, m_activeAxis, m_ray_ws);
            if (!moveDist) {
                return;
            }

            if (m_activeAxis === 'x') m_currentEntity.translation[0] += moveDist;
            if (m_activeAxis === 'y') m_currentEntity.translation[1] += moveDist;
            if (m_activeAxis === 'z') m_currentEntity.translation[2] += moveDist;
            m_currentEntity.updateModelMatrix();
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

function getBestPlaneNormal(axis, rayDirection) {
    const normals = {
        x: [
            [0, 1, 0],
            [0, 0, 1]
        ],
        y: [
            [1, 0, 0],
            [0, 0, 1]
        ],
        z: [
            [1, 0, 0],
            [0, 1, 0]
        ]
    };

    const candidates = normals[axis];

    const dotA = Math.abs(glMatrix.vec3.dot(rayDirection, candidates[0]));
    const dotB = Math.abs(glMatrix.vec3.dot(rayDirection, candidates[1]));

    return dotA > dotB ? candidates[0] : candidates[1];
}

function intersectRayPlane(ray, planeNormal, planePoint) {
    const denom = glMatrix.vec3.dot(planeNormal, ray.direction);

    const EPSILON = 0.00001;
    if (Math.abs(denom) < EPSILON) return null;

    const diff = glMatrix.vec3.subtract(glMatrix.vec3.create(), planePoint, ray.origin);

    const t = glMatrix.vec3.dot(diff, planeNormal) / denom;

    if (t < 0) return null;

    return glMatrix.vec3.scaleAndAdd(glMatrix.vec3.create(), ray.origin, ray.direction, t);
}

function calculateWorldDelta(event, axis, ray) {
    const planeNormal = getBestPlaneNormal(axis, ray.direction);
    const modelMatrix = getModelMatrix(m_currentEntity.axisArrowsModelIdx);
    const planePoint = glMatrix.vec3.create();
    glMatrix.mat4.getTranslation(planePoint, modelMatrix);

    const currentHit = intersectRayPlane(ray, planeNormal, planePoint);

    let axisIndex = null;
    const axisBox = Object.keys(axesBoxes);
    for (let i = 0; i < axisBox.length; i++) {
        if (axisBox[i] === axis) axisIndex = i;
    }

    if (!m_lastHitPoint) {
        m_lastHitPoint = currentHit;
        return 0;
    }
 
    const delta = currentHit[axisIndex] - m_lastHitPoint[axisIndex];
    m_lastHitPoint = currentHit;

    return delta;
}

function findAxis(mouseRay, entity) {
    const gizmoMatrix_ws = glMatrix.mat4.fromTranslation(glMatrix.mat4.create(), entity.translation);
    const invGizmoMatrix_ws = glMatrix.mat4.invert(glMatrix.mat4.create(), gizmoMatrix_ws);
    console.log(entity.translation);
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
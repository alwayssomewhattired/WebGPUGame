
import * as glMatrix from 'gl-matrix'
import { getModelMatrix, getViewProjectionMatrix } from './matrix.js';
import { getScene } from "./fileParser.js"
import { createGPUBuffer, updateDynamicGPUBuffer } from './buffer.js';
import { getDevice } from './webgpu.js';
import { getWorldSpaceRayFromMouse, createRayVerticesGPUBuffer, getRayVerticesBuffer, getSelectedObject } from './ray.js';
import { keyboardInput } from './keyboardListeners.js';
import { axesBoxes, intersectAABB } from './aabb.js';

let m_activeAxis = null;
let m_aabbPositionsOffset;
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



//
//
// | ROTATION
//
//

const rotationAxes = {
    x: [1, 0, 0],
    y: [0, 1, 0],
    z: [0, 0, 1]
};

let m_angle = null;
const m_globalRotationArcVertices = [];
let m_globalRotationArcVerticesOffset = null;

export function createRotationArcVertices(
    radius = 1.0,
    segments = 64,
    startAngle = 0,
    endAngle = Math.PI * 4
) {
    let t = null;

    // curved arc
    for (let i = 0; i <= segments; i++) {
        t = i / segments;

        m_angle = startAngle + (endAngle - startAngle) * t;

        // x rotation
        // const x = 0;
        // const y = radius * Math.cos(angle);
        // const z = radius * Math.sin(angle);

        // y rotation
        const x = radius * Math.cos(m_angle);
        const y = 0;
        const z = radius * Math.sin(m_angle);
        const r = 0.0;
        const g = 1.0;
        const b = 0.0;

        // // z rotation
        // const x = radius * Math.cos(angle);
        // const y = radius * Math.sin(angle);
        // const z = 0;

        m_globalRotationArcVertices.push(x,y,z,r,g,b);
    }

    m_globalRotationArcVerticesOffset = m_globalRotationArcVertices.length;
    createRotationArcHeadVertices();

    return new Float32Array([m_globalRotationArcVertices]);
}

function createRotationArcHeadVertices(
    radius = 1.0,
    segments = 64,
    startAngle = 0,
    endAngle = Math.PI * 4
) {

    // x 
    // const tip = [0, radius * Math.cos(endAngle), radius * Math.sin(endAngle)];
    // tangent = [0, -Math.sin(angle), Math.cos(angle)];
    // const side = [-tangent[2], 0, tangent[0]];
    // const arrowSize = 0.08;
    // const left = [
    //     tip[0] - tangent[0] * arrowSize + side[0] * arrowSize,
    //     tip[1],
    //     tip[2] - tangent[2] * arrowSize + side[2] * arrowSize
    // ];
    // const right = [
    //     tip[0] - tangent[0] * arrowSize - side[0] * arrowSize,
    //     tip[1],
    //     tip[2] - tangent[2] * arrowSize - side[2] * arrowSize
    // ];

    // // y
    const tip = [radius * Math.cos(endAngle), 0, radius * Math.sin(endAngle)];
    const tangent = [-Math.sin(m_angle), 0, Math.cos(m_angle)];
    const side = [-tangent[2], 0, tangent[0]];
    const arrowSize = 0.08;
    const left = [
        tip[0] - tangent[0] * arrowSize + side[0] * arrowSize,
        tip[1],
        tip[2] - tangent[2] * arrowSize + side[2] * arrowSize
    ];
    const right = [
        tip[0] - tangent[0] * arrowSize - side[0] * arrowSize,
        tip[1],
        tip[2] - tangent[2] * arrowSize - side[2] * arrowSize
    ];
    const r = 0;
    const g = 1;
    const b = 0;

    // // z
    // const tip = [radius * Math.cos(endAngle), radius * Math.sin(endAngle), 0];
    // tangent = [-Math.sin(angle), Math.cos(angle), 0];


    m_globalRotationArcVertices.push([tip, side, left, right, r, g, b]);
}

export function getGlobalRotationArcVerticesOffset() {
    if (!m_globalRotationArcVerticesOffset) throw new Error("rotation arc vertex offset is null");

    return m_globalRotationArcVerticesOffset;
}

import * as glMatrix from 'gl-matrix'
import { getMatrix, getViewProjectionMatrix, updateMatrix } from './matrix.js';
import { getDevice } from '../Renderer/webgpu.js';
import { getWorldSpaceRayFromMouse, createRayVerticesGPUBuffer, getRayVerticesBuffer, getSelectedObject } from './ray.js';
import { keyboardInput } from '../keyboardListeners.js';
import { axesBoxes, intersectAABB } from './aabb.js';
import { findAxis } from './aabb.js';
import { getScene } from './scene.js';

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
        checkRotationRingHit();
    });

    canvas.addEventListener("mousemove", (e) => {
        if (m_activeAxis || m_isRingSelected) {
            m_ray_ws = getWorldSpaceRayFromMouse(e.x, e.y);
            let moveDist = calculateWorldDelta(e, m_activeAxis, m_ray_ws);
            if (!moveDist) {
                return;
            }
            for (const mesh of m_currentEntity.meshes) {
                console.log(mesh)
                let tempTranslation = mesh.getMeshTranslation();
                if (m_activeAxis === 'x' && !m_isRingSelected) tempTranslation[0] += moveDist;
                if (m_activeAxis === 'y' && !m_isRingSelected) tempTranslation[1] += moveDist;
                if (m_activeAxis === 'z' && !m_isRingSelected) tempTranslation[2] += moveDist;
                
                let tempRotation = mesh.getRotation();
                if (m_activeAxis === 'x' && m_isRingSelected) tempRotation[0] += moveDist;
                if (m_activeAxis === 'y' && m_isRingSelected) tempRotation[1] += moveDist;
                if (m_activeAxis === 'z' && m_isRingSelected) tempRotation[2] += moveDist;

                mesh.setTranslation(tempTranslation);
                mesh.setRotation(tempRotation);
                console.log(mesh)
                updateMatrix(mesh);

            }
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
    const denom = glMatrix.vec3.dot(ray.direction, planeNormal);
    const EPSILON = 0.00001;
    if (Math.abs(denom) < EPSILON) return null;
    
    const diff = glMatrix.vec3.subtract(glMatrix.vec3.create(), planePoint, ray.origin);
    
    const t = glMatrix.vec3.dot(diff, planeNormal) / denom;
    
    if (t < 0) return null;

    return glMatrix.vec3.scaleAndAdd(glMatrix.vec3.create(), ray.origin, ray.direction, t);
}

function calculateWorldDelta(event, axis, ray) {
    const planeNormal = getBestPlaneNormal(axis, ray.direction);
    let delta = null;
    let axisIndex = null;
    for (const mesh of m_currentEntity.meshes) {
        const modelMatrix = getMatrix(mesh.axisArrowsModelIdx);
        const planePoint = glMatrix.vec3.create();
        glMatrix.mat4.getTranslation(planePoint, modelMatrix);

        const currentHit = intersectRayPlane(ray, planeNormal, planePoint);

        const axisBox = Object.keys(axesBoxes);
        for (let i = 0; i < axisBox.length; i++) {
            if (axisBox[i] === axis) axisIndex = i;
        }

        if (!m_lastHitPoint) {
            m_lastHitPoint = currentHit;
            return 0;
        }
    
        const currentDelta = currentHit[axisIndex] - m_lastHitPoint[axisIndex]
        if (currentDelta) delta = currentHit[axisIndex] - m_lastHitPoint[axisIndex];
        m_lastHitPoint = currentHit;
    }
    return delta;
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

const RotationHandle = {
    radius: 1.0,
    thickness: 0.15
};

let m_angle = null;
const m_globalRotationArcVertices = [];
const m_globalRotationArcHeadVertices = [];
let m_globalRotationArcVerticesCount = null;
let m_globalRotationArcHeadVerticesCount = null;

export function createRotationArcVertices(
    radius = 1.0,
    segments = 64,
    startAngle = 0,
    endAngle = Math.PI / 2
) {
    let t = null;

    let x = null;
    let y = null;
    let z = null;
    let r = null;
    let g = null;
    let b = null;

    // curved arc
    for (let i = 0; i <= segments; i++) {

        t = i / segments;

        m_angle = startAngle + (endAngle - startAngle) * t;

        // x rotation
        x = 0;
        y = radius * Math.cos(m_angle);
        z = radius * Math.sin(m_angle);
        r = 1.0;
        g = 0.0;
        b = 0.0;
        m_globalRotationArcVertices.push(x,y,z,r,g,b);

    }

   for (let i = 0; i <= segments; i++) {

        t = i / segments;

        m_angle = startAngle + (endAngle - startAngle) * t;

        // y rotation
        x = radius * Math.cos(m_angle);
        y = 0;
        z = radius * Math.sin(m_angle);
        r = 0.0;
        g = 1.0;
        b = 0.0;
        m_globalRotationArcVertices.push(x,y,z,r,g,b);

    }

   for (let i = 0; i <= segments; i++) {

        t = i / segments;

        m_angle = startAngle + (endAngle - startAngle) * t;

        // // z rotation
        x = radius * Math.cos(m_angle);
        y = radius * Math.sin(m_angle);
        z = 0;
        r = 0.0;
        g = 0.0;
        b = 1.0;
        m_globalRotationArcVertices.push(x,y,z,r,g,b);

    }

    const vertexCoordsCount = 6 // xyzrgb
    m_globalRotationArcVerticesCount = m_globalRotationArcVertices.length / vertexCoordsCount;

    return new Float32Array(m_globalRotationArcVertices);
}

export function createRotationArcHeadVertices(
    radius = 1.0,
    segments = 64,
    startAngle = 0,
    endAngle = Math.PI / 2
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

    m_globalRotationArcHeadVertices.push(
        ...tip, r, g, b,
        ...side, r, g, b,
        ...left, r, g, b,
        ...right, r, g, b
    );
    const vertexCoordsCount = 6 // x,y,z,r,b,g
    m_globalRotationArcHeadVerticesCount = m_globalRotationArcHeadVertices.length / vertexCoordsCount;

    return new Float32Array(m_globalRotationArcHeadVertices);
}

let m_pastAngle = 0;
let m_isRingSelected = false;

export function checkRotationRingHit() {
    const modelMatrix = getMatrix(m_currentEntity.meshes[0].axisArrowsModelIdx);

    const planePoint = glMatrix.vec3.fromValues(
        modelMatrix[12],
        modelMatrix[13],
        modelMatrix[14]
    );

    for (const rotationAxis in rotationAxes) {
        const hitPosition = intersectRayPlane(m_ray_ws, rotationAxes[rotationAxis], planePoint);
        
        if (hitPosition == null) return;

        const hitDistance = glMatrix.vec3.create();
        glMatrix.vec3.subtract(hitDistance, hitPosition, planePoint);

        const hitDistanceLength = glMatrix.vec3.length(hitDistance);

        const innerRadius = RotationHandle.radius - RotationHandle.thickness;
        const outerRadius = RotationHandle.radius + RotationHandle.thickness;
        if (hitDistanceLength >= innerRadius && hitDistanceLength <= outerRadius) {
            m_isRingSelected = true;
            m_activeAxis = rotationAxis;
            return m_isRingSelected;
        } else {
             m_isRingSelected = false;
        }

    }

    return m_isRingSelected;

}

export function getGlobalRotationArcVerticesCount() {
    if (!m_globalRotationArcVerticesCount) throw new Error("rotation arc vertex count is null");

    return m_globalRotationArcVerticesCount;
}

export function getGlobalRotationArcHeadVerticesCount() {
    if (!m_globalRotationArcHeadVerticesCount) throw new Error("rotation arc head vertex count is null");

    return m_globalRotationArcHeadVerticesCount;
}
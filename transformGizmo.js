
import * as glMatrix from 'gl-matrix'
import { getViewProjectionMatrix } from './matrix.js';
import { getScene } from "./entity.js"
import { getInverseModelMatrix } from './matrix.js';

let m_activeAxis = null;

const axesBoxes = {
    x: {
        min: [0.0, -0.1, -0.1],
        max: [1.0, 0.1, 0.1]
    },
    y: {
        min: [-0.1, 0.0, -0.1],
        max: [0.1, 1.0, 0.1]
    },
    z: {
        min: [-0.1, -0.1, 0.0],
        max: [0.1, 0.1, 1.0]
    }
};

export function initTransformGizmo() {
    canvas.addEventListener("mousedown", ({x, y}) => {
        const ray_ws = getWorldSpaceRayFromMouse(x, y);
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

            currentEntity.updateModelMatrix();
        }
    })

    canvas.addEventListener("mouseup", (e) => {
        if (m_activeAxis) m_activeAxis = null;
    })
}

function getWorldSpaceRayFromMouse(mouseX, mouseY) {
    const x = (2.0 * mouseX) / canvas.width - 1.0;
    const y = 1.0 - (2.0 * mouseY) / canvas.height;

    const viewProj = getViewProjectionMatrix();

    const invViewProj = glMatrix.mat4.create();
    glMatrix.mat4.invert(invViewProj, viewProj);

    const nearPoint = glMatrix.vec4.fromValues(x, y, -1.0, 1.0);
    const farPoint = glMatrix.vec4.fromValues(x, y, 1.0, 1.0);

    // | Transforms both points to world space
    glMatrix.vec4.transformMat4(nearPoint, nearPoint, invViewProj);
    glMatrix.vec4.transformMat4(farPoint, farPoint, invViewProj);

    // | Perspective divide
    glMatrix.vec3.scale(nearPoint, nearPoint, 1.0 / nearPoint[3]);
    glMatrix.vec3.scale(farPoint, farPoint, 1.0 / farPoint[3]);

    const rayOrigin = glMatrix.vec3.fromValues(nearPoint[0], nearPoint[1], nearPoint[2]);
    const rayDir = glMatrix.vec3.create();
    glMatrix.vec3.subtract(rayDir, farPoint, nearPoint);
    glMatrix.vec3.normalize(rayDir, rayDir);
    
    return { origin: rayOrigin, direction: rayDir };

}

function getSelectedObject(worldSpaceRay, scene) {
    let closestDist = Infinity;
    let selected = null;
    const invModelMatrix = getInverseModelMatrix();

    for (const entity of scene) {
        const ray_ls = {
            origin: glMatrix.vec3.transformMat4(glMatrix.vec3.create(), worldSpaceRay.origin, invModelMatrix),
            direction: glMatrix.vec3.normalize(glMatrix.vec3.create(), 
            glMatrix.vec3.transformMat4(glMatrix.vec3.create(), worldSpaceRay.direction, invModelMatrix))
        };
        console.log("getSelectedObject");
        console.log(ray_ls);
        const distance = intersectAABB(ray_ls, entity.boundingBox);
        if (distance !== null && distance < closestDist) {
            closestDist = distance;
            selected = entity;
        }
    }
    return selected;
}

function intersectAABB(ray, box) {
    let tMin = -Infinity;
    let tMax = Infinity;

    for (let i = 0; i < 3; i++) {
        const invDir = 1.0 / ray.direction[i];
        console.log(invDir);
        let t1 = (box.min[i] - ray.origin[i]) * invDir;
        let t2 = (box.max[i] - ray.origin[i]) * invDir;

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

    console.log("findAxis");
    console.log(ray_ls);
    for (const axis in axesBoxes) {
        const box = axesBoxes[axis];
        console.log(box)
        const t = intersectAABB(ray_ls, box);
        if (t !== null && t < minT) {
            minT = t;
            closestAxis = axis;
        }
    }
    // - closest Axis is always null here
    return closestAxis;
}


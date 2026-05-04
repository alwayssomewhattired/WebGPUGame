
import * as glMatrix from 'gl-matrix'
import { getViewProjectionMatrix } from './matrix.js';

let m_activeAxis = null;

let ray = {
    origin: null,
    direction: null
};

export function initTransformGizmo() {
    canvas.addEventListener("mousedown", ({x, y}) => {
        ray = getRayFromMouse(x, y);
        m_activeAxis = intersectAABB(ray, currentGizmoPos);
    });

    canvas.addEventListener("mousemove", (e) => {
        if (activeAxis) {
            const moveDist = calculateWorldDelta(e, m_activeAxis);

            if (m_activeAxis === 'x') selectedObject.pos[0] += moveDist;
            if (m_activeAxis === 'y') selectedObject.pos[1] += moveDist;
            if (m_activeAxis === 'z') selectedObject.pos[2] += moveDist;

            updateModelMatrix(selectedObject);
        }
    })
}

function getRayFromMouse(mouseX, mouseY) {
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

function intersectAABB(ray, box) {
    let tMin = -Infinity;
    let tMax = Infinity;

    for (let i = 0; i < 3; i++) {
        const invDir = 1.0 / ray.direction[i];
        let t1 = (box.min[i] - ray.origin[i]) * invDir;
        let t2 = (box.max[i] - ray.origin[i]) * invDir;

        // | Makes sure t1 is entry and t2 is exit
        if (t1 > t2) [t1, t2] = [t2, t1];

        tMin = Math.max(tMin, t1);
        tMax = Math.min(tMax, t2);
    }

    // | if tMax < 0, the ray hit the box
    // | if tMin > tMax, the ray missed the box
    if (tMax < 0 || tMin > tMax) return null;

    // | returns distance to hit
    return tMin;
}
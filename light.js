
let m_sphereVertexCount = null;
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

            m_vertices.push(x * radius, y * radius, z * radius, r, g, b);
        }
    }
    m_sphereVertexCount = m_vertices.length;
    return new Float32Array(m_vertices);
}

export function getSphereVertexCount() {
    return m_sphereVertexCount;
}
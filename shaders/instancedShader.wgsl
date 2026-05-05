
@group(0) @binding(0)
var<uniform> modelMatrix: mat4x4<f32>;
@group(0) @binding(1)
var<uniform> viewMatrix: mat4x4<f32>;
@group(0) @binding(2)
var<uniform> projectionMatrix: mat4x4<f32>;

struct VertexOutput {
    @builtin(position) vPositions: vec4<f32>
}

@vertex
fn instancedVertexShader(
    @location(0) inPos: vec3<f32>
) -> VertexOutput {

    var out: VertexOutput;
    out.vPositions = projectionMatrix * viewMatrix * modelMatrix * vec4<f32>(inPos, 1.0);

    return out;
}

@fragment
fn instancedFragmentShader(in: VertexOutput) -> @location(0) vec4<f32> {

    return vec4<f32>(0.0, 0.0, 1.0, 1.0);
}
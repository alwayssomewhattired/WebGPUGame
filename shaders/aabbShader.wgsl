
@group(0) @binding(0) var<uniform> color: vec3<f32>;
@group(0) @binding(1)
var<uniform> modelMatrix: mat4x4<f32>;
@group(0) @binding(2)
var<uniform> viewMatrix: mat4x4<f32>;
@group(0) @binding(3)
var<uniform> projectionMatrix: mat4x4<f32>;

struct VertexOutput {
    @builtin(position) clip_position: vec4<f32>
};

@vertex
fn aabbVertexShader(@location(0) inPos: vec3<f32>) -> VertexOutput {
    var out: VertexOutput;
    out.clip_position = projectionMatrix * viewMatrix * modelMatrix * vec4<f32>(inPos, 1.0);
    return out;
}

@fragment
fn aabbFragShader() -> @location(0) vec4<f32> {
    return vec4<f32>(color, 1.0);
}
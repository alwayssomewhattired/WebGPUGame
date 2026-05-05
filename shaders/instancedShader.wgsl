
struct VertexOutput {
    @builtin(position) vPositions: vec4<f32>
}

@vertex
fn instancedVertexShader(
    @location(0) inPos: vec4<f32>
) -> VertexOutput {

    var out: VertexOutput;
    out.vPositions = inPos;

    return out;
}

@fragment
fn instancedFragmentShader(in: VertexOutput) -> @location(0) vec4<f32> {

    return vec4<f32>(0.0, 0.0, 1.0, 1.0);
}
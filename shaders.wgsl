
@group(0) @binding(0)
var<uniform> offset: vec3<f32>;

struct VertexOutput {
    @builtin(position) clip_position: vec4<f32>,
    @location(0) tex_coords: vec2<f32>,
};

@vertex
fn vs_main(
    @location(0) inPos: vec3<f32>,
    @location(1) inTexCoords: vec2<f32>,
) -> VertexOutput {
    var out: VertexOutput;
    out.clip_position = vec4<f32>(inPos + offset, 1.0);
    out.tex_coords = inTexCoords;
    return out;
}


@fragment
fn fs_main(in: VertexOutput) ->  @location(0) vec4<f32> {
    return vec4<f32>(in.color, 1.0);
        }
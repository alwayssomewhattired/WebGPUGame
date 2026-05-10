

@group(0) @binding(0)
var<uniform> model: mat4x4<f32>;
@group(0) @binding(1)
var<uniform> view: mat4x4<f32>;
@group(0) @binding(2)
var<uniform> projection: mat4x4<f32>;
@group(0) @binding(3)
var<uniform> normalTransform: mat4x4<f32>;
@group(0) @binding(4)
var t_diffuse: texture_2d<f32>;
@group(0) @binding(5)
var s_diffuse: sampler;
@group(0) @binding(6)
var<uniform> lightDirection: vec3<f32>;
@group(0) @binding(7)
var<uniform> viewDirection: vec3<f32>;

struct VertexOutput {
    @builtin(position) clip_position: vec4<f32>,
    @location(1) tex_coords: vec2<f32>,
    @location(2) surfaceNormal: vec3<f32>,
    @location(3) viewDir: vec3<f32>,
    @location(4) lightDir: vec3<f32>
};

fn specular(lightDir:vec3<f32>, viewDir:vec3<f32>, normal:vec3<f32>, specularColor:vec3<f32>, shininess:f32)
-> vec3<f32> {
    var reflectDir:vec3<f32> = reflect(-lightDir, normal);
    var specDot:f32 = max(dot(reflectDir, viewDir), 0.0);
    return pow(specDot, shininess) * specularColor;
}

fn diffuse(lightDir:vec3<f32>, normal:vec3<f32>, diffuseColor:vec3<f32>) -> vec3<f32> {
    return max(dot(lightDir, normal), 0.0) * diffuseColor;
}

// | Instanced data
// @location(5) var<location(5)> instanceMatrix: mat4x4<f32>;
// @location(6) var<location(6)> instanceColor: vec4<f32>;
// @location(7) aabb_center: vec3<f32>;
// @location(8) aabb_extents: vec3<f32>;
// @location(9) arrow_color: vec4<f32>;


// *** VERTEX ***
@vertex
fn vs_main(
    @location(0) inPos: vec3<f32>,
    @location(1) inTexCoords: vec2<f32>,
    @location(2) inNormal: vec3<f32>,
) -> VertexOutput {

    // | instanced data work-in-progress
    // out.clip_position = view * instanceMatrix * vec4<f32>(inPos, 1.0);
    // out.color = instanceColor;

    var surfaceNormal:vec3<f32> = normalize((normalTransform * vec4<f32>(inNormal,0.0)).xyz);
    var viewDir:vec3<f32> = normalize((normalTransform * vec4<f32>(-viewDirection, 0.0)).xyz);
    var lightDir:vec3<f32> = normalize((normalTransform * vec4<f32>(-lightDirection, 0.0)).xyz);

    var out: VertexOutput;
    out.clip_position = projection * view * model * vec4<f32>(inPos, 1.0);
    out.tex_coords = inTexCoords;
    out.surfaceNormal = surfaceNormal;
    out.viewDir = viewDir;
    out.lightDir = lightDir;
    return out;
}

const ambientColor:vec4<f32> = vec4<f32>(0.15, 0.0, 0.0, 1.0);
const diffuseColor:vec4<f32> = vec4<f32>(0.25, 0.25, 0.25, 1.0);
const specularColor:vec4<f32> = vec4<f32>(1.0, 1.0, 1.0, 1.0);
const shininess:f32 = 20.0;
const ambientConstant:f32 = 1.0;
const diffuseConstant:f32 = 1.0;
const specularConstant:f32 = 1.0;

@fragment
fn fs_main(in: VertexOutput, @builtin(front_facing) face: bool) ->  @location(0) vec4<f32> {

    var lightDir:vec3<f32> = in.lightDir;
    var surfaceNormal:vec3<f32> = normalize(in.surfaceNormal);
    var viewDir:vec3<f32> = in.viewDir;

    var radiance:vec3<f32> = ambientColor.rgb * ambientConstant + 
    diffuse(lightDir, surfaceNormal, diffuseColor.rgb) * diffuseConstant +
    specular(lightDir, viewDir, surfaceNormal, specularColor.rgb, shininess) * specularConstant;
    return vec4<f32>(radiance, 1.0);

    // *** FLAT COLOR ***
    // return vec4<f32>(0.0, 0.0, 1.0, 1.0);

    // *** NORMALS COLOR ***
    // if (face) {
    //     var normal:vec3<f32> = normalize(in.normal);
    //     return vec4<f32>(normal, 1.0);
    // } else {
    //     return vec4<f32>(0.0, 1.0, 0.0, 1.0);
    // }

    // *** TEXTURE COLOR ***
    // return textureSample(t_diffuse, s_diffuse, in.tex_coords);
        }
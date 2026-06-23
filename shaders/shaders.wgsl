

@group(0) @binding(0)
var<uniform> view: mat4x4<f32>;
@group(0) @binding(1)
var<uniform> projection: mat4x4<f32>;
@group(0) @binding(2)
var t_diffuse: texture_2d_array<f32>;
@group(0) @binding(3)
var s_diffuse: sampler;
@group(0) @binding(4)
var<uniform> lightDirection: vec3<f32>;
// @group(0) @binding(5)
// var<uniform> viewDirection: vec3<f32>;
@group(0) @binding(5)
var<uniform> cameraPos: vec3<f32>;

@group(1) @binding(0)
var<uniform> model: mat4x4<f32>;
@group(1) @binding(1)
var<uniform> normalTransform: mat4x4<f32>;
@group(1) @binding(2)
var<uniform> textureData: TextureData; 

struct TextureData {
    textureIdx: u32,
}

struct VertexOutput {
    @builtin(position) clip_position: vec4<f32>,
    @location(1) tex_coords: vec2<f32>,
    @location(2) surfaceNormal: vec3<f32>,
    @location(3) viewDir: vec3<f32>,
    @location(4) lightDir: vec3<f32>,
    @location(5) cameraPos: vec3<f32>
};


// *** VERTEX ***
@vertex
fn vs_main(
    @location(0) inPos: vec3<f32>,
    @location(1) inTexCoords: vec2<f32>,
    @location(2) inNormal: vec3<f32>,
) -> VertexOutput {

    var surfaceNormal:vec3<f32> = normalize((normalTransform * vec4<f32>(inNormal,0.0)).xyz);
    var viewDir:vec3<f32> = normalize((normalTransform * vec4<f32>(-viewDirection, 0.0)).xyz);
    var lightDir:vec3<f32> = normalize((normalTransform * vec4<f32>(-lightDirection, 0.0)).xyz);

    var out: VertexOutput;
    out.clip_position = projection * view * model * vec4<f32>(inPos, 1.0);
    out.tex_coords = inTexCoords;
    out.surfaceNormal = surfaceNormal;
    out.cameraPos = cameraPos;
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

fn specular(lightDir:vec3<f32>, viewDir:vec3<f32>, normal:vec3<f32>, specularColor:vec3<f32>, shininess:f32)
-> vec3<f32> {
    var reflectDir:vec3<f32> = reflect(-lightDir, normal);
    var specDot:f32 = max(dot(reflectDir, viewDir), 0.0);
    return pow(specDot, shininess) * specularColor;
}

fn diffuse(lightDir:vec3<f32>, normal:vec3<f32>, diffuseColor:vec3<f32>) -> vec3<f32> {
    return max(dot(lightDir, normal), 0.0) * diffuseColor;
}

@fragment
fn fs_main(in: VertexOutput, @builtin(front_facing) face: bool) ->  @location(0) vec4<f32> {

    var texColor:vec4<f32> = textureSample(t_diffuse, s_diffuse, in.tex_coords, textureData.textureIdx);

    // *** LIGHT COLOR ***
    var lightDir:vec3<f32> = in.lightDir;
    var surfaceNormal:vec3<f32> = normalize(in.surfaceNormal);
    var viewDir:vec3<f32> = in.viewDir;

    var radiance:vec3<f32> = ambientColor.rgb * ambientConstant + 
    diffuse(lightDir, surfaceNormal, diffuseColor.rgb) * diffuseConstant +
    specular(lightDir, viewDir, surfaceNormal, specularColor.rgb, shininess) * specularConstant;

    var finalColor:vec3<f32> = radiance * texColor.rgb;
    
    return vec4<f32>(finalColor, texColor.a);

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
    // return textureSample(t_diffuse, s_diffuse, in.tex_coords, textureData.textureIdx);
    // return textureSample(t_diffuse, s_diffuse, in.tex_coords, 1);

}
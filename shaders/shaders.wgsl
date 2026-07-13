

@group(0) @binding(0)
var<uniform> view: mat4x4<f32>;
@group(0) @binding(1)
var<uniform> projection: mat4x4<f32>;
@group(0) @binding(2)
var t_diffuse: texture_2d_array<f32>;
@group(0) @binding(3)
var s_diffuse: sampler;
@group(0) @binding(4)
var<uniform> lightDirectionData: LightDirectionData;
@group(0) @binding(5)
var<uniform> cameraPosition: vec3<f32>;
@group(0) @binding(6)
var<uniform> lightPositionData: LightPositionData; // frag
@group(0) @binding(7)
var <uniform> debugTogglesData: DebugTogglesData; // frag 

@group(1) @binding(0)
var<uniform> model: mat4x4<f32>;
@group(1) @binding(1)
var<uniform> normalTransform: mat4x4<f32>;
@group(1) @binding(2)
var<uniform> textureData: TextureData; 

struct TextureData {
    textureIdx: u32,
};

struct LightDirectionData {
    position: vec3<f32>,
    isToggled: u32
};

struct LightPositionData {
    position: vec3<f32>,
    isToggled: u32
};

struct DebugTogglesData {
    normalsColorToggle: u32,
    regularColorToggle: u32
}


struct VertexOutput {
    @builtin(position) clip_position: vec4<f32>,
    @location(1) tex_coords: vec2<f32>,
    @location(2) surfaceNormal: vec3<f32>,
    @location(3) viewDir: vec3<f32>,
    @location(4) lightDirPosition: vec3<f32>,
    @location(5) cameraPos: vec3<f32>,
    @location(6) worldPos: vec3<f32>,
    @location(7) @interpolate(flat) lightDirToggled: u32
};


// *** VERTEX ***
@vertex
fn vs_main(
    @location(0) inPos: vec3<f32>,
    @location(1) inTexCoords: vec2<f32>,
    @location(2) inNormal: vec3<f32>
) -> VertexOutput {

    var surfaceNormal:vec3<f32> = normalize((normalTransform * vec4<f32>(inNormal,0.0)).xyz);
    // var viewDir:vec3<f32> = normalize((normalTransform * vec4<f32>(-viewDirection, 0.0)).xyz);
    // var lightDir:vec3<f32> = normalize((normalTransform * vec4<f32>(-lightDirection, 0.0)).xyz);
    var lightDirPosition:vec3<f32> = normalize(-lightDirectionData.position);
    var lightDirToggled:u32 = lightDirectionData.isToggled;

    var out: VertexOutput;
    out.clip_position = projection * view * model * vec4<f32>(inPos, 1.0);
    out.worldPos = (model * vec4<f32>(inPos, 1.0)).xyz;
    out.tex_coords = inTexCoords;
    out.surfaceNormal = surfaceNormal;
    out.cameraPos = cameraPosition;
    out.lightDirPosition = lightDirPosition;
    out.lightDirToggled = lightDirToggled;
    return out;
}

const ambientColor:vec4<f32> = vec4<f32>(0.15, 0.0, 0.0, 1.0);
const diffuseColor:vec4<f32> = vec4<f32>(0.25, 0.25, 0.25, 1.0);
const specularColor:vec4<f32> = vec4<f32>(1.0, 1.0, 1.0, 1.0);
const shininess:f32 = 1.0;
const ambientConstant:f32 = 1.0;
const diffuseConstant:f32 = 1.0;
const specularConstant:f32 = 1.0;
const specularIntensity:f32 = 2.0;

fn specular(lightDir:vec3<f32>, viewDir:vec3<f32>, normal:vec3<f32>, specularColor:vec3<f32>, shininess:f32)
-> vec3<f32> {
    var reflectDir:vec3<f32> = reflect(-lightDir, normal);
    var specDot:f32 = max(dot(reflectDir, viewDir), 0.0);
    var spec = pow(specDot, shininess);
    spec *= specularIntensity;
    return spec * specularColor;
}

fn diffuse(lightDir:vec3<f32>, normal:vec3<f32>, diffuseColor:vec3<f32>) -> vec3<f32> {
    return max(dot(lightDir, normal), 0.0) * diffuseColor;
}

@fragment
fn fs_main(in: VertexOutput, @builtin(front_facing) face: bool) ->  @location(0) vec4<f32> {

    var texColor:vec4<f32> = textureSample(t_diffuse, s_diffuse, in.tex_coords, textureData.textureIdx);
    // var normal:vec3<f32> = normalize(in.surfaceNormal);     
    // return vec4<f32>(normal, 1.0);

    if (debugTogglesData.normalsColorToggle > 0) {
        // *** NORMALS COLOR ***
        var normal:vec3<f32> = normalize(in.surfaceNormal);
        return vec4<f32>(normal, 1.0);
    }

    
    if (debugTogglesData.regularColorToggle > 0) {
        // *** TEXTURE COLOR ***
        return texColor;
    }

    // *** LIGHT COLOR ***
    var lightDir:vec3<f32> = in.lightDirPosition;
    var surfaceNormal:vec3<f32> = normalize(in.surfaceNormal);
    var worldPos:vec3<f32> = in.worldPos;
    var cameraPos:vec3<f32> = in.cameraPos;
    var viewDir:vec3<f32> = normalize(cameraPos - worldPos);

    var directionLightRadiance:vec3<f32> = vec3<f32>(0.0,0.0,0.0);
    if (in.lightDirToggled > 0) {

        directionLightRadiance = ambientColor.rgb * ambientConstant + 
        diffuse(lightDir, surfaceNormal, diffuseColor.rgb) * diffuseConstant +
        specular(lightDir, viewDir, surfaceNormal, specularColor.rgb, shininess) * specularConstant;
    }

    var pointLightRadiance:vec3<f32> = vec3<f32>(0.0,0.0,0.0);
    if (lightPositionData.isToggled > 0) {
        var lightPosition = lightPositionData.position;
        pointLightRadiance = ambientColor.rgb * ambientConstant + 
        diffuse(lightPosition, surfaceNormal, diffuseColor.rgb) * diffuseConstant +
        specular(lightPosition, viewDir, surfaceNormal, specularColor.rgb, shininess) * specularConstant;
    }

    var finalColor:vec3<f32> = (directionLightRadiance + pointLightRadiance) * texColor.rgb;
    return vec4<f32>(finalColor, texColor.a);

}
import { updateVertexBuffer } from "../SceneLogic/Buffers/vertexBuffer.js";
import { createMesh } from "../SceneLogic/mesh.js";
import { Primitive } from "../SceneLogic/primitive.js";
import { getDevice } from "../Renderer/webgpu.js";
import { debugVertexParse } from "./fileParser.js";


const m_vertexMap = new Map();
let m_debugVertexCount = 0;

// return an array of models
export async function parseOBJ(path) {
    const text = await (await fetch(path)).text();
    const lines = text.split(/\r?\n/);

    // replace all this shit with only primitive stuff. 
    // upload to global buffers and just keep indices

    const globalizedPrimitiveIndicesAOS = [];

    const entityPositions = [];
    const entityTexcoords = [];
    const entityNormals = [];
    
    const aabbMin = Array(3).fill(null);
    const aabbMax = Array(3).fill(null);

    const meshes = [];
    const meshesAOS = [];
    const meshPositions = [];
    const meshTexcoords = [];
    const meshNormals = [];
    const meshVertices = [];
    const meshIndices = [];
    let meshPrimitives = [];

    let modelName = null;
    let mtlName = null;
    let materialName = null;
    let meshName = null;

    let primitivePositions = [];
    let primitiveTexcoords = [];
    let primitiveNormals = [];
    let primitiveVertices = [];
    const primitiveIndices = [];
    const entityMaterials = [];


    const entityVertices = [];

    let primitiveStruct = {
        positions: null,
        texCoords: null,
        normals: null,
        indices: null,
        materialIdx: null,
        indicesCount: null
    };
    
    let primitiveIndicesStruct = {
        positions: [],
        texCoords: [],
        normals: [],
        indices: [],
        indicesCount: null,
        materialIdx: null,
        indexTypeSizeBytes: null,
        idxType: null,
        debugVertices: [],
        verticesSize: 0,
        vertexOffset: 0,
        indexOffset: 0
    };

    for (const line of lines) {
        const parts = line.trim().split(/\s+/);

        switch (parts[0]) {

            case "mtllib":
                mtlName = parts[1];
                const modifiedPath = path.substring(0, path.lastIndexOf("/"));
                const materialPath = modifiedPath + '/' + mtlName;
                const mtlResponse = await fetch(materialPath);
                const mtlText     = await mtlResponse.text();
                entityMaterials.push(parseMTL(mtlText, materialPath));
                break;

            // new primitive
            case "usemtl": 
                materialName = parts[1];
                
                globalizedPrimitiveIndicesAOS.push(primitiveIndicesStruct);
                meshPrimitives.push(primitiveIndicesStruct);

                primitiveIndicesStruct = {
                    positions: [],
                    texCoords: [],
                    normals: [],
                    indices: [],
                    indicesCount: null,
                    materialIdx: null,
                    indexTypeSizeBytes: null,
                    idxType: null,
                    debugVertices: [],
                    verticesSize: 0,
                    vertexOffset: 0,
                    indexOffset: 0
                };


                primitivePositions = []
                primitiveTexcoords = []
                primitiveNormals = [];
                primitiveVertices = [];
                break;

                // const materialPath = path + materialName;
                // console.log(materialPath);

            // "o" | start of new object
            case "o": 
                if (meshVertices.length > 0) {
                    meshesAOS.push({
                        meshPositions,
                        meshTexcoords,
                        meshNormals,
                        meshVertices,
                        meshName,
                        meshPrimitives
                    });
                    meshPositions = [];
                    meshTexcoords = [];
                    meshNormals = [];
                    meshVertices = [];
                    meshName = null;
                    meshPrimitives = [];


                    primitivePositions = [];
                    primitiveTexcoords = [];
                    primitiveNormals = [];
                    primitiveVertices = [];

                }
                meshName = parts[1];
                break;

            // "g" | start of new group
            case "g":
                console.log("its a g thang")
                if (meshVertices.length > 0) {
                    meshesAOS.push({
                        meshPositions,
                        meshTexcoords,
                        meshNormals,
                        meshVertices,
                        meshName,
                        meshPrimitives
                    });
                    meshPositions = [];
                    meshTexcoords = [];
                    meshNormals = [];
                    meshVertices = [];
                    meshName = null;
                    meshPrimitives = [];


                    primitivePositions = [];
                    primitiveTexcoords = [];
                    primitiveNormals = [];
                    primitiveVertices = [];

                }
                meshName = parts[1];
                break;

            case "v":
                meshPositions.push(
                    parseFloat(parts[1]),
                    parseFloat(parts[2]),
                    parseFloat(parts[3])
                );
                primitivePositions.push(
                    parseFloat(parts[1]),
                    parseFloat(parts[2]),
                    parseFloat(parts[3])
                );
                break;

            case "vt": 
                meshTexcoords.push(
                    parseFloat(parts[1]),
                    parseFloat(parts[2])
                );
                primitiveTexcoords.push(
                    parseFloat(parts[1]),
                    parseFloat(parts[2])
                );
                break;

            case "vn":
                meshNormals.push(
                    parseFloat(parts[1]),
                    parseFloat(parts[2]),
                    parseFloat(parts[3])
                );
                primitiveNormals.push(
                    parseFloat(parts[1]),
                    parseFloat(parts[2]),
                    parseFloat(parts[3])
                );
                break;

            case "f":
                parseOBJFace(parts, meshVertices, meshPositions, meshNormals, meshTexcoords, primitiveIndicesStruct,
                    primitivePositions, primitiveTexcoords, primitiveNormals, meshIndices, aabbMin, aabbMax
                );

                break;

            }
        }

        // | this catches the last object
    meshesAOS.push({
        meshPositions,
        meshTexcoords,
        meshNormals,
        meshVertices,
        meshName,
        meshPrimitives
    });

    for (const mesh of meshesAOS) {
        const meshVertexFloatsLength = 0;
        meshes.push(createMesh(null, getDevice(), globalizedPrimitiveIndicesAOS, meshVertexFloatsLength, 
        meshIndices.length, aabbMin, aabbMax, m_debugVertexCount, "name is broken fix it fuck you"));
    }

    // models.push({
    //     positions: modelPositions,
    //     texcoords: modelTexcoords,
    //     normals: modelNormals,
    //     vertices: modelVertices,
    //     modelName: modelName
    // });

    console.log(meshVertices);
    console.log(meshesAOS)
    console.log(meshes);
    const returnObject = {
        meshes: meshes,
        materials: entityMaterials
    }
    return returnObject;
}

function parseOBJFace(fileParts, meshVertices, meshPositions, meshNormals, meshTexcoords, primitiveIndicesStruct,
    primitivePositions, primitiveTexcoords, primitiveNormals, meshIndices, aabbMin, aabbMax
) {
    let positionIndex = null;
    let texcoordsIndex = null;
    let normalIndex = null;
    for (let i=1; i<fileParts.length; i++) {
        const face = fileParts[i];
        if (!m_vertexMap.has(face)) {
            const faceIndices = face.split("/");
            if (faceIndices.length > 3) {
                const verts = fanTriangulation(faceIndices);
                for (let i=0; i<verts.length; i+=3) {
                    positionIndex = verts[i];
                    texcoordsIndex = verts[i+1];
                    normalIndex = verts[i+2];   
                    meshVertices.push(
                        meshPositions[positionIndex * 3],
                        meshPositions[positionIndex * 3 + 1],
                        meshPositions[positionIndex * 3 + 2],   
                        meshTexcoords[texcoordsIndex * 3],
                        meshTexcoords[texcoordsIndex * 3 + 1],  
                        meshNormals[normalIndex * 3],
                        meshNormals[normalIndex * 3 + 1],
                        meshNormals[normalIndex * 3 + 2]
                    );

                    primitiveIndicesStruct.positions.push(updateVertexBuffer(primitivePositions[positionIndex * 3]));
                    primitiveIndicesStruct.positions.push(updateVertexBuffer(primitivePositions[positionIndex * 3 + 1]));
                    primitiveIndicesStruct.positions.push(updateVertexBuffer(primitivePositions[positionIndex * 3 + 2]));   
                    primitiveIndicesStruct.texCoords.push(updateVertexBuffer(primitiveTexcoords[texcoordsIndex * 3]));
                    primitiveIndicesStruct.texCoords.push(updateVertexBuffer(primitiveTexcoords[texcoordsIndex * 3 + 1]));  
                    primitiveIndicesStruct.normals.push(updateVertexBuffer(primitiveNormals[normalIndex * 3]));
                    primitiveIndicesStruct.normals.push(updateVertexBuffer(primitiveNormals[normalIndex * 3 + 1]));
                    primitiveIndicesStruct.normals.push(updateVertexBuffer(primitiveNormals[normalIndex * 3 + 2])); 
                    const faceString =        positionIndex + "/"
                                            + texcoordsIndex + "/" 
                                            + normalIndex 
                    m_vertexMap.set(faceString, m_vertexMap.size);  
                }
            } else {
                const [p, t, n] = face.split("/").map(Number);
                positionIndex = p - 1;
                texcoordsIndex = t - 1;
                normalIndex = n - 1;    

                meshVertices.push(
                    meshPositions[positionIndex * 3],
                    meshPositions[positionIndex * 3 + 1],
                    meshPositions[positionIndex * 3 + 2],   
                    meshTexcoords[texcoordsIndex * 3],
                    meshTexcoords[texcoordsIndex * 3 + 1],  
                    meshNormals[normalIndex * 3],
                    meshNormals[normalIndex * 3 + 1],
                    meshNormals[normalIndex * 3 + 2]
                );  
                primitiveIndicesStruct.positions.push(updateVertexBuffer(primitivePositions[positionIndex * 3]));
                primitiveIndicesStruct.positions.push(updateVertexBuffer(primitivePositions[positionIndex * 3 + 1]));
                primitiveIndicesStruct.positions.push(updateVertexBuffer(primitivePositions[positionIndex * 3 + 2]));   
                primitiveIndicesStruct.texCoords.push(updateVertexBuffer(primitiveTexcoords[texcoordsIndex * 3]));
                primitiveIndicesStruct.texCoords.push(updateVertexBuffer(primitiveTexcoords[texcoordsIndex * 3 + 1]));  
                primitiveIndicesStruct.normals.push(updateVertexBuffer(primitiveNormals[normalIndex * 3]));
                primitiveIndicesStruct.normals.push(updateVertexBuffer(primitiveNormals[normalIndex * 3 + 1]));
                primitiveIndicesStruct.normals.push(updateVertexBuffer(primitiveNormals[normalIndex * 3 + 2]));
            
                m_vertexMap.set(face, m_vertexMap.size);
            }   
        }
        const index = m_vertexMap.get(face);
        meshIndices.push(index);
        primitiveIndicesStruct.indices.push(index);

        debugVertexParse(null, primitiveIndicesStruct, aabbMin, aabbMax, 2.0, primitivePositions, primitiveTexcoords,
            primitiveNormals
        )
    }
}


function parseMTL(mtlText, path) {

    // name to path
    const materials = new Map();

    const lines = mtlText.split('\n');

    let currentMaterialName = null;

    for (const rawLine of lines) {
        const line = rawLine.trim();

        if (line.length === 0 || line.startsWith('#')) continue;

        const parts = line.split(/\s+/);

        const keyword = parts[0];

        switch (keyword) {

            case 'newmtl': {
                const materialName = parts[1];

                currentMaterialName = materialName,

                    materials.set(
                        materialName,
                        null
                    );

                break;
            }

            case 'map_Kd': {
                if (!currentMaterialName) break;
                materials.set(currentMaterialName, 'models/' + parts[1]);
                break;
            }
        }
    }

    return materials;
}
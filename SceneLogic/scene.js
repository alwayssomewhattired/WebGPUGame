import { updateEntities } from "./entity.js";

export function createEntitySceneLogic() {
    updateEntities();   

}

const scene = [];
const sceneMap = new Map();

export function getScene() {
    if (scene.length > 0) {
        return scene;
    } else {
        throw new Error("Scene is empty!!!");
    }
}

export function getEntity(name) {

    const index = sceneMap.get(name);
    const entity = scene[index];
    if (entity) {
        return entity;
    } else {
        console.log("Entity not found in scene!!!!!");
        return null;
    }
}

export function addToScene(entity) {
    sceneMap.set(entity.name, scene.length);
    scene.push(entity);
}
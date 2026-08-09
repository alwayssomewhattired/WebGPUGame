import { updateEntities } from "./entity.js";

export function createEntitySceneLogic() {
    updateEntities();   

}

const scene = [];

export function getScene() {
    if (scene.length > 0) {
        return scene;
    } else {
        throw new Error("Scene is empty!!!");
    }
}
import {SceneObject} from './scene-object'
import { Camera } from './camera';
import {MeshObject} from './mesh-object'

// Scene essentially a tree of SceneObjects
export class Scene {
    camera: Camera;
    private sceneObjects: SceneObject[];
    private meshObjects: MeshObject[];

    constructor(camera: Camera) {
        this.camera = camera;
        this.sceneObjects = [camera];
    }

    getCamera() {
        return this.camera;
    }

    getSceneObjects() {
        return this.sceneObjects;
    }

    getMeshObjects() {
        return this.meshObjects;
    }

    addSceneObject(sceneObject: SceneObject) {
        this.sceneObjects.push(sceneObject);

        if (sceneObject instanceof MeshObject) {
            this.meshObjects.push(sceneObject);
        }
    }

    // TODO: Allow removing objects from scene
}
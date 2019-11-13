import {SceneObject} from './scene-object'

// Scene essentially a tree of SceneObjects
export class Scene {
    public rootObjects: SceneObject[];

    constructor() {
        this.rootObjects = [];
    }
}
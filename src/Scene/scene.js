class Scene {
    constructor(camera) {
        this.camera = camera;
        this.sceneObjects = [camera];
        this.meshObjects = [];
    }

    addSceneObject(sceneObject) {
        this.sceneObjects.push(sceneObject);

        if (sceneObject instanceof MeshObject) {
            this.meshObjects.push(sceneObject);
        }
    }

    // TODO: Allow removing scene object
}
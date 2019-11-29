class Scene {
    constructor(camera) {
        this.camera = camera;
        this.sceneObjects = [];
        this.meshObjects = [];
        this.images = [];
    }

    addSceneObject(sceneObject) {
        this.sceneObjects.push(sceneObject);

        if (sceneObject instanceof MeshObject) {
            sceneObject.material.textureIdx = this.meshObjects.length;
            
            this.meshObjects.push(sceneObject);
        }
    }

    // TODO: This is kind of slow with a lot of scene objects, linked list would be better
    removeSceneObject(sceneObject) {
        let idx = this.sceneObjects.indexOf(sceneObject);

        if (idx > -1) {
            this.sceneObjects.splice(idx, 1);
        }

        if (sceneObject instanceof MeshObject) {
            let meshIdx = this.meshObjects.indexOf(sceneObject);

            if (meshIdx > -1) {
                this.meshObjects.splice(meshIdx, 1);
            }
        }
    }

    removeAllSceneObjects() {
        this.sceneObjects = [];
        this.meshObjects = [];
    }
}
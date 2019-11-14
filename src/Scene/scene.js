var mesh_object_1 = require('./mesh-object');
// Scene essentially a tree of SceneObjects
var Scene = (function () {
    function Scene(camera) {
        this.camera = camera;
        this.sceneObjects = [camera];
    }
    Scene.prototype.getCamera = function () {
        return this.camera;
    };
    Scene.prototype.getSceneObjects = function () {
        return this.sceneObjects;
    };
    Scene.prototype.getMeshObjects = function () {
        return this.meshObjects;
    };
    Scene.prototype.addSceneObject = function (sceneObject) {
        this.sceneObjects.push(sceneObject);
        if (sceneObject instanceof mesh_object_1.MeshObject) {
            this.meshObjects.push(sceneObject);
        }
    };
    return Scene;
})();
exports.Scene = Scene;

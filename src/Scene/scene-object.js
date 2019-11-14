var SceneObject = (function () {
    // TODO: Allow children of SceneObjects
    function SceneObject(name, transform) {
        this.name = name;
        this.transform = transform;
    }
    return SceneObject;
})();
exports.SceneObject = SceneObject;

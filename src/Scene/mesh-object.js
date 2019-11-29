class MeshObject extends SceneObject {
    constructor(name, transform, geometry, material) {
        super(name, transform);
        this.geometry = geometry;
        this.material = material;
    }
}
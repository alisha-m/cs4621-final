import {Geometry} from './geometry'
import {Material} from './material'
import {SceneObject} from './scene-object'
import {Transform} from './transform'

export class MeshObject extends SceneObject{
    public geometry: Geometry;
    public material: Material;

    constructor(name: string, transform: Transform, geometry: Geometry, material: Material) {
        super(name, transform);

        this.geometry = geometry;
        this.material = material;
    }
}
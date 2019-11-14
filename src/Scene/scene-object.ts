import {Geometry} from './geometry'
import {Material} from './material'
import {Transform} from './transform'

export class SceneObject {
    //TODO: Probably wanna add like unique id to each object in the future, probably not essential though.
    public name: string;

    public transform: Transform;

    // TODO: Allow children of SceneObjects

    constructor(name: string, transform: Transform) {
        this.name = name;
        this.transform = transform;
    }
}
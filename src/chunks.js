class Chunk {
    constructor(surface,objects,islands){
        this.surface = surface;
        this.objects = objects;
        this.islands = islands;
    }
}

const INTERVAL_WIDTH = 5;
const MUSH_THRESHOLD = 0.75;

function makeObjects(width, center, geometry, shader) {
    numIntervals = Math.floor(width / INTERVAL_WIDTH);
    objects = [];

    for(let i = 0; i < numIntervals; i++){
        for(let j = 0; j < numIntervals; j++){
            let x = center - (width / 2) + INTERVAL_WIDTH * i;
            let y = center - (width / 2) + INTERVAL_WIDTH * j;
            if(noise.simplex2(x, y) > MUSH_THRESHOLD) {
                objects.push(makeMesh(
                    "mushroom",
                    vec3.fromValues(x, y, getHeight(x, y) + 2.0),
                    vec3.fromValues(Math.PI / 2, 0, 0),
                    1.0,
                    geometry,
                    shader,
                    vec3.fromValues(0.4, 0.6, 0.02))
                )
            }
        }
    }
    
    return objects;

}
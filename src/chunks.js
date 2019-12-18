class Chunk {
    constructor(surface,objects,islands){
        this.surface = surface;
        this.objects = objects;
        this.islands = islands;
    }
}

const NUM_INTERVALS = 10;
const MUSH_THRESHOLD = 0.5;

function makeObjects(width, center, geometry, shader) {
    intervalWidth = Math.floor(width / NUM_INTERVALS);
    objects = [];

    console.log("width: " + width, "center: " + center);

    for(let i = 0; i < NUM_INTERVALS; i++) {
        for(let j = 0; j < NUM_INTERVALS; j++) {
            let x = center[0] - (width / 2) + intervalWidth * i;
            let y = center[1] - (width / 2) + intervalWidth * j;
            let n = noise.simplex2(x, y);
            if(n > MUSH_THRESHOLD && getHeight(x, y) > 0.0) {
                let scale = n - MUSH_THRESHOLD * 0.75 + 0.25;

                console.log(x, y);
                objects.push(makeMesh(
                    "mushroom",
                    vec3.fromValues(x, y, getHeight(x, y) + scale),
                    vec3.fromValues(Math.PI / 2, 0, 0),
                    scale,
                    geometry,
                    shader,
                    vec3.fromValues(0.4, 0.6, 0.02))
                )
            }
        }
    }
    
    return objects;

}
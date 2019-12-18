class Chunk {
    constructor(surface,objects,islands){
        this.surface = surface;
        this.objects = objects;
        this.islands = islands;
    }
}

const NUM_MUSHROOMS = 25;
const INTERVAL_WIDTH = 1;
const MUSH_THRESHOLD = 0.5;

/*
function makeObjects(width, center) {
    numIntervals = Math.floor(width / INTERVAL_WIDTH);
    objects = [];

    for(let i = 0;i<numIntervals;i++){
        for(let j = 0;j<numIntervals;j++){
            if(Noise.simplex2(center-width/2+INTERVAL_WIDTH*i,center-width/2+INTERVAL_WIDTH*j) > MUSH_THRESHOLD) {
                objects.push()
            }
        }
    }
    

}   */
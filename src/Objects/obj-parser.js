function loadGeom(filename) {
    $.ajax({
      url: filename,
      dataType: 'text'
    }).done(function(data) {
       makeGeom(data);
    }).fail(function() {
      alert('Failed to retrieve [' + filename + "]");
    });
}

function makeGeom(string) {

    var geom = new Geometry();
    var vertices = [];
    var normals = [];
    var uvs = [];

    var lines = string.split('\n');
    for(var i = 0; i < lines.length; i++) {
        var line = lines[i].trim().split(' ').filter(v=>v!='');

        if (line.length < 3) continue;

        var val1 = parseFloat(line[1]);
        var val2 = parseFloat(line[2]);
        var val3 = 0;

        if (line.length > 3) val3 = parseFloat(line[3]);

        if (line[0] == 'v') vertices.push(vec3.fromValues(val1, val2, val3));
        else if (line[0] == 'vn') normals.push(vec3.fromValues(val1, val2, val3)); 
        else if (line[0] == 'vt') uvs.push(vec2.fromValues(val1, val2));
        else if (line[0] == 'f') {
            
            var f1 = line[1].split('/');
            var f2 = line[2].split('/');
            var f3 = line[3].split('/');

            geom.vertices.push(vertices[parseInt(f1[0]) - 1]);
            geom.normals.push(normals[parseInt(f1[2]) - 1]);

            geom.vertices.push(vertices[parseInt(f2[0]) - 1]);
            geom.normals.push(normals[parseInt(f2[2]) - 1]);

            geom.vertices.push(vertices[parseInt(f3[0]) - 1]);
            geom.normals.push(normals[parseInt(f3[2]) - 1]);

            if(f1[1] != '' && f2[1] != '' && f3[1] != '') {
                geom.uvs.push(uvs[parseInt(f1[1]) - 1]);
                geom.uvs.push(uvs[parseInt(f2[1]) - 1]);
                geom.uvs.push(uvs[parseInt(f3[1]) - 1]);
            }

            var index1 = geom.vertices.length-3;
            var index2 = geom.vertices.length-2;
            var index3 = geom.vertices.length-1;

            geom.faces.push(new Face(index1, index2, index3));
        }
    }

    return geom;
}

function makeMesh(name, position, rotation, size, geom, shader, color) {
    
    // Create a material 
    var material = new Material(shader);
    material.setColor(color);

    // Create a transform
    var transform = new Transform(position, rotation, vec3.fromValues(size, size, size));

    // Create the mesh object
    var mesh = new MeshObject(name, transform, geom, material);
    
    return mesh;
}
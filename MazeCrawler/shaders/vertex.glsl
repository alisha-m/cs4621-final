attribute vec3 vert_position;
attribute vec2 vert_texCoord;

// transformation matrices
uniform mat4 modelViewProjection;

varying vec2 geom_texCoord;

void main() {
    // mat4 modelViewProjection;
    // vec4 col1 = vec4(1.8106601238250732, 0.0, 0.0, 0.0);
    // vec4 col2 = vec4(0.0, 2.4142136573791504, 0.0, 0.0);
    // vec4 col3 = vec4(0.0, 0.0, -1.0000003576278687, -0.020000003278255463);
    // vec4 col4 = vec4(0.0, 0.0, -1.0, 0.0);
    // modelViewProjection[0] = col1;
    // modelViewProjection[1] = col2;
    // modelViewProjection[2] = col3;
    // modelViewProjection[3] = col4;

    gl_Position = modelViewProjection * vec4(vert_position, 1.0);

    geom_texCoord = vert_texCoord;
}
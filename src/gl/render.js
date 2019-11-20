var canvas = document.getElementById("webglCanvas");

var xAxis = vec3.create(1, 0, 0);
var yAxis = vec3.create(0, 1, 0);
var zAxis = vec3.create(0, 0, 1);

class Renderer {
    constructor(imageSources) {
        this.imageSources = imageSources;
        this.sceneTextures = [];

        this.loadImages();
        this.setupTextures();
    }

    intializeWebGL() {
        var gl = null;
        try {
            gl = canvas[0].getContext("experimental-webgl");
            if (!gl) {
                gl = canvas[0].getContext("webgl");
            }
        } catch(error) {
            // NO-OP
        }
        if(!gl) {
            alert("Could not get WebGL context!");
            throw new Error("Could not get WebGL context!");
        }

        return gl;
    }

    createShader(gl, shaderScriptId) {
        var shaderScript = $("#" + shaderScriptId);
        var shaderSource = shaderScript[0].text;
        var shaderType = null;

        if (shaderScript[0].type == "x-shader/x-vertex") {
            shaderType = gl.VERTEX_SHADER;
        } else if (shaderScript[0].type == "x-shader/x-fragment") {
            shaderType = gl.FRAGMENT_SHADER;
        } else {
            throw new Error("Invalid shader type: " + shaderScript[0].type);
        }

        var shader = gl.createShader(shaderType);
        gl.shaderSource(shader, shaderSource);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            var infoLog = gl.getShaderInfoLog(shader);
            gl.deleteShader(shader);
            throw new Error("An error occured compiling the shader: " + infoLog);
        } else {
            return shader;
        }
    }

    createGlslProgram(gl, vertexShaderId, fragmentShaderId) {
        var program = gl.createProgram();

        gl.attachShader(program, createShader(gl, vertexShaderId));
        gl.attachShader(program, createShader(fragmentShaderId));
    }

    isPowerOfTwo(val) {
        return (val & (val - 1)) == 0;
    }

    loadTexture(gl, image, activeTexture) {
        // Create the texture.
        // Step 1: Create the texture object and bind it to the given active texture
        gl.activeTexture(activeTexture);

        var texture = gl.createTexture();
        // Step 2: Bind the texture object to the "target" TEXTURE_2D
        gl.bindTexture(gl.TEXTURE_2D, texture);
        // Step 3: (Optional) Tell WebGL that pixels are flipped vertically,
        //         so that we don't have to deal with flipping the y-coordinate.
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        // Step 4: Download the image data to the GPU.
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        // Step 5: Creating a mipmap so that the texture can be anti-aliased.
        if(isPowerOfTwo(image.width) && isPowerOfTwo(image.height)) {
            gl.generateMipmap(gl.TEXTURE_2D);
        }
        else {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        }
        gl.bindTexture(gl.TEXTURE_2D, null);

        return texture;
    }

    createShape(gl, geometry) {
        let shape = {};

        let vertexData = [];
        let vertexCount = geometry.vertices.length;
        for (let i = 0; i < vertexCount; i++) {
            vertexData.push(geometry.vertices[i][0], geometry.vertices[i][1], geometry.vertices[i][2]);
            vertexData.push(geometry.normals[i][0], geometry.normals[i][1], geometry.normals[i][2]);
            vertexData.push(geometry.uvs[i][0], geometry.uvs[i][1]);
        }

        let vertexArray = new Float32Array(vertexData);
        let vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertexArray, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        let indices = [];
        let faceCount = geometry.faces.length;
        for (let i = 0; i < faceCount; i++) {
            indices.push(geometry.faces[i].indices[0], geometry.faces[i].indices[1], geometry.faces[i].indices[2]);
        }
        let indexArray = new Uint16Array(indices);
        let indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexArray, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

        shape.vertexBuffer = vertexBuffer;
        shape.indexBuffer = indexBuffer;
        shape.size = indexArray.length;
        shape.stride = vertexCount * (3 + 3 + 2);
        shape.positionOffset = vertexCount * 0;
        shape.normalOffset = vertexCount * 3;
        shape.texCoordOffset = vertexCount * (3 + 3);
        return shape;
    }

    // former draw()
    drawShape(gl, program, shape, initialize) {
        gl.useProgram(program);

        initialize();

        gl.bindBuffer(gl.ARRAY_BUFFER, shape.vertexBuffer);
        gl.enableVertexAttribArray(program.vert_position);
        gl.vertexAttribPointer(program.vert_position, 3, gl.FLOAT, false, shape.stride, shape.positionOffset);
        gl.enableVertexAttribArray(program.vert_texCoord);
        gl.vertexAttribPointer(program.vert_texCoord, 2, gl.FLOAT, false, shape.stride, shape.texCoordOffset);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, shape.indexBuffer);
        gl.drawElements(gl.TRIANGLES, shape.size, gl.UNSIGNED_SHORT, 0);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

        gl.useProgram(null);
    }

    setupTexture(gl, program, texture, textureIdx) {
        // Step 1: Activate texture unit associated with this texture
        gl.activeTexture(textureIdx + gl.TEXTURE0);
        // Step 2: Bind the texture you want to use:
        gl.bindTexture(gl.TEXTURE_2D, texture);
        // Step 3: Set the texture uniform to the "index" of the texture unit you just activated
        var textureLocation = gl.getUniformLocation(program, "texture1");
        gl.uniform1i(textureLocation, textureIdx);
    }

    getModelMatrix(transform) {
        // translate
        let T = mat4.create();
        mat4.fromTranslation(T, transform.position);

        // rotate
        let R = mat4.create();
        // XYZ Order
        mat4.rotate(R, R, transform.rotation[0], xAxis);
        mat4.rotate(R, R, transform.rotation[1], yAxis);
        mat4.rotate(R, R, transform.rotation[2], zAxis);

        // ZYX Order
        // mat4.rotate(R, R, transform.rotation[2], zAxis);
        // mat4.rotate(R, R, transform.rotation[1], yAxis);
        // mat4.rotate(R, R, transform.rotation[0], xAxis);

        // scale
        let S = mat4.create();
        mat4.fromScaling(S, transform.localScale);

        let M = mat4.create();

        // TRS order
        mat4.mul(M, M, T);
        mat4.mul(M, M, R);
        mat4.mul(M, M, S);

        return M;
    }

    // TODO: Write a version of this function that just passes in the transform of a camera
    getViewMatrix(camPos, camDir, camUp) {
        let lookPoint = vec3.create();
        vec3.add(lookPoint, camPos, camDir);

        let viewMatrix = mat4.create();
        mat4.lookAt(viewMatrix, camPos, lookPoint, camUp);

        return viewMatrix;
    }

    // TODO: Write a version of this function that just passes in a camera
    getProjectionMatrix(fieldOfView, aspectRatio, near, far) {
        let projectionMatrix = mat4.create();
        mat4.perspective(projectionMatrix, fieldOfView, aspectRatio, near, far);

        return projectionMatrix;
    }

    getMVPMatrix(gl, program, transform, camPos, camDir, camUp, fieldOfView, aspectRatio, near, far) {
        let modelMatrix = getModel(transform);
        let viewMatrix = getView(camPos, camDir, camUp);
        let projectionMatrix = getProjection(fieldOfView, aspectRatio, near, far);

        var mvpMatrix = getMVP(modelMatrix, viewMatrix, projectionMatrix);
        
        // TODO: Don't just assume this!
        var mvpLocation = gl.getUniformLocation(program, "modelViewProjection");

        gl.uniformMatrix4fv(mvpLocation, false, mvpMatrix);
    }

    updateMVPMatrix(gl, program, transform, camPos, camDir, camUp, fieldOfView, aspectRatio, near, far) {
        let modelMatrix = this.getModelMatrix(transform);
        let viewMatrix = this.getView(camPos, camDir, camUp);
        let projectionMatrix = this.getProjectionMatrix(fieldOfView, aspectRatio, near, far);

        let mvpMatrix = this.getMVPMatrix(modelMatrix, viewMatrix, projectionMatrix);

        let mvpLocation = gl.getUniformLocation(program, "modelViewProjection");

        gl.uniformMatrix4fv(mvpLocation, false, mvpMatrix);
    }

    storeLocations(gl, program) {
        // TODO: Don't just assume these, maybe!
        program.vert_position = gl.getAttribLocation(program, "vert_position");
        program.vert_texCoord = gl.getAttribLocation(program, "vert_texCoord");
        program.mvp = gl.getUniformLocation(program, "modelViewProjection");
    }

    startRendering() {
        var gl = initializeWebGL($("#webglCanvas"));
        var program = createGlslProgram(gl, "vertexShader", "fragmentShader");

        this.storeLocations(gl, program);

        gl.useProgram(program);

        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);

        this.loadImages(gl);
    }

    // former startWebGL
    loadImages(gl) {
        let imageCount = this.imageSources.length;
        let loadedCount = 0;

        let images = [];

        for (let i = 0; i < this.imageSources.length; i++) {
            let image = new Image();
            image.crossOrigin = "anonymous";
            image.src = this.imageSources[i];

            images.push(image);

            image.onload = () => {
                loadedCount += 1;
                if (loadedCount >= imageCount) {
                    return setupTextures(gl, images);
                }
            };
        }
    }

    // former setup for runWebGL
    setupTextures(gl, images) {
        // load scene textures
        // TODO: Maybe have a slightly less brilliant countermeasure for this.
        if (images.length > 32) {
            alert("Whoopsie doopsie, Alex didn't program support for more than 32 consecutive textures yet!!!!!");
        }
        for (let i = 0; i < images.length; i++) {
            let sceneTexture = {
                src: images.src,
                texture: this.loadTexture(gl, images[i], i + gl.TEXTURE0),
                textureIdx: i
            };
            this.sceneTextures.push(sceneTexture);
        }
    }

    // formerly known as updateWebGL
    drawScene(gl, scene) {
        let backgroundColor = vec4.fromValues(0.53, 0.81, 0.92, 1.0);
        gl.clearColor(backgroundColor[0], backgroundColor[1], backgroundColor[2], backgroundColor[3]);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // Draw all scene meshes
        // TODO: Don't assume a single texture for each object, don't assume it's stored in a variable called "texture1"
        // TODO: Don't assume the same program for every mesh, use program defined by mesh material
        if (gl.getUniformLocation(program, "texture1") != null) {
            for (let i = 0; i < scene.meshObjects.length; i++) {
                let mesh = scene.meshObjects[i];
                
                let sceneTexture;
                // find the texture associated with this source lol
                for (let j = 0; j < this.sceneTextures.length; j++) {
                    if (this.sceneTextures[j].src == mesh.material.textureSrc) {
                        sceneTexture = this.sceneTextures[j];
                        break;
                    }
                }
                let texture = sceneTexture.texture;
                let textureIdx = sceneTexture.textureIdx;
                
                this.setupTexture(gl, program, texture, textureIdx + gl.TEXTURE0, textureIdx);

                let shape = createShape(gl, mesh.geometry);

                let camPos = scene.camera.transform.position;
                // TODO: Include more rotations than just the z axis lol
                let camDir = vec3.fromValues(Math.cos(scene.camera.rotation[2]), Math.sin(scene.camera.rotation[2], 0));
                let camUp = vec3.fromValues(1, 1, 1);

                let fov = scene.camera.fieldOfView;
                let aspectRatio = scene.camera.aspectRatio;
                let near = scene.camera.near;
                let far = scene.camera.far;

                updateMVPMatrix(
                    gl, program,
                    mesh.transform,
                    camPos, camDir, camUp,
                    fov, aspectRatio, near, far
                );

                this.drawShape(gl, program, shape, () => {});
            }
        }
    }
}


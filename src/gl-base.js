"use strict";

var shaders = {
    "unlitPoint": {
        source: "unlitPoint.c",
        attributes: {
            "coords":"vec3", 
            "color":"vec3",
            "size":"float"
        },
        uniforms: {
            "modelview":"mat4", 
            "projection":"mat4"
        },
        indices: false
    },

    "unlitColor": {
        source: "unlitColor.c",
        attributes: {
            "coords":"vec3", 
            "color":"vec3"
        },
        uniforms: {
            "modelview":"mat4", 
            "projection":"mat4"
        }
    },

    "unlitUniformColor": {
        source: "unlitColor.c",
        attributes: {
            "coords":"vec3", 
        },
        uniforms: {
            "modelview":"mat4", 
            "projection":"mat4",
            "color":"vec3"
        }
    },

    "unlitUniformColorCircle": {
        source: "unlitColor.c",
        attributes: {
            "coords":"vec3", 
            "texcoord":"vec2"
        },
        uniforms: {
            "modelview":"mat4", 
            "projection":"mat4",
            "color":"vec3"
        }
    }, 

    "unlitTexture": {
        source: "unitTexture.c",
        attributes: {
            "coords":"vec3", 
            "color":"vec3",
            "texcoord":"vec2"
        }, 
        uniforms: {
            "modelview":"mat4", 
            "projection":"mat4",
            "texture": "sampler2D"
        }
    },

    "lambertColor": {
        attributes: {
            "coords":"vec3", 
            "normal":"vec3"
        },
        uniforms: {
            "modelview":"mat4", 
            "projection":"mat4",
            "normalMatrix":"mat3",
            "lightPosition":"vec4",
            "diffuseColor":"vec4",
            "ambientLighting":"float"
        }
    },

    "lambertTexture": {

    },

    "phongColor": {
        source: "phongColor.c",
        attributes: {
            "coords":"vec3", 
            "normal":"vec3"
        },
        uniforms: {
            "modelview":"mat4", 
            "projection":"mat4",
            "normalMatrix":"mat3",
            "lightPosition":"vec4",
            "diffuseColor":"vec4",
            "specularColor":"vec3",
            "specularExponent":"float",
            "ambientLighting":"float"
        }
    },
    "phongTexture": {
        source: "phongTexture.c",

        attributes: {
            "coords":"vec3", 
            "normal":"vec3",
            "texcoord":"vec2"
        }, 
        uniforms: {
            "modelview":"mat4", 
            "projection":"mat4",
            "normalMatrix":"mat3",
            "lightPosition":"vec4",
            "specularColor":"vec3",
            "specularExponent":"float",
            "ambientLighting":"float"
        }  
    },

    "skybox": {
        source: "skybox.c",
        attributes: {
            "coords": "vec3"
        },
        uniforms: {
            "modelview":"mat4", 
            "projection":"mat4",
            "skybox":"samplerCube",
        }
    },

    "cubemapReflection": {
        source: "cubemapReflection.c",
        attributes: {
            "coords": "vec3",
            "normal": "vec3"
        },
        uniforms: {
            "modelview":"mat4", 
            "projection":"mat4",
            "normalMatrix":"mat3",
            "inverseViewTransform":"mat3",
            "skybox":"samplerCube"
        }
    },
    "toon": {
        attributes: {
            "coords":"vec3", 
            "normal":"vec3"
        },
        uniforms: {
            "modelview":"mat4", 
            "projection":"mat4",
            "normalMatrix":"mat3",
            "lightPosition":"vec4",
            "diffuseColor":"vec4",
            "ambientLighting":"float",
            "factor":"float"
        }
    }, 

    "toonPhong": {
        attributes: {
            "coords":"vec3", 
            "normal":"vec3"
        },
        uniforms: {
            "modelview":"mat4", 
            "projection":"mat4",
            "normalMatrix":"mat3",
            "lightPosition":"vec4",
            "diffuseColor":"vec4",
            "ambientLighting":"float",
            "factor":"float"
        }
    },  

    "phongRemove": {
        source: "phongColor.c",
        attributes: {
            "coords":"vec3", 
            "normal":"vec3"
        },
        uniforms: {
            "modelview":"mat4", 
            "projection":"mat4",
            "normalMatrix":"mat3",
            "lightPosition":"vec4",
            "diffuseColor":"vec4",
            "ambientLighting":"float"
        }
    },
 
}

var materials = {}
var currentMat
var gl   // The webgl context.
var canvas
var transformStack = []

var clearVal = 0

var defaultObjects = {  // Objects for display, selected by popup menu
    // "cube": cube(5),
    // "uvTorus": uvTorus(3,1,64,32),
    // "uvCylinder": uvCylinder(1.5,5.5),
    // "uvCone": uvCone(2.5,5.5),
    // "uvSphere": uvSphere(3),
    // "uvSphere2": uvSphere(3,12,6)
}
var defaultColors = [[1,1,1], [1,0,0], [0,1,0], [0,0,1], [0,1,1], [1,0,1], [1,1,0], [0,0,0], [0.5,0.5,0.5]]
var defaultLights = [[0,0,0,1], [0,0,1,0], [0,1,0,0], [0,0,-10,1], [2,3,5,0]]

var rotator  
var zoomer

function pushTransform(tran) {
    transformStack.push(mat4.clone(tran))
}

function popTransform(tran) {
    return mat4.copy(tran, transformStack.pop())
}
/**
 * initialization function that will be called when the page has loaded
 */
function glInit(callback) {
    try {
        canvas = document.getElementById("webglcanvas");
        gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
        if ( ! gl ) {
            throw "Browser does not support WebGL";
        }
    }
    catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not get a WebGL graphics context.</p>";
        return;
    }
    try {
        callback()
    }
    catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not initialize the WebGL graphics context:" + e + "</p>";
        return;
    }
}

/**
 *  Loads a texture image asynchronously.  The first paramter is the url
 *  from which the image is to be loaded.  The second parameter is the
 *  texture object into which the image is to be loaded.  When the image
 *  has finished loading, the draw() function will be called to draw the
 *  triangle with the texture.  (Also, if an error occurs during loading,
 *  an error message is displayed on the page, and draw() is called to
 *  draw the triangle without the texture.)
 */
function loadTexture(url, textureObject, callback) {
    var img = new Image();  //  A DOM image element to represent the image.
    img.onload = function() { 
        // This function will be called after the image loads successfully.
        // We have to bind the texture object to the TEXTURE_2D target before
        // loading the image into the texture object. 
        gl.bindTexture(gl.TEXTURE_2D, textureObject);
        gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);
        gl.generateMipmap(gl.TEXTURE_2D);  // Create mipmaps; you must either
                              // do this or change the minification filter.
        callback()
    }
    img.crossOrigin = 'anonymous'
    img.onerror = function(e,f) { 
        console.log(e)
        // This function will be called if an error occurs while loading.
        document.getElementById("canvas-holder").innerHTML =
                        "<p>Sorry, texture image could not be loaded.</p>";
        callback()
    }
    img.src = url;  // Start loading of the image.
                    // This must be done after setting onload and onerror.
}


/* Creates a program for use in the WebGL context gl, and returns the
 * identifier for that program.  If an error occurs while compiling or
 * linking the program, an exception of type String is thrown.  The error
 * string contains the compilation or linking error.  If no error occurs,
 * the program identifier is the return value of the function.
 *    The second and third parameters are the id attributes for <script>
 * elementst that contain the source code for the vertex and fragment
 * shaders.
 */
function createProgram(gl, vertexShaderID, fragmentShaderID) {
    function getTextContent( elementID ) {
            // This nested function retrieves the text content of an
            // element on the web page.  It is used here to get the shader
            // source code from the script elements that contain it.
        var element = document.getElementById(elementID);
        var node = element.firstChild;
        var str = "";
        while (node) {
            if (node.nodeType == 3) // this is a text node
                str += node.textContent;
            node = node.nextSibling;
        }
        return str;
    }

    try {
        var vertexShaderSource = getTextContent( vertexShaderID );
        var fragmentShaderSource = getTextContent( fragmentShaderID );
        // console.log("PROGRAM")
        // console.log(vertexShaderSource)
        // console.log(fragmentShaderSource)
    }
    catch (e) {
        throw "Error: Could not get shader source code from script elements. " + vertexShaderID + " " + fragmentShaderID;
    }
    var vsh = gl.createShader( gl.VERTEX_SHADER );
    gl.shaderSource(vsh,vertexShaderSource);
    gl.compileShader(vsh);
    if ( ! gl.getShaderParameter(vsh, gl.COMPILE_STATUS) ) {
        throw "Error in vertex shader:  " + gl.getShaderInfoLog(vsh);
     }
    var fsh = gl.createShader( gl.FRAGMENT_SHADER );
    gl.shaderSource(fsh, fragmentShaderSource);
    gl.compileShader(fsh);
    if ( ! gl.getShaderParameter(fsh, gl.COMPILE_STATUS) ) {
       throw "Error in fragment shader:  " + gl.getShaderInfoLog(fsh);
    }
    var prog = gl.createProgram();
    gl.attachShader(prog,vsh);
    gl.attachShader(prog, fsh);
    gl.linkProgram(prog);
    if ( ! gl.getProgramParameter( prog, gl.LINK_STATUS) ) {
       throw "Link error in program:  " + gl.getProgramInfoLog(prog);
    }
    return prog;
}

function initMaterial(shader, options = {}) {
    if(!(shader in shaders)) {
        console.log("Shader '" + shader + "' not defined in base, go there and do it")
        return
    }

    var label = options.name || shader
    // console.log("INIT MATERIALS " + name)

    // Load shader into script tag?

    if(!(label in materials)) {
        // Create material
        var mat = {
            shader:shader,
            name:label,
            attributes:{},
            uniforms:{}
        }
        var prog

        mat.loadProgram = () => {
            // console.log("LoadingProgram " + label)
            if("prog" in shaders[shader] && shaders[shader]["prog"] != null)
                prog = shaders[shader]["prog"]
            else {
                prog = createProgram(gl, shader + "-vshader-source", shader + "-fshader-source");
                shaders[shader]["prog"] = prog
            }

            gl.useProgram(prog); 
            currentMat = mat.label
        }
        mat.loadProgram()

        for(var atr in shaders[shader]["attributes"]) {
            mat["attributes"][atr] = {
                "loc": gl.getAttribLocation(prog, "a_"+atr),
                "buffer": gl.createBuffer(),
                "type": shaders[shader]["attributes"][atr]
            }
        }

        for(var uni in shaders[shader]["uniforms"]) {
            // console.log("")
            var loc = gl.getUniformLocation(prog, uni)
            // console.log("Getting uniform location for " + uni)
            mat["uniforms"][uni] = {
                "loc": loc,//gl.getUniformLocation(prog, uni),
                "type": shaders[shader]["uniforms"][uni]
            }
        }

        if(!("indices" in shaders[shader] && !shaders[shader]["indices"])) {
            mat["indices"] = {
                "buffer": gl.createBuffer()
            }
        }

        mat.setUniform = (uni, vals, write = true) => {
            if(vals == null)
                return
            if(uni in mat["uniforms"]) {
                var type = mat["uniforms"][uni]["type"]
                var u_loc = mat["uniforms"][uni]["loc"]

                // console.log("Setting uniform " + uni + " for " + name)
                // console.log(type)

                switch(type) {
                    case "float":
                        gl.uniform1f(u_loc, vals);
                    break
                    case "vec2":
                        gl.uniform2f(u_loc, vals[0], vals[1]); 
                    break
                    case "vec3":
                        gl.uniform3f(u_loc, vals[0], vals[1], vals[2]); 
                    break
                    case "vec4":
                        gl.uniform4f(u_loc, vals[0], vals[1], vals[2], vals[3]); 
                    break
                    case "mat3":

                        // console.log("Setting uniform " + uni + " for " + name)
                        // console.log(type)
                        // console.log(u_loc)
                        gl.uniformMatrix3fv(u_loc, false, vals)
                    break
                    case "mat4":
                        gl.uniformMatrix4fv(u_loc, false, vals)
                    break
                    case "skybox":
                    break
                    default:
                    break
                }

                if(write && type != "skybox")
                    mat["uniforms"][uni]["vals"] = vals
            }
        }

        mat.setAttribute = (atr, vals, options = {}) => {
            if(!(atr in mat["attributes"])) {
                console.log("Attribute " + atr + " not in material")
                console.log(mat)
                return
            }
            var mode = gl.STREAM_DRAW
            if("mode" in options) mode = options.mode

            var dim = typeDim(mat["attributes"][atr]["type"])
            var loc = mat["attributes"][atr]["loc"]
            var buffer = mat["attributes"][atr]["buffer"]

            // console.log("Setting attribute " + atr)
            // console.log(vals)
            // console.log(dim)
            // console.log(loc)
            // console.log(mode)
            // console.log(gl.STATIC_DRAW)
            // console.log(buffer)

            gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
            gl.bufferData(gl.ARRAY_BUFFER, vals, mode)
            gl.vertexAttribPointer(loc, dim, gl.FLOAT, false, 0, 0)
            gl.enableVertexAttribArray(loc)
        }

        mat.setIndices = (ind) => {
            if("indices" in mat) {
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mat["indices"]["buffer"]);
                gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, ind, gl.STATIC_DRAW);
            } 
        }
        // console.log("INIT MAY")
        // console.log(mat)

        materials[label] = mat
    }

    // Set uniforms from options
    for(var uni in options) {
        // console.log("Setting uniform " + uni + " from start")
        materials[label].setUniform(uni, options[uni])
    }

    // currentMat = label
    return materials[label]
}

function typeDim(type) {
    switch(type) {
        case "float":
            return 1
        case "vec2":
            return 2
        case "vec3":
            return 3
        case "vec4":
            return  4
    } 
}

function initObject(options = {}) {
    console.log("Creating object with options")
    console.log(options)

    if(!("mat" in options) && !("shader" in options)) {
        console.log("Must include mat or name in options")
        return
    }

    var mat = options.mat || initMaterial(options.shader)
    var drawMethod = options.drawMethod || "arrays"
    var drawMode = gl.TRIANGLES
    var streamMode = gl.STREAM_DRAW
    if("drawMode" in options) drawMode = options.drawMode

    var elements = options.elements || 0
    var attributeValues = {}
    var dirty = true

    var initElements = (elem) => {
        for(var key in mat["attributes"]) {
            var atr = mat["attributes"][key]
            attributeValues[key] = {
                "vals": new Float32Array(elem*typeDim(atr.type)),
                "dirty": true
            }
        }

        elements = elem
    }
    initElements(elements)

    var verify = (key) => {
        if(!(key in attributeValues)) {
            console.log("Key " + key + " not in attributes")
            return false
        }
        return true
    }

    var obj = {}

    obj.initElements = initElements;

    obj.getArray = (key) =>  {
        if(!verify(key)) return
        return attributeValues[key]["vals"]
    }

    obj.setArray = (key, val) =>  {
        if(!verify(key)) return
        attributeValues[key]["vals"] = val
    }

    obj.setValues = (key, i, vals) =>  {
        if(!verify(key)) return
        for(let j = 0; j < vals.length; j++) {
            attributeValues[key]["vals"][i*vals.length + j] = vals[j]
        }
        attributeValues[key]["dirty"] = true
    }

    obj.getValue = (key, i) => {
        if(!verify(key)) return
        return attributeValues[key]["vals"][i]
    }
    obj.setValue = (key, i, val) => {
        if(!verify(key)) return
        attributeValues[key]["vals"][i] = val
        attributeValues[key]["dirty"] = true
    }

    obj.mat = mat

    obj.draw = (modelview, projection, normalMatrix, _dirty = false) => {
        if(currentMat != mat.name) {

            // console.log("Current mat " + currentMat)
            // console.log("My mat " + mat.name)
            mat.loadProgram()
            // initMaterial(mat.name)
            dirty = true

            for(var key in attributeValues) {
                attributeValues[key]["dirty"] = true
            }
        }

        mat.setUniform("modelview", modelview)
        mat.setUniform("projection", projection)
        mat.setUniform("normalMatrix", normalMatrix)

        dirty = dirty || _dirty

        if(dirty) {
            for(var key in attributeValues) {
                if(attributeValues[key]["dirty"] == true) {
                    if(key != 'indices') {
                        mat.setAttribute(key, attributeValues[key]["vals"], {mode:streamMode})
                    } else {
                        mat.setIndices(attributeValues["indices"]["vals"])
                    }

                    attributeValues[key]["dirty"] = false
                }
            }

            for(var key in mat["uniforms"]) {
                // console.log("Setting uniform " + key +"  from draw")
                mat.setUniform(key, mat["uniforms"][key]["vals"], false)
            }

            dirty = false
        }

        // Draw the triangles.
        switch(drawMethod) {
            case "arrays":
                // console.log("Drawing array for " + elements + " ements" )
                gl.drawArrays(drawMode, 0, elements); 
            break
            case "elements":
                // console.log("Drawing elements for " + elements + " elements")
                gl.drawElements(drawMode, elements, gl.UNSIGNED_SHORT, 0);  
            break
        }
    }

    obj.dirtyAttributes = () => {
        for(var key in attributeValues)
            attributeValues[key]["dirty"] = true

        dirty = true
    }

    obj.dirtyUniforms = () => { 
        dirty = true 
    }

    obj.updateAttribute = (key) => {
        if(key in mat["attributes"])
            mat.setAttribute(key, attributeValues[key],{mode:streamMode})
    }

    obj.setModel = (modelData) => {
        attributeValues["coords"]["vals"] = modelData.vertexPositions
        if("texcoord" in mat["attributes"])
            attributeValues["texcoord"]["vals"] = modelData.vertexTextureCoords
        if("normal" in mat["attributes"])
            attributeValues["normal"]["vals"] = modelData.vertexNormals
        attributeValues["indices"] = {
            "vals": modelData.indices,
            "dirty": true
        }
        mat.setIndices(attributeValues["indices"]["vals"])

        elements = attributeValues["indices"]["vals"].length
        streamMode = gl.STATIC_DRAW
        drawMethod = "elements"
    }

    if("modelName" in options)
        obj.setModel(defaultObjects[options["modelName"]])

    if("model" in options) {
        obj.setModel(options["model"])
    }

    // console.log("CREATING OBJECT")
    // console.log(obj)

    return obj
}
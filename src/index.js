var a_coords_loc 
var a_coords_buffer
var a_size_loc = -1
var a_size_buffer
var a_color_loc = -1
var a_color_buffer

var u_modelview
var u_projection

var projection = mat4.create()
var modelview =
        [1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, -2, 1]
var pointColors = [  // RGB color arrays for diffuse and specular color values, selected by popup menu
    [1,0,0], [0,1,0], [0,0,1], [0,1,1], [1,0,1], [1,1,0],
    [1,0.5,0.5], [0.5,1,0.5], [0.5,0.5,1], [0.5,1,1], [1,0.5,1], [1,1,0.5],
    [1,1,1], [0,0,0], [0.3,0.3,0.3], [0.6,0.6,0.6], 
];
var clearVal = 0.4

var n = 1
var step = []
var steps = {}
var stepCount = 100
var currentStep = 0
var coords = new Float32Array()
var colors = new Float32Array()
var sizes = new Float32Array()


var scale = 1
var dt = 1000/60
var time = 0
var loopTimeout

function reset(data = null) {
    if(loopTimeout != null)
        clearTimeout(loopTimeout)

    var maxRank = 0
    // Load file
    if(data == null) {
        n = 1
        for(let i = 0; i < stepCount; i++) {
            var point = {i:0, x:-1 + 2*i/stepCount, y:0}
            steps[i] = []
            steps[i].push(point)
        }
    } else {
        data = data.split('\n')
        steps = {}
        size = 1
        for(var i = 0; i < data.length; i++) {
            var line = data[i].split(',')
            if(line.length == 3) {
                if(i == 0) {
                    n = line[0]
                    size = line[1]
                    stepCount = line[2]
                }

            } else {
                var step = parseInt(line[0])
                var rank = parseInt(line[1])
                var x = -1 + 2*(parseFloat(line[2])/size)
                var y = -1 + 2*(parseFloat(line[3])/size)
                if(!(step in steps))
                    steps[step] = []

                if(rank > maxRank)
                    maxRank = rank
                steps[step].push({i:rank, x:x, y:y})
            }
        }
    }

    coords = new Float32Array(n*3)
    colors = new Float32Array(n*3)
    sizes = new Float32Array(n)
    
    document.getElementById('meta').textContent = `n=${n}, num_procs=${maxRank+1}, steps=${stepCount}`

    for(let i = 0; i < n*3; i++) {
        coords[i*3 + 0] = 0
        coords[i*3 + 1] = 0
        coords[i*3 + 2] = 0
        colors[i*3 + 0] = 0
        colors[i*3 + 1] = 0
        colors[i*3 + 2] = 0
        sizes[i] = 5
    }

    currentStep = 0
    step = []
    loop()
}

function loop() {
    draw(currentStep)

    if(loopTimeout != null)
        clearTimeout(loopTimeout)

    loopTimeout = setTimeout(loop, dt)

    time += dt
    currentStep = (currentStep+1)%stepCount
}


function draw(i) { 
    // Multi Triangle
    gl.clearColor(clearVal, clearVal, clearVal, 1);  // specify the color to be used for clearing
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    //mat4.perspective(projection, Math.PI/5, 1, 0.5, 20);
    mat4.ortho(projection, -1.0, 1.0, -1.0, 1.0, 0.1, 100); 

    mat4.scale(modelview, modelview, vec3.fromValues(scale, scale, scale))

    // Uniforms
    gl.uniformMatrix4fv(u_modelview, false, modelview );
    gl.uniformMatrix4fv(u_projection, false, projection ); 

    // Load up coords with current points
    if(i in steps) {
        step = steps[i]

        for(var i = 0; i < step.length; i++) {
            var p = step[i]
            coords[i*3 + 0] = p.x;
            coords[i*3 + 1] = p.y;
            coords[i*3 + 2] = 0;

            var color = pointColors[p.i]
            colors[i*3 + 0] = color[0]
            colors[i*3 + 1] = color[1]
            colors[i*3 + 2] = color[2]
        }
    }

    // Set up values for the "coords" attribute 
    gl.bindBuffer(gl.ARRAY_BUFFER, a_coords_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, coords, gl.STREAM_DRAW);
    gl.vertexAttribPointer(a_coords_loc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_coords_loc); 
   
    // Set up values for the "color" attribute
    if(a_color_loc != -1) { 
        gl.bindBuffer(gl.ARRAY_BUFFER, a_color_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STREAM_DRAW);
        gl.vertexAttribPointer(a_color_loc, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_color_loc); 
    }

    if(a_size_loc != -1) {
        gl.bindBuffer(gl.ARRAY_BUFFER, a_size_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, sizes, gl.STREAM_DRAW);
        gl.vertexAttribPointer(a_size_loc, 1, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_size_loc); 
    }

    // Draw the triangles. 
    gl.drawArrays(gl.POINTS, 0, step.length); 
}

function initPoint(canvas) {
    var prog = createProgram(gl,"point-vshader-source","point-fshader-source");
    gl.useProgram(prog);

    a_coords_loc =  gl.getAttribLocation(prog, "a_coords");
    a_coords_buffer = gl.createBuffer();
    a_color_loc =  gl.getAttribLocation(prog, "a_color");
    a_color_buffer = gl.createBuffer();
    a_size_loc =  gl.getAttribLocation(prog, "a_size"); 
    a_size_buffer = gl.createBuffer(); 

    // console.log("Coords: " + a_coords_loc)
    // console.log("Colors: " + a_color_loc)
    // console.log("Size: " + a_size_loc)

    index_buffer = gl.createBuffer();

    u_modelview = gl.getUniformLocation(prog, "modelview");
    u_projection = gl.getUniformLocation(prog, "projection");    

    gl.enable(gl.DEPTH_TEST);
}

/* Initialize the WebGL context */
function init() {
    document.getElementById('data').textContent = demoData
    glInit(() => {
        initPoint(canvas)

        reset(demoData)
        loop()
    })

    document.body.onkeyup = function(e){
        if(e.keyCode == 32){
            currentStep = 0
            //reset()
        }
    }   

    document.getElementById('data').addEventListener('input', (e) => {
        reset(e.target.value)
    })
}

var demoData = `2,1,100
0,0,0.0,0.33
1,0,0.01,0.33
2,0,0.02,0.33
3,0,0.03,0.33
4,0,0.04,0.33
5,0,0.05,0.33
6,0,0.06,0.33
7,0,0.07,0.33
8,0,0.08,0.33
9,0,0.09,0.33
10,0,0.1,0.33
11,0,0.11,0.33
12,0,0.12,0.33
13,0,0.13,0.33
14,0,0.14,0.33
15,0,0.15,0.33
16,0,0.16,0.33
17,0,0.17,0.33
18,0,0.18,0.33
19,0,0.19,0.33
20,0,0.2,0.33
21,0,0.21,0.33
22,0,0.22,0.33
23,0,0.23,0.33
24,0,0.24,0.33
25,0,0.25,0.33
26,0,0.26,0.33
27,0,0.27,0.33
28,0,0.28,0.33
29,0,0.29,0.33
30,0,0.3,0.33
31,0,0.31,0.33
32,0,0.32,0.33
33,0,0.33,0.33
34,0,0.34,0.33
35,0,0.35,0.33
36,0,0.36,0.33
37,0,0.37,0.33
38,0,0.38,0.33
39,0,0.39,0.33
40,0,0.4,0.33
41,0,0.41,0.33
42,0,0.42,0.33
43,0,0.43,0.33
44,0,0.44,0.33
45,0,0.45,0.33
46,0,0.46,0.33
47,0,0.47,0.33
48,0,0.48,0.33
49,0,0.49,0.33
50,0,0.5,0.33
51,0,0.51,0.33
52,0,0.52,0.33
53,0,0.53,0.33
54,0,0.54,0.33
55,0,0.55,0.33
56,0,0.56,0.33
57,0,0.57,0.33
58,0,0.58,0.33
59,0,0.59,0.33
60,0,0.6,0.33
61,0,0.61,0.33
62,0,0.62,0.33
63,0,0.63,0.33
64,0,0.64,0.33
65,0,0.65,0.33
66,0,0.66,0.33
67,0,0.67,0.33
68,0,0.68,0.33
69,0,0.69,0.33
70,0,0.7,0.33
71,0,0.71,0.33
72,0,0.72,0.33
73,0,0.73,0.33
74,0,0.74,0.33
75,0,0.75,0.33
76,0,0.76,0.33
77,0,0.77,0.33
78,0,0.78,0.33
79,0,0.79,0.33
80,0,0.8,0.33
81,0,0.81,0.33
82,0,0.82,0.33
83,0,0.83,0.33
84,0,0.84,0.33
85,0,0.85,0.33
86,0,0.86,0.33
87,0,0.87,0.33
88,0,0.88,0.33
89,0,0.89,0.33
90,0,0.9,0.33
91,0,0.91,0.33
92,0,0.92,0.33
93,0,0.93,0.33
94,0,0.94,0.33
95,0,0.95,0.33
96,0,0.96,0.33
97,0,0.97,0.33
98,0,0.98,0.33
99,0,0.99,0.33
0,1,0.0,0.66
1,1,0.01,0.66
2,1,0.02,0.66
3,1,0.03,0.66
4,1,0.04,0.66
5,1,0.05,0.66
6,1,0.06,0.66
7,1,0.07,0.66
8,1,0.08,0.66
9,1,0.09,0.66
10,1,0.1,0.66
11,1,0.11,0.66
12,1,0.12,0.66
13,1,0.13,0.66
14,1,0.14,0.66
15,1,0.15,0.66
16,1,0.16,0.66
17,1,0.17,0.66
18,1,0.18,0.66
19,1,0.19,0.66
20,1,0.2,0.66
21,1,0.21,0.66
22,1,0.22,0.66
23,1,0.23,0.66
24,1,0.24,0.66
25,1,0.25,0.66
26,1,0.26,0.66
27,1,0.27,0.66
28,1,0.28,0.66
29,1,0.29,0.66
30,1,0.3,0.66
31,1,0.31,0.66
32,1,0.32,0.66
33,1,0.33,0.66
34,1,0.34,0.66
35,1,0.35,0.66
36,1,0.36,0.66
37,1,0.37,0.66
38,1,0.38,0.66
39,1,0.39,0.66
40,1,0.4,0.66
41,1,0.41,0.66
42,1,0.42,0.66
43,1,0.43,0.66
44,1,0.44,0.66
45,1,0.45,0.66
46,1,0.46,0.66
47,1,0.47,0.66
48,1,0.48,0.66
49,1,0.49,0.66
50,1,0.5,0.66
51,1,0.51,0.66
52,1,0.52,0.66
53,1,0.53,0.66
54,1,0.54,0.66
55,1,0.55,0.66
56,1,0.56,0.66
57,1,0.57,0.66
58,1,0.58,0.66
59,1,0.59,0.66
60,1,0.6,0.66
61,1,0.61,0.66
62,1,0.62,0.66
63,1,0.63,0.66
64,1,0.64,0.66
65,1,0.65,0.66
66,1,0.66,0.66
67,1,0.67,0.66
68,1,0.68,0.66
69,1,0.69,0.66
70,1,0.7,0.66
71,1,0.71,0.66
72,1,0.72,0.66
73,1,0.73,0.66
74,1,0.74,0.66
75,1,0.75,0.66
76,1,0.76,0.66
77,1,0.77,0.66
78,1,0.78,0.66
79,1,0.79,0.66
80,1,0.8,0.66
81,1,0.81,0.66
82,1,0.82,0.66
83,1,0.83,0.66
84,1,0.84,0.66
85,1,0.85,0.66
86,1,0.86,0.66
87,1,0.87,0.66
88,1,0.88,0.66
89,1,0.89,0.66
90,1,0.9,0.66
91,1,0.91,0.66
92,1,0.92,0.66
93,1,0.93,0.66
94,1,0.94,0.66
95,1,0.95,0.66
96,1,0.96,0.66
97,1,0.97,0.66
98,1,0.98,0.66
99,1,0.99,0.66
`
/*
*	M. Stanley
*   B. Messner
*	Image Processing and Visualization Tool
*  
*	2015-06-02
*/

var im_name = "cones.png";


//function that is called when the window is loaded
//finds the texture and calls the draw function
window.onload = function main(){
    gl = initialize();

    /*
    var image = new Image();
    image.src = "images/" + im_name;
    image.onload = function() {
        render_image(image, gl);
    }*/
    
    Promise.all([ initializeTexture(gl, 0, 'images/cones1.png')])
    .then(function () {load_image2()})
    .catch(function (error) {alert('Failed to load texture '+  error.message);}); 
    
}

function load_image2(){
    Promise.all([ initializeTexture(gl, 1, 'images/cones2.png')])
    .then(function () {animation(gl.images, gl);})
    .catch(function (error) {alert('Failed to load texture '+  error.message);}); 
}

/*
 *  regular old initilaization method, sets up the canvas
 *  and gl objects, also initializes various matrices and uniforms
 */
function initialize() {
    var canvas = document.getElementById('gl-canvas');
    
    // Use webgl-util.js to make sure we get a WebGL context
    var gl = WebGLUtils.setupWebGL(canvas);
    
    if (!gl) {
        alert("Could not create WebGL context");
        return;
    }
    
    // store a reference to the canvas in the gl object
    gl.canvas = canvas;
    
    // set the viewport to be sized correctly
    gl.viewport(0,0, gl.canvas.width, gl.canvas.height);

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    //gl.enable(gl.DEPTH_TEST);
    // create program with our shaders and enable it
    gl.program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(gl.program);

    // init texture switching uniforms for texture
    gl.u_Image1 = gl.getUniformLocation(gl.program, 'u_Image1');
    gl.u_Image2 = gl.getUniformLocation(gl.program, 'u_Image2');

    gl.uniform1i(gl.u_Image1, 0);
    gl.uniform1i(gl.u_Image2, 1);

    gl.u_ImFlag1 = gl.getUniformLocation(gl.program, 'u_ImFlag1');
    gl.u_ImFlag2 = gl.getUniformLocation(gl.program, 'u_ImFlag2');

    gl.images = [];

    // create the current transform and the matrix stack right in th gl object
    gl.currentTransform = mat4();
    gl.transformStack = [];
    
    // add some method for working with the matrix stack
    gl.push = function(){
        gl.transformStack.push(gl.currentTransform);
    }
    
    gl.pop = function(){
        gl.currentTransform = gl.transformStack.pop();
    }

    return gl;
}

function animation(images, gl){

    var im1_box = document.getElementById('im1_box');
    var im2_box = document.getElementById('im2_box');

    var im1flag = im1_box.checked;
    im1_box.onchange = function(){
        im1flag = im1_box.checked;
        render_image(images, gl, im1flag, im2flag);
    }

    var im2flag = im2_box.checked;
    im2_box.onchange = function(){
        im2flag = im2_box.checked;
        render_image(images, gl, im1flag, im2flag);
    }




    var tick = function(){
       
        render_image(images, gl, im1flag, im2flag);
        requestAnimationFrame(tick);
    };
    
    tick();

}

/*
 *param: takes the gl context as a parameter
 *return: nothing
 *draws the vertices in the array buffer
 */
function render_image(images, gl, im1flag, im2flag){

    var image1 = images[0];
    var image2 = images[1];
    /*console.log("inside render_image");
    console.log("image width: ", image.width);
    console.log("image height: ", image.height);*/

    console.log("image src1: ", image1.src);
    console.log("image src2: ", image2.src);

    resize_canvas(gl, image1);

    gl.clear(gl.COLOR_BUFFER_BIT);


    create_texture(gl, image1);
    create_texture(gl, image2);

	create_texture_coords("a_TexCoord", gl);

	var u_Resolution = gl.getUniformLocation(gl.program, "u_Resolution");
    gl.uniform2f(u_Resolution, gl.canvas.width, gl.canvas.height);

    //console.log("image height: ", image.height);
    var recQuad = createRec(gl, 0, 0, image1.width, image1.height);
    //console.log("recQuad: ", recQuad);
    var positionBuffer = createBuffer(gl, gl.ARRAY_BUFFER, recQuad, "positionBuffer", gl.STATIC_DRAW);
    enableAttribute(gl, positionBuffer, "a_Position", 2, 0, 0);

    console.log("im 1 flag", im1flag);
    im1flag = (im1flag) ? 1 : 0;
    im2flag = (im2flag) ? 1 : 0;
    console.log("im 1 flag", im1flag);

    gl.uniform1i(gl.u_ImFlag1, im1flag);
    gl.uniform1i(gl.u_ImFlag2, im2flag);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

}

function resize_canvas(gl, image){
    gl.canvas.width = image.width;
    gl.canvas.height = image.height;
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
}

function createRec(gl, x, y, width, height){
    var x1 = x;
    var x2 = x + width;
    var y1 = y;
    var y2 = y + height;
    var recCoords = new Float32Array([
        x1, y1,
        x2, y1,
        x1, y2,
        x1, y2,
        x2, y1, 
        x2, y2  ]);

    return recCoords;
}

/*
 * This is helper function to create buffers.
 */
function createBuffer(gl, destination, data, name, type){
    var buffer = gl.createBuffer();
    if (!buffer) {
        console.log('Failed to create the ',name,' buffer');
        return -1;
    }
    
    gl.bindBuffer(destination, buffer);
    gl.bufferData(destination, data, type);
    return buffer;
}


/*
 * This is a new helper function to simplify enabling attributes.
 * Note that this no longer fails if the attribute can't be found. It gives us a warning, but doesn't crash.
 * This will allow us to use different shaders with different attributes.
 */ 
function enableAttribute(gl, buffer, name, size, stride, offset){
   gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
   var attribute = gl.getAttribLocation(gl.program, name);
   if (attribute >= 0) {
       gl.vertexAttribPointer(attribute, size, gl.FLOAT, false, 0,0);
       gl.enableVertexAttribArray(attribute);
   }else{
       console.log('Warning: Failed to get ',name );

   }
}


function create_texture_coords(a_TexCoord, gl){
    var texCoords = new Float32Array([
        0.0,  0.0,
        1.0,  0.0,
        0.0,  1.0,
        0.0,  1.0,
        1.0,  0.0,
        1.0,  1.0]);
    var texCoordBuffer = createBuffer(gl, gl.ARRAY_BUFFER, texCoords, "textureCoordBuffer", gl.STATIC_DRAW);
    enableAttribute(gl, texCoordBuffer, a_TexCoord, 2, 0, 0);
}

function create_texture(gl, image){
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // creating the texture so that we can use any sized image
    // (i.e. the width and height may not be powers of 2)
    // as a result unable to use features such as mip-mapping
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

    return texture;
}

function initializeTexture(gl, textureid, filename) {
    
    return new Promise(function(resolve, reject){
        var texture = gl.createTexture();
        var image = new Image();
        
    
        image.onload = function(){
            
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
            gl.activeTexture(gl.TEXTURE0 + textureid);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);


            gl.images.push(image);
            
            
            resolve();
        }
        
        image.onerror = function(error){
            reject(Error(filename));
        }
    
        image.src = filename; 
    });
}



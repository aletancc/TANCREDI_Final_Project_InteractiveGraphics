var TOTAL_MASS = 20; // Initial mass value


function updateTotalMass() {
    TOTAL_MASS = parseFloat(document.getElementById('mass').value);
    document.getElementById('mass-value').textContent = TOTAL_MASS;
    console.debug("Updated TOTAL_MASS:", TOTAL_MASS); // Print the updated TOTAL_MASS
}


var TOTAL_GRAVITY = 5; // Initial gravity value


function updateTotalGravity() {
    TOTAL_GRAVITY = parseFloat(document.getElementById('gravity').value);
    document.getElementById('gravity-value').textContent = TOTAL_GRAVITY;
    console.debug("Updated TOTAL_GRAVITY:", TOTAL_GRAVITY); // Print the updated TOTAL_GRAVITY
}


var windForce = { x: 0, y: 0, z: 0 };

function updateWindForce() {
    windForce.x = parseFloat(document.getElementById('windX').value);
    windForce.y = parseFloat(document.getElementById('windY').value);
    windForce.z = parseFloat(document.getElementById('windZ').value);
    
    document.getElementById('windXValue').textContent = windForce.x;
    document.getElementById('windYValue').textContent = windForce.y;
    document.getElementById('windZValue').textContent = windForce.z;
}



// Function to convert hex color to RGB
function hexToRgb(hex) {
    var bigint = parseInt(hex.slice(1), 16);
    var r = (bigint >> 16) & 255;
    var g = (bigint >> 8) & 255;
    var b = bigint & 255;
    return { r: r, g: g, b: b };
}



// This function takes the translation and two rotation angles (in radians) as input arguments.
// The two rotations are applied around x and y axes.
// It returns the combined 4x4 transformation matrix as an array in column-major order.
function GetModelViewMatrix( translationX, translationY, translationZ, rotationX, rotationY )
{

	var trans = [
		1, 0, 0, 0,
		0, 1, 0, 0,
		0, 0, 1, 0,
		translationX, translationY, translationZ, 1
	];
	var rotationMatrixX = [
        1, 0, 0, 0,
        0, Math.cos(rotationX), Math.sin(rotationX), 0,
        0, -Math.sin(rotationX), Math.cos(rotationX), 0,
        0, 0, 0, 1
    ];

    var rotationMatrixY = [
        Math.cos(rotationY), 0, -Math.sin(rotationY), 0,
        0, 1, 0, 0,
        Math.sin(rotationY), 0, Math.cos(rotationY), 0,
        0, 0, 0, 1
    ];

    // Combine all transformations
    var trans1 = MatrixMult(trans, rotationMatrixX);

	trans = MatrixMult(trans1, rotationMatrixY);

	var mv = trans
	return mv;
}



const vertexShaderSource = `

    uniform mat4 mv;
    uniform mat3 normalMV;
    uniform mat4 mvp;

    uniform bool show_texture;
    

    attribute vec2 texture_coordinates;
    attribute vec3 normal;
    attribute vec3 position;

	varying vec2 textureCoord;
    varying vec3 T_normal;  //  Transformed normal vector
    varying vec4 T_frag;

    uniform bool swapYZ; 


   void main()
   {
        gl_Position = mvp * vec4(position, 1);
        T_normal = normalMV * normal;
        T_frag = mv * vec4(position, 1);

        if(show_texture) { textureCoord = texture_coordinates; }
   }
   `;


const fragmentShaderSource = `

    precision highp int;
    precision mediump float;

    varying vec2 textureCoord;
    varying vec3 T_normal;  //  Transformed normal vector
    varying vec4 T_frag;

    uniform sampler2D texture;
   
	uniform bool show_texture; 
    uniform vec3 light; // Normalized (omega term; points at light). Light direction vector
    uniform float Shininess;    //  Shininess of the material: affects how sharp and concentrated the specular light appears
    
    uniform vec4 lightColor; // Added uniform for light color
    uniform vec4 KdColor;

    
    void main()
	{
        // vec4 light_color = vec4(0.0, 1.0, 0.0, 1.0);
        vec4 ambient_light_color = vec4(1.0, 1.0, 1.0, 1.0);

        float cosTheta = dot(T_normal, light);
        float geometry_term = clamp(cosTheta, 0.0, 1.0);

        //  DIFFUSE COLOR COMPONENT
        vec4 Kd;
        if(show_texture) { Kd = texture2D(texture,textureCoord); } 
        else {
            Kd = KdColor; 
        }
        vec4 diffuse = Kd * geometry_term ;

        //  SPECULAR COLOR COMPONENT
        //  Reflection: based on the normal vector and the incident light direction
        vec3 reflection = 2.0 * dot(normalize(T_normal), light) * T_normal - light;
        reflection = normalize(reflection);

        //  Direction towards the viewer
        vec3 view  = normalize(vec3(-T_frag));


        //  ANGLE BETWEEN VIEW DIRECTION AND LIGHT REFLECTION
        float cos_phi = dot(reflection, view);
        cos_phi = clamp(cos_phi, 0.0, 1.0);
        //  Ks = specular relection coefficient: controls the color and intensity of specular reflection
        //  it is directly linked to the color of the light source.
        vec4 Ks = lightColor;                                   //use light color here

        //  SPECULAR COMPONENT OF THE LIGHTING EQUATION
        vec4 specular = Ks * pow(cos_phi, Shininess);


        //  AMBIENT LIGHT COMPONENT
        vec4 ambient = Kd * ambient_light_color;

        gl_FragColor = lightColor * (diffuse + specular) + ambient;

   }`;   


const arrowVertexShaderSource = `

   attribute vec3 arrowPosition;

   uniform mat4 mv;
   uniform mat4 mvp;

   uniform bool show_forces;

   void main() {

            gl_Position = mvp * vec4(arrowPosition, 1.0);
    
   }
`;


const arrowFragmentShaderSource = `

    precision mediump float;

    uniform bool show_forces;

    void main() {


            gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0); // Red color

    }
`;


const windXArrowFragmentShaderSource = `

    precision mediump float;

    uniform bool show_forces;

    void main() {


            gl_FragColor = vec4(0.0, 1.0, 0.0, 1.0); // Green color

    }

`;


const windYArrowFragmentShaderSource = `

    precision mediump float;

    uniform bool show_forces;

    void main() {

            gl_FragColor = vec4(0.0, 0.0, 1.0, 1.0); // Blue color

    }
    `;


const windZArrowFragmentShaderSource = `

    precision mediump float;

    uniform bool show_forces;

    void main() {


            gl_FragColor = vec4(1.0, 0.0, 1.0, 1.0); // Pink color

    }

`;



class MeshDrawer {
    constructor() {

        this.prog = InitShaderProgram(vertexShaderSource, fragmentShaderSource);
        gl.useProgram(this.prog);

        this.vertexBuffer = gl.createBuffer();
        this.normalBuffer = gl.createBuffer();
        this.texture_coordinates_buffer = gl.createBuffer();
        this.numTriangles = 0;
        this.swapYZFlag = true;
        this.showTextFlag = true;

        this.posAttributeLoc = gl.getAttribLocation(this.prog, "position");
        this.normalAttributeLoc = gl.getAttribLocation(this.prog, "normal");

        this.mvUniformLoc = gl.getUniformLocation(this.prog, "mv");
        this.norMatUniformLoc = gl.getUniformLocation(this.prog, "normalMV");
        this.mvpUniformLoc = gl.getUniformLocation(this.prog, "mvp");
        this.swapUniformLoc = gl.getUniformLocation(this.prog, "swapYZ");

        this.shininessLoc = gl.getUniformLocation(this.prog, "Shininess");
        //this.lightUniformPos = gl.getUniformLocation(this.prog, "lightdirection");

        // Pointer to the shininess value
        this.alpha = document.getElementById('shininess-exp').value;
        gl.uniform1f(this.shininessLoc, this.alpha);

        // Initialize if we show the texture
        this.show_texture = gl.getUniformLocation(this.prog, 'show_texture');
        let checked = document.getElementById('show-texture').checked ? 1 : 0;
        gl.uniform1i(this.show_texture, checked);

        // Texture
        this.texture_coordinates = gl.getAttribLocation(this.prog, 'texture_coordinates');
        

        //  LIGHT DIRECTION
        // Pointer to the light direction, set default light direction
        this.light = gl.getUniformLocation(this.prog, 'light');
        this.light_direction = Array(1,1,1);    //  Default light direction
        gl.uniform3fv(this.light, this.light_direction);


        // Handle the light color
        // Retrieve the lightColor uniform location
        this.lightColorLoc = gl.getUniformLocation(this.prog, "lightColor");
        //this.setLightColor(1.0, 1.0, 1.0, 1.0); // Set default light color to white

        // Attach event listener to the color picker
        document.getElementById('lightColorPicker').addEventListener('change', () => {
            let colorHex = document.getElementById('lightColorPicker').value;
            let colorRGB = hexToRgb(colorHex);

            // Update the light color uniform in the shader
            gl.useProgram(this.prog);
            gl.uniform4f(this.lightColorLoc, colorRGB.r / 255, colorRGB.g / 255, colorRGB.b / 255, 1.0);
        });


        this.KdColorLoc = gl.getUniformLocation(this.prog, "KdColor");
        //this.setLightColor(0.0, 1.0, 0.0, 1.0); // Set default light color to white

        // Attach event listener to the color picker
        document.getElementById('ColorPicker').addEventListener('change', () => {
            let colorHex = document.getElementById('ColorPicker').value;
            let colorRGB = hexToRgb(colorHex);

            // Update the light color uniform in the shader
            gl.useProgram(this.prog);
            gl.uniform4f(this.KdColorLoc, colorRGB.r / 255, colorRGB.g / 255, colorRGB.b / 255, 1.0);
        });
 


        // Initialize if we show the force arrows
        //this.show_forces = gl.getUniformLocation(this.prog, 'show_forces');
        //this.forcesChecked = document.getElementById('show-forces').checked ? 1 : 0;
        //gl.uniform1i(this.show_forces, this.forcesChecked);

        // Gravity Arrow Shader Program
        this.arrowProg = InitShaderProgram(arrowVertexShaderSource, arrowFragmentShaderSource);

        // Gravity Arrow Buffer
        this.arrowBuffer = gl.createBuffer();
        this.arrowVertices = new Float32Array([0, 0, 0, 0, -1, 0]); // Gravity arrow points down in y-direction
        
        this.updateArrowVertices();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.arrowBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.arrowVertices, gl.DYNAMIC_DRAW);

        this.arrowPosAttributeLoc = gl.getAttribLocation(this.arrowProg, "arrowPosition");

        this.arrowMVPLoc = gl.getUniformLocation(this.arrowProg, "mvp");


        // Wind X Arrow Shader Program
        this.windXArrowProg = InitShaderProgram(arrowVertexShaderSource, windXArrowFragmentShaderSource);

        // Wind X Arrow Buffer
        this.windXArrowBuffer = gl.createBuffer();
        this.windXArrowVertices = new Float32Array([0, 0, 0, 1, 0, 0]); // Initial arrow points in x-direction
        this.updateArrowVertices();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.windXArrowBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.windXArrowVertices, gl.DYNAMIC_DRAW);

        this.windXArrowPosAttributeLoc = gl.getAttribLocation(this.windXArrowProg, "arrowPosition");
        this.windXArrowMVPLoc = gl.getUniformLocation(this.windXArrowProg, "mvp");


        // Wind Y Arrow Shader Program
        this.windYArrowProg = InitShaderProgram(arrowVertexShaderSource, windYArrowFragmentShaderSource);

        // Wind Y Arrow Buffer
        this.windYArrowBuffer = gl.createBuffer();
        this.windYArrowVertices = new Float32Array([0, 0, 0, 0, 1, 0]); // Initial arrow points in y-direction
        this.updateArrowVertices();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.windYArrowBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.windYArrowVertices, gl.DYNAMIC_DRAW);

        this.windYArrowPosAttributeLoc = gl.getAttribLocation(this.windYArrowProg, "arrowPosition");
        this.windYArrowMVPLoc = gl.getUniformLocation(this.windYArrowProg, "mvp");

        // Wind Z Arrow Shader Program
        this.windZArrowProg = InitShaderProgram(arrowVertexShaderSource, windZArrowFragmentShaderSource);

        // Wind Z Arrow Buffer
        this.windZArrowBuffer = gl.createBuffer();
        this.windZArrowVertices = new Float32Array([0, 0, 0, 0, 0, 1]); // Initial arrow points in z-direction
        this.updateArrowVertices();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.windZArrowBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.windZArrowVertices, gl.DYNAMIC_DRAW);

        this.windZArrowPosAttributeLoc = gl.getAttribLocation(this.windZArrowProg, "arrowPosition");
        this.windZArrowMVPLoc = gl.getUniformLocation(this.windZArrowProg, "mvp");

    }


    setMesh(vertPos, texCoords, normals) {

        gl.useProgram(this.prog);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);

        // Texture
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texture_coordinates_buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);
        

        this.numTriangles = vertPos.length / 3;


        this.positions = [];
        for (let i = 0; i < vertPos.length; i += 3) {
            this.positions.push(new Vec3(vertPos[i], vertPos[i + 1], vertPos[i + 2]));
        }
        this.velocities = Array(this.positions.length).fill(0).map(() => new Vec3(0, 0, 0));

 
    }

    swapYZ(swap) {

        this.swapYZFlag = swap;
        gl.useProgram(this.prog);
        gl.uniform1i(this.swapUniformLoc, this.swapYZFlag ? 1 : 0);
    }


    draw(matrixMVP, matrixMV, matrixNormal) {

        gl.useProgram(this.prog);

        gl.uniformMatrix4fv(this.mvUniformLoc, false, matrixMV);
        gl.uniformMatrix3fv(this.norMatUniformLoc, false, matrixNormal);
        gl.uniformMatrix4fv(this.mvpUniformLoc, false, matrixMVP);

        // Set the light direction
        gl.uniform3fv(this.light, this.light_direction);

        // Set the alpha term of specular highlighting (aka 'shininess')
        gl.uniform1f(this.shininessLoc, this.alpha);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.vertexAttribPointer(this.posAttributeLoc, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.posAttributeLoc);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.vertexAttribPointer(this.normalAttributeLoc, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.normalAttributeLoc);

        // Set the texture coordinates array, and attribute pointer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texture_coordinates_buffer);
        gl.vertexAttribPointer(this.texture_coordinates, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.texture_coordinates);
	
        gl.drawArrays(gl.TRIANGLES, 0, this.numTriangles);


        //  DRAW THE FORCES ONLY IF THE CHECKBOX show-forces IS CHECKED
        this.forcesChecked = document.getElementById('show-forces').checked ? 1 : 0;

        if (this.forcesChecked == 1) {
        // Draw the Gravity Arrow
        
        gl.useProgram(this.arrowProg);

        // Update arrow vertices if necessary
        this.updateArrowVertices();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.arrowBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.arrowVertices, gl.DYNAMIC_DRAW);

        gl.enableVertexAttribArray(this.arrowPosAttributeLoc);
        gl.vertexAttribPointer(this.arrowPosAttributeLoc, 3, gl.FLOAT, false, 0, 0);

        gl.uniformMatrix4fv(this.arrowMVPLoc, false, matrixMVP);

        // Draw the arrow
        gl.drawArrays(gl.LINES, 0, 2); // Assuming the arrow is represented as a line segment



        // Draw the Wind X Arrow
        gl.useProgram(this.windXArrowProg);
        this.updateArrowVertices(); // Update vertices if necessary
        gl.bindBuffer(gl.ARRAY_BUFFER, this.windXArrowBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.windXArrowVertices, gl.DYNAMIC_DRAW);

        gl.enableVertexAttribArray(this.windXArrowPosAttributeLoc);
        gl.vertexAttribPointer(this.windXArrowPosAttributeLoc, 3, gl.FLOAT, false, 0, 0);

        gl.uniformMatrix4fv(this.windXArrowMVPLoc, false, matrixMVP);
        gl.drawArrays(gl.LINES, 0, 2);


        // Draw the Wind Y Arrow
        gl.useProgram(this.windYArrowProg);
        this.updateArrowVertices();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.windYArrowBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.windYArrowVertices, gl.DYNAMIC_DRAW);
        gl.enableVertexAttribArray(this.windYArrowPosAttributeLoc);
        gl.vertexAttribPointer(this.windYArrowPosAttributeLoc, 3, gl.FLOAT, false, 0, 0);
        gl.uniformMatrix4fv(this.windYArrowMVPLoc, false, matrixMVP);
        gl.drawArrays(gl.LINES, 0, 2);

        // Draw the Wind Z Arrow
        gl.useProgram(this.windZArrowProg);
        this.updateArrowVertices();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.windZArrowBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.windZArrowVertices, gl.DYNAMIC_DRAW);
        gl.enableVertexAttribArray(this.windZArrowPosAttributeLoc);
        gl.vertexAttribPointer(this.windZArrowPosAttributeLoc, 3, gl.FLOAT, false, 0, 0);
        gl.uniformMatrix4fv(this.windZArrowMVPLoc, false, matrixMVP);
        gl.drawArrays(gl.LINES, 0, 2);

        }
    }


    setTexture(img) {
  
        gl.useProgram(this.prog);

        // Create and bind the texture
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);

        // Set texture parameters
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

        // Upload the image into the texture
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);

        // Generate mipmaps
        gl.generateMipmap(gl.TEXTURE_2D);

        // Activate the 0th Texture Unit and bind the texture
        gl.activeTexture(gl.TEXTURE0);
        gl.uniform1i(gl.getUniformLocation(this.prog, 'texture'), 0);

	}
    

    showTexture(show) {
        
        gl.useProgram(this.prog);

        // Ensure this.show_texture is correctly set up as a uniform location
        if (this.show_texture === -1) {
            console.error('show_texture uniform location not found in shader program.');
            return;
        }
    
        // Set the uniform based on the show argument
        gl.uniform1i(this.show_texture, show ? 1 : 0);
    
        // Check for errors
        let error = gl.getError();
        if (error !== gl.NO_ERROR) {
            console.error('Error setting show_texture uniform:', error);
        }
    }

    setLightDir(x, y, z) {

        //  Update the light direction
        this.light_direction = Array(x,y,z); 

        // Set the updated light direction in the shader
        gl.uniform3fv(this.light, this.light_direction);

    }

    setShininess(shininess) {

        this.alpha = shininess;
    }

    setLightColor(r, g, b, a) {
        gl.useProgram(this.prog);
        gl.uniform4f(this.lightColor, r, g, b, a);
    }


    updateArrowVertices() {

        // Set arrow position at the left bottom corner of the object
        let arrowBase = new Vec3(-2, +1, 0); // Adjust as needed
        let arrowTip = new Vec3(-2, +1 - (TOTAL_MASS * TOTAL_GRAVITY * 0.005), 0); 
        // Update arrow vertices
        this.arrowVertices = new Float32Array([
            arrowBase.x, arrowBase.y, arrowBase.z,
            arrowTip.x, arrowTip.y, arrowTip.z
        ]);


        // Wind X Arrow (wind force in x direction) at the left bottom corner
        let windXArrowTip = new Vec3(-2 + (windForce.x * 1), +1, 0); 
        this.windXArrowVertices = new Float32Array([
            arrowBase.x, arrowBase.y, arrowBase.z,
            windXArrowTip.x, windXArrowTip.y, windXArrowTip.z
        ]);


        // Wind Y Arrow (wind force in y direction) at the left bottom corner
        let windYArrowTip = new Vec3(-2, +1 + (windForce.y * 1), 0);
        this.windYArrowVertices = new Float32Array([
            arrowBase.x, arrowBase.y, arrowBase.z,
            windYArrowTip.x, windYArrowTip.y, windYArrowTip.z
        ]);

        // Wind Z Arrow (wind force in z direction) at the left bottom corner
        let windZArrowTip = new Vec3(-2, +1, (windForce.z * 1));
        this.windZArrowVertices = new Float32Array([
            arrowBase.x, arrowBase.y, arrowBase.z,
            windZArrowTip.x, windZArrowTip.y, windZArrowTip.z
        ]);


    }

}


// This function is called for every step of the simulation.
// Its job is to advance the simulation for the given time step duration dt.
// It updates the given positions and velocities.
function SimTimeStep(dt, positions, velocities, springs, stiffness, damping, particleMass, gravity, restitution) {

    console.debug("TOTAL_MASS:", TOTAL_MASS); // Print the current value of TOTAL_MASS

    console.debug("TOTAL_GRAVITY:", TOTAL_GRAVITY); // Print the current value of TOTAL_GRAVITY

    console.debug("check_forces:", this.forcesChecked);
    
    var forces = Array(positions.length).fill(0).map(() => new Vec3(0, 0, 0)); // The total force per particle

    // Compute the total force for each particle
    for (let spring of springs) {
        let p0 = spring.p0;
        let p1 = spring.p1;
        let restLength = spring.rest;

        let pos0 = positions[p0];
        let pos1 = positions[p1];

        // Compute the displacement vector, its length, and its direction
        let delta = pos1.sub(pos0);
        let dist = delta.len();
        let direction = delta.unit();

        // Spring force: Hooke's Law (F = -k * (dist - restLength) * direction)
        let springForce = direction.mul(stiffness * (dist - restLength));

        // Damping force: F = -d * (v1 - v0) * direction
        let vel0 = velocities[p0];
        let vel1 = velocities[p1];
        let relativeVelocity = vel1.sub(vel0);
        let dampingForce = direction.mul(damping * relativeVelocity.dot(direction));

        // Apply forces to the particles
        forces[p0].inc(springForce.add(dampingForce));
        forces[p1].dec(springForce.add(dampingForce));
    }

    // Apply gravity force to all particles
    let gravityForce = gravity.mul(particleMass);
    for (let i = 0; i < positions.length; i++) {
        forces[i].inc(gravityForce);
    }

    // Apply wind force to all particles
    let windForceVec = new Vec3(windForce.x, windForce.y, windForce.z);
    for (let i = 0; i < positions.length; i++) {
        forces[i].inc(windForceVec);
    }


    // Update positions and velocities using semi-implicit Euler method
    for (let i = 0; i < positions.length; i++) {
       
        // Apply spring forces, damping, and other forces as needed...

        // Update velocity
       let acceleration = forces[i].div(particleMass);
        velocities[i].inc(acceleration.mul(dt));

        // Update position
        positions[i].inc(velocities[i].mul(dt));

        // Handle collisions with the bounding box
        for (let axis of ['x', 'y', 'z']) {
            if (positions[i][axis] < -1) {
                positions[i][axis] = -1;
                velocities[i][axis] *= -restitution;
            } else if (positions[i][axis] > 1) {
                positions[i][axis] = 1;
                velocities[i][axis] *= -restitution;
            }
        }
    }



    let arrowBase = new Vec3(-0.3, -0.1, 0); // Adjust as needed
    let arrowTip = new Vec3(-0.3, -0.1, 0); // Adjust arrow length as needed
    
    // Update arrow vertices
    MeshDrawer.arrowVertices = new Float32Array([
        arrowBase.x, arrowBase.y, arrowBase.z,
        arrowTip.x, arrowTip.y, arrowTip.z
    ]);
    gl.bindBuffer(gl.ARRAY_BUFFER, meshDrawer.arrowBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, meshDrawer.arrowVertices);



    // Attach the updateTotalMass function to the input event
    document.getElementById('mass').addEventListener('input', updateTotalMass);

    window.onload = function() {
    updateTotalMass(); // Set the initial mass value
    }

    // Attach the updateTotalGravity function to the input event
    document.getElementById('gravity').addEventListener('input', updateTotalGravity);

    window.onload = function() {
    updateTotalGravity(); // Set the initial gravity value
    };


    document.getElementById('windX').addEventListener('input', updateWindForce);
    document.getElementById('windY').addEventListener('input', updateWindForce);
    document.getElementById('windZ').addEventListener('input', updateWindForce);

    window.onload = function() {
        updateTotalMass(); // Set the initial mass value
        updateTotalGravity(); // Set the initial gravity value
        updateWindForce(); // Set the initial wind force values
    };


    document.getElementById('show-forces').addEventListener('change', () => {
        meshDrawer.forcesChecked = document.getElementById('show-forces').checked ? 1 : 0;
        gl.useProgram(meshDrawer.prog);
        gl.uniform1i(meshDrawer.show_forces, meshDrawer.forcesChecked);
    });





}



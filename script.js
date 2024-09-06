// Import necessary components
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import gsap from '../node_modules/gsap/index.js';


// Initialize the scene
const scene = new THREE.Scene();

// Create and add the AxesHelper
const axesHelper = new THREE.AxesHelper(5); // The size of the axes
// scene.add(axesHelper);


// Variables to store the corridor boundaries
const corridorMinX = -50;
const corridorMaxX = 50;

// BACKGROUND
// Load the texture
const loader = new THREE.TextureLoader();
loader.load('/img/watercolor-galaxy-background/6481298.jpg', (texture) => {
    // Set the texture as the scene's background
    scene.background = texture;
});




/////////////////////////////////////////////////////////////////////////////////////////////
// OBSTACLE BOXES
/////////////////////////////////////////////////////////////////////////////////////////////
// Global array to store boxes and their movement direction
let boxes = [];

class Box {
  constructor(width, height, depth, position, isMoving = false, movementRange = null, speed = 0) {
    this.geometry = new THREE.BoxGeometry(width, height, depth);
    this.material = new THREE.MeshStandardMaterial({ color: 0x0000ff }); // BLue color
    this.mesh = new THREE.Mesh(this.geometry, this.material);

    // Set initial position
    this.mesh.position.copy(position);

    // Add the box to the scene
    scene.add(this.mesh);

    // Movement properties
    this.isMoving = isMoving;
    this.movementRange = movementRange;
    this.speed = speed;
    this.direction = movementRange ? (movementRange.max > position.x ? 1 : -1) : 0;
  }

  update() {
    if (this.isMoving) {
      // Move the box back and forth based on direction and speed
      this.mesh.position.x += this.speed * this.direction;

      // Check if the box has reached the target position
      if ((this.direction === 1 && this.mesh.position.x >= this.movementRange.max) ||
          (this.direction === -1 && this.mesh.position.x <= this.movementRange.min)) {
        // Reverse direction
        this.direction *= -1;
      }
    }
  }
}

// Initialize the boxes
const initializeBoxes = () => {
  // Box 1: Moving from -50 to 0
  const box1 = new Box(15, 90, 10, new THREE.Vector3(-50, 0, -300), true, { min: -50, max: -15 }, 0.2);
  boxes.push(box1);

  // Box 2: Moving from 50 to 0
  const box2 = new Box(15, 90, 10, new THREE.Vector3(50, 0, -300), true, { min: 15, max: 50 }, 0.5);
  boxes.push(box2);

  // Box 3: Moving from 50 to -50
  const box3 = new Box(15, 90, 10, new THREE.Vector3(50, 0, -610), true, { min: -50, max: 50 }, 0.6);
  boxes.push(box3);

  // Box 4: Static
  const box4 = new Box(15, 90, 10, new THREE.Vector3(0, 0, -890));
  boxes.push(box4);

  // Box 5: Moving from -50 to 50
  const box5 = new Box(15, 90, 10, new THREE.Vector3(-50, 0, -1180), true, { min: -50, max: 50 }, 0.2);
  boxes.push(box5);

  // Box 6: Moving from 50 to 0
  const box6 = new Box(15, 90, 10, new THREE.Vector3(50, 0, -1400), true, { min: 15, max: 50 }, 0.3);
  boxes.push(box6);

  // Box 7: Moving from -50 to 0
  const box7 = new Box(15, 90, 10, new THREE.Vector3(-50, 0, -1400), true, { min: -50, max: -15 }, 0.3);
  boxes.push(box7);

  // Box 8: Moving from 30 to -30
  const box8 = new Box(15, 90, 10, new THREE.Vector3(30, 0, -1750), true, { min: -30, max: 30 }, 0.5);
  boxes.push(box8);

  // Box 9: Static
  const box9 = new Box(15, 90, 10, new THREE.Vector3(-50, 0, -2000));
  boxes.push(box9);

  // Box 10: Static
  const box10 = new Box(15, 90, 10, new THREE.Vector3(50, 0, -2000));
  boxes.push(box10);

  const box11 = new Box(15, 90, 10, new THREE.Vector3(-50, 0, -2330), true, { min: -50, max: -15 }, 0.2);
  boxes.push(box11);

  // Box 12: Moving from 50 to 0
  const box12 = new Box(15, 90, 10, new THREE.Vector3(50, 0, -2330), true, { min: 15, max: 50 }, 0.5);
  boxes.push(box12);

  // Box 13: Moving from 50 to -50
  const box13 = new Box(15, 90, 10, new THREE.Vector3(50, 0, -2510), true, { min: -50, max: 50 }, 0.6);
  boxes.push(box13);

  // Box 14: Static
  const box14 = new Box(15, 90, 10, new THREE.Vector3(0, 0, -2700));
  boxes.push(box14);

  // Box 15: Moving from 50 to 0
  const box15 = new Box(15, 90, 10, new THREE.Vector3(50, 0, -3350), true, { min: 15, max: 50 }, 0.3);
  boxes.push(box15);

  // Box 7: Moving from -50 to 0
  const box16 = new Box(15, 90, 10, new THREE.Vector3(-50, 0, -3350), true, { min: -50, max: -15 }, 0.3);
  boxes.push(box16);
};

// Call this function after your scene is set up to add the boxes
initializeBoxes();




/////////////////////////////////////////////////////////////////////////////////////////////
// STAR MODEL (TA)
/////////////////////////////////////////////////////////////////////////////////////////////

// Initialize SPACESHIP MODEL (the 3d model include only one star)
// Load star model
let starModel = null;
const starloader = new GLTFLoader();
starloader.load('/static/coin/scene.gltf', (gltf) => {
  starModel = gltf.scene;
  starModel.scale.set(3, 3, 3);

  // Modify material properties to make stars lighter
  starModel.traverse((child) => {
    if (child.isMesh) {
      child.material.emissive = new THREE.Color(0xFFD700); // Make the stars emit light
      child.material.emissiveIntensity = 0.5; // Adjust intensity
     // child.material.color = new THREE.Color(0xFFFF00); 
    }
  });

  // Create and position stars after model is loaded
  createAndPositionStars();
}, undefined, (error) => {
  console.error(error);
});

// Array to store star clones
const starModels = [];

// Function to create and position stars
const createAndPositionStars = () => {
  if (!starModel) return;

  const starPositions = [
  
    new THREE.Vector3(30, 0, -180),
    new THREE.Vector3(-5, 0, -400),
    new THREE.Vector3(10, 0, -500),
    new THREE.Vector3(-33, 0, -700),
    new THREE.Vector3(-1, 0, -850),
    new THREE.Vector3(40, 0, -910),
    new THREE.Vector3(15, 0, -1110),
    new THREE.Vector3(-23, 0, -1250),
    new THREE.Vector3(-40, 0, -1400),
    new THREE.Vector3(+13, 0, -1620),
    new THREE.Vector3(0, 0, -1710),
    new THREE.Vector3(40, 0, -1800),
    new THREE.Vector3(1, 0, -2000)
  ];

  starPositions.forEach(position => {
    const starClone = starModel.clone();
    starClone.position.copy(position);
    starClone.scale.set(3,3,3); // Make the stars smaller by scaling down
  
    scene.add(starClone);
    starModels.push(starClone);
  });
  initializeStarBoundingBoxes(); // Initialize bounding boxes for stars
};


// Array to store star bounding boxes
const starBoundingBoxes = [];

// Function to initialize star bounding boxes
const initializeStarBoundingBoxes = () => {
  starModels.forEach((star) => {
    starBoundingBoxes.push(new THREE.Box3().setFromObject(star));
  });
};

const updateStarBoundingBoxes = () => {
  starModels.forEach((star, index) => {
    starBoundingBoxes[index].setFromObject(star);
  });
};





/////////////////////////////////////////////////////////////////////////////////////////////
// ASTEROIDS MODEL
/////////////////////////////////////////////////////////////////////////////////////////////


// Global array to store asteroids
let asteroids = [];
// Global array to store asteroid bounding boxes
let asteroidBoundingBoxes = [];

const initializeBoundingBoxes = () => {
  asteroids.forEach((asteroid) => {
    asteroidBoundingBoxes.push(new THREE.Box3().setFromObject(asteroid));
  });
};

// Initialize ASTEROIDS MODEL
let asteroidPackModel = null;
const asteroidLoader = new GLTFLoader();

asteroidLoader.load('/static/asteroids_pack_metallic_version/scene.gltf', (gltfScene) => {
  asteroidPackModel = gltfScene.scene;

  // Scale and position the asteroid pack
  asteroidPackModel.scale.set(2, 2, 2);

  asteroidPackModel.traverse((child) => {
    if (child.isMesh) {
      child.scale.set(2, 2, 2);
      child.material.emissive = new THREE.Color(0x333333);
      child.material.emissiveIntensity = 0.5;
      child.material = child.material.clone(); // Clone the material
      //child.material.transparent = true;
      //child.material.opacity = 1; // Set initial opacity to fully visible

      asteroids.push(child);
    }
  });

  console.log(asteroids.length);

  // Initialize positions and bounding boxes
  initializeBoundingBoxes();


  // Manually set positions for each asteroid
  const asteroidPositions = [
    new THREE.Vector3(-20, 380, 0),
    new THREE.Vector3(25, 530, 0),
    new THREE.Vector3(-10, 620, 0),
    new THREE.Vector3(0, 810, 0),
    new THREE.Vector3(-20, 930, 0),
    new THREE.Vector3(30, 1080, 0),
    new THREE.Vector3(10, 1280, 0),
    new THREE.Vector3(-3, 1390, 0),
    new THREE.Vector3(10, 1500, 0),
    new THREE.Vector3(2, 1600, 0)
  ];

  // Check if there are enough positions for all asteroids
  if (asteroids.length <= asteroidPositions.length) {
    asteroids.forEach((asteroid, index) => {
      const position = asteroidPositions[index];
      asteroid.position.set(position.x, position.y, position.z);
    });
  } else {
    console.warn('More asteroids than positions. Some asteroids will not be placed.');
  }

  // Add the asteroid pack to the scene
  scene.add(asteroidPackModel);
}, undefined, (error) => {
  console.error('An error occurred while loading the asteroid pack model:', error);
});



/////////////////////////////////////////////////////////////////////////////////////////////
// SPACESHIP MODEL
/////////////////////////////////////////////////////////////////////////////////////////////


// Initialize SPACESHIP MODEL
let spaceshipModel = null;
const gltfLoader = new GLTFLoader();
gltfLoader.load('/static/star_destroyer/scene.gltf', (gltfScene) => {
  spaceshipModel = gltfScene.scene;
  spaceshipModel.scale.set(0.3, 0.3, 0.3);
  scene.add(spaceshipModel);
});

/////////////////////////////////////////////////////////////////////////////////////////////
// LIGHT
/////////////////////////////////////////////////////////////////////////////////////////////

// Initialize light
const light = new THREE.AmbientLight(0xffffff, 1);
scene.add(light);


const pointLight = new THREE.PointLight(0xffffff, 1.2);
pointLight.position.set(5, 5, 5);
scene.add(pointLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(10, 10, 10);
directionalLight.castShadow = true;
scene.add(directionalLight);


/////////////////////////////////////////////////////////////////////////////////////////////
// CAMERA
/////////////////////////////////////////////////////////////////////////////////////////////

// Initialize the camera
const camera = new THREE.PerspectiveCamera(
  50,
  window.innerWidth / window.innerHeight,
  0.1,
  10000
);

// Set an initial offset for the camera from the spaceship
const cameraOffset = new THREE.Vector3(0, 2, 8);
camera.position.copy(cameraOffset);

// Initialize the renderer
const canvas = document.querySelector("canvas.threejs");
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
});
renderer.setSize(window.innerWidth, window.innerHeight);

// Antialiasing
const maxPixelRatio = Math.min(window.devicePixelRatio, 2);
renderer.setPixelRatio(maxPixelRatio);

// CONTROLS
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

// Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});


/////////////////////////////////////////////////////////////////////////////////////////////
// SPACESHIP MOVEMENT
/////////////////////////////////////////////////////////////////////////////////////////////

// Variables to store which keys are currently pressed
const keysPressed = {
  ArrowUp: false,
  ArrowDown: false,
  ArrowLeft: false,
  ArrowRight: false
};

//const forwardSpeed = 1; // Constant speed in the negative z direction
let moveSpeed = 1; // Speed for movement along the x and y axes

// UP= 38, DOWN= 40, LEFT= 37, RIGHT= 39
// Event listeners for keydown and keyup
window.addEventListener('keydown', (event) => {
  if (event.ctrlKey && event.key === 'ArrowUp') {
    createLaser(); // Shoot a laser when Ctrl + ArrowUp is pressed
  }

  if (keysPressed.hasOwnProperty(event.key)) {
    keysPressed[event.key] = true;
  }
});

window.addEventListener('keyup', (event) => {
  if (keysPressed.hasOwnProperty(event.key)) {
    keysPressed[event.key] = false;
  }
});


// SPACESHIP MOVEMENT

// Function to handle spaceship movement with constraints
const updateSpaceshipMovement = () => {
  if (spaceshipModel) {
    // Determine if the spaceship is within the tunnel's z range
    let currentZ = spaceshipModel.position.z;
    let effectiveMoveSpeed = moveSpeed;


  

    // Initialize movement direction vector
    let moveDirection = new THREE.Vector3(0, 0, -effectiveMoveSpeed); // Constant forward movement in negative z

    // Check which keys are pressed and adjust the movement direction
    if (keysPressed.ArrowUp) {
      moveDirection.z -= effectiveMoveSpeed; // Move forward faster
    }
    if (keysPressed.ArrowDown) {
      moveDirection.z += effectiveMoveSpeed; // Slow down forward movement
    }
    if (keysPressed.ArrowLeft) {
      moveDirection.x -= effectiveMoveSpeed; // Move left (negative x)
    }
    if (keysPressed.ArrowRight) {
      moveDirection.x += effectiveMoveSpeed; // Move right (positive x)
    }

    // Calculate the new position of the spaceship
    let newPosition = spaceshipModel.position.clone().add(moveDirection);

    // Constrain the new position within the corridor's x range
    newPosition.x = Math.max(corridorMinX, Math.min(corridorMaxX, newPosition.x));

    // Apply the constrained position to the spaceship model
    spaceshipModel.position.copy(newPosition);

    // Smoothly rotate the spaceship around the z-axis based on left/right movement
    let targetRotationZ = THREE.MathUtils.lerp(
      spaceshipModel.rotation.z,
      keysPressed.ArrowLeft ? 0.15 : keysPressed.ArrowRight ? -0.15 : 0,
      0.1
    );
    spaceshipModel.rotation.z = targetRotationZ;

    // Keep the spaceship level on the y-axis
    spaceshipModel.position.y = 0;
  }
};



///////////////////////////////////////////////////////////////////
// TRAIL EFFECT
///////////////////////////////////////////////////////////////////

// Generate random particles
const particleArray = [];


class Particle {
  constructor() {
    var scale = 30 + Math.random() * 30;
    var nLines = 5 + Math.floor(Math.random() * 5);
    var nRows = 5 + Math.floor(Math.random() * 5);
    this.geometry = new THREE.SphereGeometry(scale, nLines, nRows);
    this.material = new THREE.MeshLambertMaterial({
      color: 0xe3e3e3,
      transparent: true,
    });
    this.mesh = new THREE.Mesh(this.geometry, this.material);
  }
}



const getParticle = () => {
  let p;
  if (particleArray.length){
    p = particleArray.pop();
  } else {
    p = new Particle();
  }
  return p;
}

// Initialize two trails for the smoke effect
const trail1 = new THREE.Object3D();
const trail2 = new THREE.Object3D();
const trail3 = new THREE.Object3D();
scene.add(trail1);
scene.add(trail2);
scene.add(trail3);


function updateTrailPositions() {

  if(spaceshipModel){
  const spaceshipPosition = spaceshipModel.position;

  trail1.position.set(
    spaceshipPosition.x + 0.71,  // Offset in X direction
    spaceshipPosition.y,        // Same as spaceship's Y position
    spaceshipPosition.z         // Same as spaceship's Z position
  );

  trail2.position.set(
    spaceshipPosition.x - 0.71,  // Offset in X direction
    spaceshipPosition.y,        // Same as spaceship's Y position
    spaceshipPosition.z         // Same as spaceship's Z position
  );

  trail3.position.set(
    spaceshipPosition.x,        // Same as spaceship's X position
    spaceshipPosition.y,        // Same as spaceship's Y position
    spaceshipPosition.z         // Same as spaceship's Z position
  );
}}

const createTrailSmoke = () => {
  let p1 = getParticle();
  let p2 = getParticle();
  let p3 = getParticle();


  dropParticleFromTrail(p1, trail1);
  dropParticleFromTrail(p2, trail2);
  dropParticleFromTrail(p3, trail3);
  
};

const dropParticleFromTrail = (p, trail) => {
  scene.add(p.mesh);

  // Set the initial position of the particle to match the trail's position
  p.mesh.position.copy(trail.position);

  // Set the scale and opacity for the particle
  var s = Math.random() * 0.2 + 0.35;
  p.mesh.material.opacity = 1;
  p.mesh.scale.set(s * 0.001, s * 0.001, s * 0.001);

  // Animate the scale and position of the particle
  gsap.to(p.mesh.scale, {
    duration: 1,
    x: s * 0.005,
    y: s * 0.005,
    z: s * 0.005,
    ease: "power3.inOut",
  });
  gsap.to(p.mesh.position, {
    duration: 1,
    z: trail.position.z + 6, // Move the particle along the z-axis relative to the trail
    ease: "none",
    onComplete: recycleParticle,
    onCompleteParams: [p],
  });

  // Animate the opacity of the particle
  gsap.to(p.mesh.material, {
    duration: 1,
    opacity: 0,
    ease: "none",
  });
};

const recycleParticle = (p) => {
  p.mesh.rotation.x = Math.random() * Math.PI * 2;
  p.mesh.rotation.y = Math.random() * Math.PI * 2;
  p.mesh.rotation.z = Math.random() * Math.PI * 2;
  particleArray.push(p);
}




///////////////////////////////////////////////////////////////////
// FIRE EFFECT
//////////////////////////////////////////////////////////////////

// Function to create the fire effect
const createFireEffect = () => {
  let p = getFireParticle();
  dropFireParticle(p);
};

// Generate random particles
const fireParticleArray = [];

class FireParticle {
  constructor() {
    var scale = 20 + Math.random() * 20;
    var nLines = 5 + Math.floor(Math.random() * 5);
    var nRows = 5 + Math.floor(Math.random() * 5);
    this.geometry = new THREE.SphereGeometry(scale, nLines, nRows);

    this.material = new THREE.MeshBasicMaterial({
      map: new THREE.TextureLoader().load('/img/fire.png'),
      transparent: true,
      color: new THREE.Color(0xFFAA66), // Light orange tint
      blending: THREE.AdditiveBlending,
      opacity: 0.2, // Set initial opacity to maximum
      //alphaTest: 0.5,
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);
  }
}

const getFireParticle = () => {
  let p;
  if (fireParticleArray.length) {
    p = fireParticleArray.pop();
  } else {
    p = new FireParticle();
  }
  return p;
};

const dropFireParticle = (p) => {
  scene.add(p.mesh);

  // Set the initial position of the particle to match the spaceship's position
  p.mesh.position.x = spaceshipModel.position.x;
  p.mesh.position.y = spaceshipModel.position.y;
  p.mesh.position.z = spaceshipModel.position.z;

  // Calculate the direction towards the camera
  const directionToCamera = new THREE.Vector3();
  directionToCamera.subVectors(camera.position, p.mesh.position).normalize();

  // Set the scale and opacity for the particle
  var s = Math.random(0.2) + 0.35;
  p.mesh.material.opacity = 1; // Ensure opacity starts at 1
  p.mesh.scale.set(s * 0.001, s * 0.001, s * 0.001);

  // Animate the scale of the particle
  gsap.to(p.mesh.scale, {
    duration: 2,
    x: s * 0.5,
    y: s * 0.5,
    z: s * 0.5,
    ease: "power3.inOut",
  });

  // Animate the position of the particle towards the camera
  gsap.to(p.mesh.position, {
    duration: 2,
    // x: p.mesh.position.x + directionToCamera.x * 5, // Move towards the camera
    // y: p.mesh.position.y + directionToCamera.y * 2, // Move towards the camera
    z: p.mesh.position.z + 3, // Move towards the camera
    ease: "none",
    //onComplete: recycleFireParticle,
    onCompleteParams: [p],
  });

  // Animate the opacity of the particle
  gsap.to(p.mesh.material, {
    duration: 2,
    opacity: 0.02, // Decrease opacity less to make the fire appear more dense
    ease: "none",
  });
};

/////////////////////////////////////////////////////////////////////////////////////////////
// COLLISION DETECTION
/////////////////////////////////////////////////////////////////////////////////////////////
let lives = 3;

// Global variable to store the spaceship bounding box
const spaceshipBoundingBox = new THREE.Box3();

const updateBoundingBoxes = () => {
  spaceshipBoundingBox.setFromObject(spaceshipModel);
  asteroids.forEach((asteroid, index) => {
    asteroidBoundingBoxes[index].setFromObject(asteroid);
  });
  boxes.forEach(box => {
    box.boundingBox = new THREE.Box3().setFromObject(box.mesh);
  });
};

let starCount = 0;
const collidedStars = new Set(); // Set to track collided stars

let isCollisionDetected = false; // Flag to track if a collision has been processed

const checkCollision = () => {
  if (spaceshipModel) {
    // Update bounding boxes
    updateBoundingBoxes();
    updateStarBoundingBoxes();

    // Check for spaceship-asteroid collisions
    asteroids.forEach((asteroid, index) => {
      if (spaceshipBoundingBox.intersectsBox(asteroidBoundingBoxes[index])) {
        createFireEffect();
        moveSpeed = 0;
        handleCollision();
        console.log('Collision detected with asteroid!');
      }
    });



    // Check for spaceship-box collisions
    boxes.forEach(box => {
      if (spaceshipBoundingBox.intersectsBox(box.boundingBox)) {
        if (!isCollisionDetected) {
          // Collision with a box detected
          moveSpeed = 0;
          isGameOver = true;
          lives--;

          console.log("Collision Detected with Box at position", spaceshipModel.position);
          
          //displayCollisionDetected();


          // Update hearts visibility based on remaining lives
          if (lives === 2) {
            livesIcon_3.style.display = 'none'; // Hide the third heart icon
          } else if (lives === 1) {
            livesIcon_2.style.display = 'none'; // Hide the second heart icon
          } else if (lives <= 0) {
            livesIcon_1.style.display = 'none'; // Hide the first heart icon
          }

          // Prevent further collisions from being processed
          isCollisionDetected = true;

          // Delay the reset of the game by 2 seconds
          setTimeout(() => {
            if (lives <= 0) {
              displayGameOver();
              isGameOver = true;
            } else {
              isGameOver = false;
              resetGame();
            }
            // Reset the collision flag after the timeout
            isCollisionDetected = false;
          }, 1000); // 2000 milliseconds = 2 seconds
        }
      }
    });


    

    // Check for spaceship-star collisions
    starModels.forEach((star, index) => {
      if (spaceshipBoundingBox.intersectsBox(starBoundingBoxes[index])) {
          if (!collidedStars.has(index)) {
              collidedStars.add(index); // Mark this star as collided
              handleStarCollision(starModels[index]); // Pass the star model to the function
          }
      }
  });
  }
};



const handleStarCollision = (star) => {
  starCount++;
  updateStarCountDisplay(); // Update the display when a star is collided
  console.log(`Star Collision detected! Total stars collided: ${starCount}`);

  // Create a PointLight to simulate the star emitting light rays
  const pointLight = new THREE.PointLight(0xFFFF00, 100, 1000); // Yellow light with high intensity
  pointLight.position.copy(star.position);
  scene.add(pointLight); // Add the light to the scene

  // Add a PointLightHelper to visualize the light
  const pointLightHelper = new THREE.PointLightHelper(pointLight, 10); // Adjust the size of the helper
  //scene.add(pointLightHelper);


  // Animate the light's intensity to create a flashing effect
  const flashDuration = 0.9; // Duration of the flashing effect in seconds
  const flashInterval = 0.1; // Time between flashes
  const maxIntensity = 10; // Maximum intensity
  const minIntensity = 1; // Minimum intensity

  let elapsed = 0;
  let dissolveElapsed = 0;

  const flashAnimation = () => {
      elapsed += flashInterval;
      dissolveElapsed += flashInterval;

      // Update the light intensity to create a flashing effect
      pointLight.intensity = Math.sin(elapsed * Math.PI * 2 / flashDuration) * (maxIntensity - minIntensity) / 2 + (maxIntensity + minIntensity) / 2;

      if (dissolveElapsed < flashDuration) {
          requestAnimationFrame(flashAnimation); // Continue the animation
          scene.remove(star);
      } else {
          // Remove the star, light, and helper after dissolving
          scene.remove(star);
          scene.remove(pointLight);
          scene.remove(pointLightHelper);
          console.log('Star, light, and helper removed from scene');
      }
  };

  flashAnimation(); // Start the flashing and dissolving effect
};



// Function to update the star count display
const updateStarCountDisplay = () => {
  const starCountElement = document.getElementById('starCount');
  if (starCountElement) {
    starCountElement.textContent = starCount;
  }
};






let isGameOver = false; // Add this flag


const handleCollision = () => {
  // Continue rendering for a short period to ensure the fire effect is visible
  setTimeout(() => {
    // Hide the spaceship and display the Game Over message
    // Stop the game loop
    
    spaceshipModel.visible = false;
    // Display the game over message
    displayGameOver();
    isGameOver = true;
    
  }, 2000); // Adjust the delay as needed to fit the fire effect duration

};



// Function to display game over message
const displayGameOver = () => {
  const gameOverText = document.createElement('div');
  gameOverText.innerText = "GAME OVER";
  gameOverText.style.position = 'absolute';
  gameOverText.style.top = '35%';
  gameOverText.style.left = '50%';
  gameOverText.style.transform = 'translate(-50%, -50%)';
  gameOverText.style.fontSize = '80px';
  gameOverText.style.color = '#D30000';
  document.body.appendChild(gameOverText);
};


// Example function to reset the game
const resetGame = () => {
  // Reset spaceship position
  spaceshipModel.position.set(0, 0, 0);
  spaceshipModel.visible = true;
  moveSpeed = 1; // Reset movement speed

  // Remove particles or reset other game elements
  ///particleArray.forEach(p => scene.remove(p.mesh));
  //fireParticleArray.forEach(p => scene.remove(p.mesh));

  // Optionally remove game over text
  const gameOverText = document.querySelector('div');
  if (gameOverText) {
    document.body.removeChild(gameOverText);
  }

  // Restart animation or game loop
  animate();
};



// Function to display game over message
const displayWin = () => {
  const WinText = document.createElement('div');
  WinText.innerText = "WIN!";
  WinText.style.position = 'absolute';
  WinText.style.top = '30%';
  WinText.style.left = '50%';
  WinText.style.transform = 'translate(-50%, -50%)';
  WinText.style.fontSize = '100px';
  WinText.style.color = '#00ff0dd2';
  document.body.appendChild(WinText);
};


// Function to display collision detected message
const displayCollisionDetected = () => {
  const collisionText = document.createElement('div');
  
  // Use backticks for template literals
  collisionText.innerText = `Lives remaining: ${lives}`; 
  
  collisionText.style.position = 'absolute';
  collisionText.style.top = '20%';
  collisionText.style.left = '50%';
  collisionText.style.transform = 'translate(-50%, -50%)';
  collisionText.style.fontSize = '80px';
  collisionText.style.color = '#fbff00';
  collisionText.style.zIndex = '1000'; // Ensure it's on top of other elements
  
  document.body.appendChild(collisionText);

  // Remove the text after a few seconds
  setTimeout(() => {
    collisionText.remove();
  }, 2000); // Adjust the duration as needed
};








/////////////////////////////////////////////////////////////////////////////////////////////
// LASER
/////////////////////////////////////////////////////////////////////////////////////////////

// Global array to store active lasers and their bounding boxes
let lasers = [];
let laserBoundingBoxes = [];

// Function to create a laser beam with glow
const createLaser = () => {
  if (starCount <= 0) {
    console.log('No lasers available!');
    return; // Exit if no stars are available
  }

  // Create the laser beam (inner cylinder)
  const laserGeometry = new THREE.CylinderGeometry(0.4, 0.4, 20, 32);
  const laserMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // Red color for the laser
  const laser = new THREE.Mesh(laserGeometry, laserMaterial);

  // Position the laser slightly in front of the spaceship
  const laserOffset = new THREE.Vector3(0, 0, -10); // Adjust the z-offset to move the laser forward
  laser.position.copy(spaceshipModel.position).add(laserOffset);
  laser.rotation.x = Math.PI / 2; // Rotate the laser so it points forward (along the z-axis)

  // Create the outer glow (transparent cylinder)
  const glowGeometry = new THREE.CylinderGeometry(0.5, 0.5, 20, 32);
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: 0xFFFF00,
    transparent: true,
    opacity: 0.3
  });
  const glow = new THREE.Mesh(glowGeometry, glowMaterial);
  glow.position.copy(laser.position);
  glow.rotation.x = laser.rotation.x; // Match the rotation of the laser

  // Add both laser and glow to the scene
  scene.add(laser);
  scene.add(glow);

  // Create bounding box for the laser
  const laserBoundingBox = new THREE.Box3().setFromObject(laser);
  lasers.push({ laser, glow, laserBoundingBox });

  // Animate the laser and its glow with a fade-out effect
  gsap.to(laser.position, {
    duration: 1,
    z: laser.position.z - 500,
    onUpdate: () => {
      glow.position.copy(laser.position); // Update glow position
      laserBoundingBox.setFromObject(laser); // Update bounding box position
    },
    onComplete: () => {
      // Remove the laser and its bounding box after the animation
      scene.remove(laser);
      scene.remove(glow);
      lasers = lasers.filter(l => l.laser !== laser);
    }
  });

  // Decrease the star counter since emitting a laser beam consumes a star
  starCount--;
  updateStarCountDisplay(); // Update the display when a laser beam is emitted
};


// collision between laser and asteroid animation
// RED LIGHT (as the laser beam color) ON THE ASTEROID
// Function to create the red light at the collision point
const createCollisionLight = (position) => {
  //console.log("Creating collision light at position:", position);

  // Create a red point light with higher intensity and sufficient distance
  const light = new THREE.PointLight(0xff0000, 50, 50); // Color, Intensity, Distance
  light.position.copy(position); // Set the light's position to the collision point
  scene.add(light); // Add the light to the scene

  //console.log("Light added to the scene:", light);

  // Animate the light intensity (fade-out effect)
  gsap.to(light, {
    duration: 1, // Duration for the light to fade out
    intensity: 0,  // Final intensity (fade out to 0)
    ease: "power2.inOut",
    onComplete: () => {
  //    console.log("Removing light from scene:", light);
      scene.remove(light); // Remove the light from the scene
    }
  });
};


const shrinkAndDissolveAsteroid = (asteroid) => {
 // console.log('Shrinking and dissolving asteroid:', asteroid);

  const initialPosition = asteroid.getWorldPosition(new THREE.Vector3());
  const initialRotation = asteroid.rotation.clone();
  const initialScale = asteroid.scale.clone();
  const initialOpacity = asteroid.material.opacity !== undefined ? asteroid.material.opacity : 1;

  asteroid.position.set(initialPosition.x, initialPosition.y, initialPosition.z);
  asteroid.rotation.copy(initialRotation);
  asteroid.updateMatrix();

  gsap.to(asteroid.scale, {
    //delay: 1, // Increased delay to ensure the light effect is visible
    duration: 1, // Duration of the shrinking effect in seconds
    x: 0.001,  // Final scale factor for x (shrink)
    y: 0.001,  // Final scale factor for y (shrink)
    z: 0.001,  // Final scale factor for z (shrink)
    ease: "power2.inOut",
    onUpdate: () => {
      if (asteroid.material) {
        const scaleFactor = asteroid.scale.x / initialScale.x;
        asteroid.material.opacity = Math.max(0, initialOpacity * scaleFactor);
        asteroid.material.transparent = true;
        asteroid.material.needsUpdate = true;
      }
    },
    onComplete: () => {
      scene.remove(asteroid);
      const index = asteroids.indexOf(asteroid);
      if (index > -1) {
        asteroids.splice(index, 1);
        asteroidBoundingBoxes.splice(index, 1);
      }
    //  console.log('Dissolving completed for asteroid:', asteroid);
    }
  });
};



const checkLaserCollisions = () => {
  lasers.forEach(({ laser, laserBoundingBox }, laserIndex) => {
    asteroids.forEach((asteroid, asteroidIndex) => {
      if (laserBoundingBox.intersectsBox(asteroidBoundingBoxes[asteroidIndex])) {
   //     console.log('Asteroid hit by laser:', asteroid);

        // Calculate the collision point (approximate)
        const collisionPoint = laser.position.clone();

        // Create the red collision light at the exact collision point
        createCollisionLight(collisionPoint);

        // Start the shrinking and dissolving effect after a short delay
        setTimeout(() => {
          shrinkAndDissolveAsteroid(asteroid);
        }, 50); // Delay of 0.5 seconds to allow the light effect to show first

        // Remove the laser from the scene
        scene.remove(laser);
        scene.remove(lasers[laserIndex].glow);

   //     console.log('Asteroid should be removed:', asteroid);

        // Remove asteroid and laser from their arrays
        asteroids.splice(asteroidIndex, 1);
        asteroidBoundingBoxes.splice(asteroidIndex, 1);
        lasers.splice(laserIndex, 1);
      }
    });
  });
};


let gameStatus = null; // Possible values: 'inactive', 'active', 'lost'


// Define the countdown duration (e.g., 5 minutes = 300 seconds)
const countdownDuration = 7; // in seconds
let timeRemaining = countdownDuration;

// Get the countdown element
const countdownElement = document.getElementById('countdown-display');

// Function to format time as seconds or "GO!"
const formatTime = (seconds) => {
  if (seconds > 0) {
      return seconds.toString();
  } else {
      return 'GO!';
  }
};

// Function to update the countdown display
const updateCountdownDisplay = () => {
    countdownElement.textContent = `${formatTime(timeRemaining)}`;
};

// Start the countdown
const startCountdown = () => {
    updateCountdownDisplay(); // Display initial time

    const countdownInterval = setInterval(() => {
        if (timeRemaining > 0) {
            timeRemaining--;
            updateCountdownDisplay();
            gameStatus = 'inactive';
            moveSpeed = 0;
        } else {
          gameStatus = 'active';
          moveSpeed = 1;
          countdownElement.textContent = ''; // Clear the display when time is up
            clearInterval(countdownInterval);

        }
    }, 1000); // Update every second
};

// Start the countdown when the script runs
startCountdown();



/////////////////////////////////////////////////////////////////////////////////////////////
// ANIMATE
/////////////////////////////////////////////////////////////////////////////////////////////


// Animate function
const animate = () => {

  if (isGameOver) return; // Stop the loop if the game is over


  // Update spaceship movement
  updateSpaceshipMovement();

 // Update spaceship and trails
  updateTrailPositions();
  if(gameStatus == 'inactive'){
  createTrailSmoke();
  }

  // Update the camera position
  if (spaceshipModel) {

    camera.position.x = spaceshipModel.position.x + cameraOffset.x;
    camera.position.y = spaceshipModel.position.y + cameraOffset.y;
    camera.position.z = spaceshipModel.position.z + cameraOffset.z;
  
    // Make the camera look at the spaceship
    camera.lookAt(spaceshipModel.position);

    // Ensure the spaceship does not rotate the camera
    controls.target.copy(spaceshipModel.position);
  }

    // Update box positions based on their properties
  // Update each box's movement
  boxes.forEach(box => box.update());

  // Rotate stars
  starModels.forEach(star => {
    star.rotation.y += 0.02; // Adjust rotation speed as needed
  });
  
  // Check for collisions
  checkCollision(); // Check spaceship-asteroid collisions
  checkLaserCollisions(); // Check laser-asteroid collisions


  // WIN
  if (spaceshipModel.position.z <= -3340){
    displayWin();
  }



  controls.update();
  renderer.render(scene, camera);

  requestAnimationFrame(animate);

};




// Initialize the start screen and game start logic
window.addEventListener('DOMContentLoaded', () => {
  const startScreen = document.querySelector('.start-screen');
  const startButton = document.querySelector('.start-button');
  const canvas = document.querySelector('.threejs');
  const livesIcon_1 = document.getElementById('livesIcon_1');
  const livesIcon_2 = document.getElementById('livesIcon_2');
  const livesIcon_3 = document.getElementById('livesIcon_3');
  const coinIcon = document.getElementById('coinIcon');
  const starCountContainer = document.getElementById('starCountContainer');
  

  startButton.addEventListener('click', () => {
    // Hide the start screen and show the Three.js canvas
    startScreen.style.display = 'none';
    canvas.style.display = 'block';
    coinIcon.style.display = 'block';
    livesIcon_1.style.display = 'block';
    livesIcon_2.style.display = 'block';
    livesIcon_3.style.display = 'block';
    starCountContainer.style.display = 'flex'; // Use 'flex' to match the CSS display property

    // Start the animation loop
    animate();
    //startCountdown();
  });
});


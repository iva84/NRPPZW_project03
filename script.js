/* ENUMS */

// enum for asteroid path
const PathEnum = {
  CN: "cn",
  CP: "cp",
  NC: "nc",
  PC: "pc",
  PN: "pn",
  NP: "np",
  PP: "pp",
  NN: "nn",
};

// enum for player move
const KeyCode = {
  LEFT: 37,
  UP: 38,
  RIGHT: 39,
  DOWN: 40,
};

/* COMPONENTS */
var myGameArea;
var stars = [];
var asteroids = [];
var player = null;

/* ANIMATION SETTINGS */
var backgroundSound = new Audio("assets/hyperspace.mp3");
var collisionSound = new Audio("assets/explosion1.mp3");
var startTime;
var endTime;
var gameAreaFrameId;
var starsAnimationId;

/* CONSTANTS */
const BEST_DURATION = "bestDuration";
const STAR_SPEED = 0.5;
const ASTEROIDS_NO = 5;
const PLAYER_SIZE = 80;

/* EVENTS */

// key press event
document.onkeydown = checkKey;
function checkKey(e) {
  e = e || window.event;
  if (e.keyCode === KeyCode.LEFT) {
    player.move(KeyCode.LEFT);
  } else if (e.keyCode === KeyCode.UP) {
    player.move(KeyCode.UP);
  } else if (e.keyCode === KeyCode.RIGHT) {
    player.move(KeyCode.RIGHT);
  } else if (e.keyCode === KeyCode.DOWN) {
    player.move(KeyCode.DOWN);
  }
}

// resize window event
window.addEventListener("resize", function () {
  myGameArea.clear();

  if (gameAreaFrameId) {
    cancelAnimationFrame(gameAreaFrameId);
  }
  if (starsAnimationId) {
    cancelAnimationFrame(starsAnimationId);
  }

  myGameArea.canvas.width = window.innerWidth;
  myGameArea.canvas.height = window.innerHeight;

  stars = [];
  createStars();
  updateStars();

  // show start container
  let startContainer = document.querySelector(".start-container");
  startContainer.style.display = "flex";
});

function createStars() {
  for (let i = 0; i < myGameArea.canvas.height; i++) {
    let rnd = Math.random() * myGameArea.canvas.width;
    let star = new starComponent(rnd, i);
    stars.push(star);
  }
}

function createAsteroids() {
  for (let i = 0; i < ASTEROIDS_NO; i++) {
    createAsteroid();
  }
}

function createAsteroid() {
  let asteroid = new asteroidComponent();
  asteroids.push(asteroid);
}

function createPlayer() {
  player = new playerComponent();
}

// game definition
myGameArea = {
  initGame: function () {
    this.canvas = document.getElementById("canvas");
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.context = this.canvas.getContext("2d");
    stars = [];
    createStars();
    updateStars();
  },
  start: function () {
    // remove init stars animation
    if (starsAnimationId) {
      cancelAnimationFrame(starsAnimationId);
    }

    // create components
    stars = [];
    asteroids = [];
    player = null;
    createStars();
    createAsteroids();
    createPlayer();

    // start animation
    updateGameArea();
  },
  stop: function () {
    // play collision sound
    collisionSound.play();

    showResult();
    cancelAnimationFrame(gameAreaFrameId);
    //let startContainer = document.querySelector(".start-container");
    //startContainer.style.display = "flex";

    // stop and reset background sound and collision sound
    backgroundSound.pause();
    backgroundSound.currentTime = 0;
    collisionSound.currentTime = 0;
  },
  clear: function () {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  },
};

// on load page
function initGame() {
  myGameArea.initGame();
}

// on game start
function startGame() {
  // start background sound
  backgroundSound.play();

  // hide start container
  let startContainer = document.querySelector(".start-container");
  startContainer.style.display = "none";

  // start game
  myGameArea.start();
  startTime = Date.now();
}

function starComponent(x, y) {
  const rnd = Math.random() + 0.5;
  this.width = rnd;
  this.height = rnd;
  this.speed_x = STAR_SPEED;
  this.x = x;
  this.y = y;

  this.update = function () {
    ctx = myGameArea.context;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(this.width / -2, this.height / -2, this.width, this.height);
    ctx.restore();
  };

  this.newPos = function () {
    if (this.x - this.width < 0) {
      this.speed_x = STAR_SPEED;
    } else if (this.x + this.width >= myGameArea.canvas.width) {
      this.speed_x = -STAR_SPEED;
      this.x = 0;
    }
    this.x += this.speed_x;
  };
}

function asteroidComponent() {
  // width and height
  const dimension = Math.floor(Math.random() * 30) + 20;
  this.width = dimension;
  this.height = dimension;

  // x, y and path (based on init point)
  const startPosition = createStartPosition(
    Math.floor(Math.random() * 8) + 1,
    dimension
  );
  this.x = startPosition.x;
  this.y = startPosition.y;
  this.path = startPosition.path;
  //this.path = findPath(startPosition.x, startPosition.y);

  // speed
  this.speed = Math.random() * 3 + 1;

  // updates asteroid
  this.update = function () {
    ctx = myGameArea.context;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "yellow";
    ctx.shadowBlur = 50;
    ctx.fillRect(this.width / -2, this.height / -2, this.width, this.height);
    ctx.restore();
  };

  console.log(
    `path=${this.path} x=${this.x} y=${this.y} width=${this.width} height=${this.height}`
  );

  // calculates if collision is detected between current asteroid and player
  this.checkCollision = function () {
    // we need to substract width/2 and height/2 becouse of centering player and asteroids
    return (
      this.x - this.width / 2 < player.x + player.width - player.width / 2 &&
      this.x + this.width - this.width / 2 > player.x - player.width / 2 &&
      this.y - this.height / 2 < player.y + player.height - player.height / 2 &&
      this.y + this.height - this.height / 2 > player.y - player.height / 2
    );
  };

  // calculates new position of asteroid based on path (init start point)
  this.newPos = function () {
    if (this.path === PathEnum.NN) {
      this.x += this.speed;
      this.y += this.speed;
    } else if (this.path === PathEnum.PN) {
      this.x -= this.speed;
      this.y += this.speed;
    } else if (this.path === PathEnum.CN) {
      this.x += 0.5 * this.speed;
      this.y += this.speed;
    } else if (this.path === PathEnum.NP) {
      this.x += this.speed;
      this.y -= this.speed;
    } else if (this.path === PathEnum.PP) {
      this.x -= this.speed;
      this.y -= this.speed;
    } else if (this.path === PathEnum.CP) {
      this.x -= 0.5 * this.speed;
      this.y -= this.speed;
    } else if (this.path === PathEnum.NC) {
      this.x += this.speed;
      this.y += 0.5 * this.speed;
    } else if (this.path === PathEnum.PC) {
      this.x -= this.speed;
      this.y -= 0.5 * this.speed;
    }
  };

  // calculates if asteroid is away of screen
  this.isAsteroidGone = function () {
    return (
      this.x < -1 * this.width * 2 ||
      this.x > myGameArea.canvas.width + 1 ||
      this.y < -1 * this.height * 2 ||
      this.y > myGameArea.canvas.height + 1
    );
  };
}

// player component
function playerComponent() {
  this.width = PLAYER_SIZE;
  this.height = PLAYER_SIZE;

  this.x = myGameArea.canvas.width / 2;
  this.y = myGameArea.canvas.height / 2;

  this.update = function () {
    ctx = myGameArea.context;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.fillStyle = "red";
    ctx.shadowColor = "yellow";
    ctx.shadowBlur = 20;
    ctx.fillRect(this.width / -2, this.height / -2, this.width, this.height);
    ctx.restore();
  };

  this.move = function (direction) {
    if (direction === KeyCode.LEFT) {
      if (this.x - this.width / 2 > 0) {
        this.x -= this.width / 2;
      } else {
        this.x = this.width / 2; // translate
      }
      console.log("left", this.x, this.y, this.width, this.height);
    } else if (direction === KeyCode.UP) {
      if (this.y - this.height / 2 > 0) {
        this.y -= this.height / 2;
      } else {
        this.y = this.height / 2; // translate
      }
      console.log("up", this.x, this.y, this.width, this.height);
    } else if (direction === KeyCode.RIGHT) {
      if (this.x + this.width < myGameArea.canvas.width) {
        this.x += this.width / 2;
      } else {
        this.x = myGameArea.canvas.width - this.width / 2; // translate
      }
      console.log("right", this.x, this.y, this.width, this.height);
    } else if (direction === KeyCode.DOWN) {
      if (this.y + this.height < myGameArea.canvas.height) {
        this.y += this.height / 2;
      } else {
        this.y = myGameArea.canvas.height - this.height / 2; // translate
      }
      console.log("down", this.x, this.y, this.width, this.height);
    }
  };
}

function createStartPosition(idx, dimension) {
  let x;
  let y;
  let path;

  console.log(
    `----------\ncanvas: ${myGameArea.canvas.width} ${myGameArea.canvas.height} dim=${dimension}`
  );
  switch (idx) {
    case 1:
      // left up corner
      x = -1.5 * dimension;
      y = -1.5 * dimension;
      path = PathEnum.NN;
      break;
    case 2:
      // right down corner
      x = myGameArea.canvas.width;
      y = myGameArea.canvas.height;
      path = PathEnum.PP;
      break;
    case 3:
      // left down corner
      x = -1.5 * dimension;
      y = myGameArea.canvas.height;
      path = PathEnum.NP;
      break;
    case 4:
      // right up corner
      x = myGameArea.canvas.width;
      y = -1.5 * dimension;
      path = PathEnum.PN;
      break;
    case 5:
      // left
      x = -1.5 * dimension;
      y = Math.floor(Math.random() * (myGameArea.canvas.height - dimension));
      path = PathEnum.NC;
      break;
    case 6:
      // right
      x = myGameArea.canvas.width;
      y = Math.floor(Math.random() * (myGameArea.canvas.height - dimension));
      path = PathEnum.PC;
      break;
    case 7:
      // up
      x = Math.floor(Math.random() * (myGameArea.canvas.width - dimension));
      y = -1.5 * dimension;
      path = PathEnum.CN;
      break;
    case 8:
      // down
      x = Math.floor(Math.random() * (myGameArea.canvas.width - dimension));
      y = myGameArea.canvas.height;
      path = PathEnum.CP;
      break;
    default:
      x = -1.5 * dimension;
      y = -1.5 * dimension;
      path = PathEnum.NN;
      break;
  }

  console.log(`calculated(${idx}): ${x} ${y} ${path}`);
  return { x: x, y: y, path: path };
}

function updateStars() {
  starsFrameId = requestAnimationFrame(updateStars);
  myGameArea.clear();
  stars.forEach((star) => {
    star.newPos();
    star.update();
  });
}

function updateGameArea() {
  gameAreaFrameId = requestAnimationFrame(updateGameArea);

  // clear frame
  myGameArea.clear();

  // update stars position
  stars.forEach((star) => {
    star.newPos();
    star.update();
  });

  // remove asteroid if gone
  asteroids = asteroids.filter((asteroid) => !asteroid.isAsteroidGone());

  // create new asteroids
  if (asteroids.length < ASTEROIDS_NO) {
    createAsteroid();
  }

  // update asteroids position
  asteroids.forEach((asteroid) => {
    asteroid.newPos();
    asteroid.update();
  });

  // update player
  player.update();

  // check is collision detected
  asteroids.forEach((asteroid) => {
    if (asteroid.checkCollision()) {
      endTime = Date.now();
      console.log("Kolizija!");
      myGameArea.stop();
    }
  });
}

function showResult() {
  console.log("Animation stopped");

  // calculate duration
  let duration = endTime - startTime;

  // fetch best time if exist
  let storage = window.localStorage;
  let best = storage.getItem(BEST_DURATION);

  // container for display
  let startContainer = document.querySelector(".start-container");

  // hide start button
  startContainer.children[0].style.display = "none";

  // create message
  let message = document.createElement("p");
  if (best == null || (best && duration > Number(best))) {
    // set new best time
    storage.setItem(BEST_DURATION, duration);
    message.innerHTML = `Duration: ${
      duration / 1000
    } seconds.<br/>Congrats! You have best duration.`;
  } else {
    // this is not best time
    message.innerHTML = `Duration: ${
      duration / 1000
    } seconds.<br/>Best duration: ${best / 1000} seconds`;
  }

  // display message
  startContainer.appendChild(message);

  // display ok button
  let okBtn = document.createElement("button");
  startContainer.appendChild(okBtn);
  okBtn.id = "ok-btn";
  okBtn.textContent = "OK";

  // display
  startContainer.style.display = "flex";

  // add event when ok btn clicked display only start btn
  let startBtn = document.getElementById("start-btn");
  okBtn.onclick = (e) => {
    message.style.display = "none";
    okBtn.style.display = "none";
    startBtn.style.display = "flex";
  };
}

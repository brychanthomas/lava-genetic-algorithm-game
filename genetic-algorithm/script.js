//class to set up a moving lava river with a rock, update its
//position, turn it on and off and check if it is safe
class Lava {
  constructor(y, game) {
    this.image1 = game.add.image(Math.floor(Math.random() * 401)-200, y, "lava1");
    this.image1.setScale(6);
    this.image2 = game.add.image(this.image1.x+this.image1.displayWidth, y, "lava2");
    this.image2.setScale(6);
    this.rockImage = game.add.image(Math.floor(Math.random() * 401), y, "rock");
    this.rockImage.setScale(6);
    this.speed = 4;
    this._activated = true;
    this.game = game;
  }

  //move the lava
  update() {
    if (this._activated) {
    //move both sprites right
      this.image1.x = this.image1.x + this.speed;
      this.image2.x = this.image2.x + this.speed;
      //if one sprite is beyond visible edge, move it to the other side
      if (this.image1.x-(this.image1.displayWidth/2) > 400) {
        this.image1.x = this.image2.x-this.image1.displayWidth;
      } else if (this.image2.x-(this.image2.displayWidth/2) > 400) {
        this.image2.x = this.image1.x-this.image2.displayWidth;
      }
      //move rock
      this.rockImage.x = this.rockImage.x + this.speed;
      //if rock beyond visible edge move it to the other side
      if (this.rockImage.x - (this.rockImage.displayWidth/2) > 400) {
        this.rockImage.x = -this.rockImage.displayWidth/2 - Math.floor(Math.random() * 301);
      }
    }
    //this has been disabled in this version - not all of the agents
    //will be in the same position so we can't really move the lava
    //depending on where the camera is. Instead we just create extra
    //lavas above the screen at the start.

    //if the lava is off the bottom of the screen
    //if (this.y - this.image1.displayHeight/2 > this.game.cameras.main.midPoint.y+300) {
    //  this.y = this.game.cameras.main.midPoint.y - 360;
    //  return true; //return true if moved from bottom to top (so active state can be randomised)
    //}
    //return false;
  }

  //check if it is safe for the player to stand on the lava
  //(whether the rock is under their x coordinate)
  checkIfSafe() {
    if (200 > this.rockImage.x-this.rockImage.displayWidth/2 && 200 < this.rockImage.x+this.rockImage.displayWidth/2) {
      return true
    }
    return false || !this._activated;
  }

  //turn the lava on or off (determines whether it moves and
  //whether it is always safe)
  set activated(active) {
    active = Boolean(active);
    this.rockImage.visible = active;
    this.image1.visible = active;
    this.image2.visible = active;
    this._activated = active;
  }

  get activated() {
    return this._activated;
  }

  set y(y) {
    this.image1.y = y;
    this.image2.y = y;
    this.rockImage.y = y;
  }

  get y() {
    return this.image1.y;
  }

  get rockX() {
    return this.rockImage.x;
  }
}

//class to manage the lava objects - creates them with random
//activation states, moves them all, checks if the player is
//safe wherever they are standing, randomly changes their
//activations when the game restarts and sets their speeds
class LavaManager {
  constructor(game) {
    this.lavaSlots = [];
    this.lavaSlots.push(new Lava(-600, game));
    this.lavaSlots[0].activated = false;
    for (let y=540; y>=-1380; y-=60) {
      this.lavaSlots.push(new Lava(y, game));
      this.lavaSlots[this.lavaSlots.length-1].activated = Math.random() >= 0.5;
      if (this.lavaSlots[this.lavaSlots.length-2].activated) {
        this.lavaSlots[this.lavaSlots.length-1].activated = false;
      }
    }
    this.lavaSlots[3].activated = false; //deactivate lava where player spawns
  }

  //move all of the lava rivers (so that they seem to be flowing)
  update() {
    for (let i=0; i<this.lavaSlots.length; i++) {
      this.lavaSlots[i].update();
      //lavas don't move to top in this version, they stay at their y coordinate
      //if (movedToTop) {
        //this.lavaSlots[i].activated = Math.random() >= 0.5;
        //if (this.lavaSlots[(i+1) % 12].activated) {
        //  //if neighbour is activated, deactivate
        //  this.lavaSlots[i].activated = false;
        //}
      //}
    };
  }

  //check if the player is safe where they are standing
  checkIfPlayerSafe(playerY) {
    for (let lava of this.lavaSlots) {
      if (playerY === lava.y && !lava.checkIfSafe()) {
        return false;
      }
    }
    return true;
  }

  //randomly activate or deactivate the lava rivers
  restart(playerY) {
    this.lavaSlots[0].activated = false;
    for (let i=1; i<this.lavaSlots.length; i++) {
      this.lavaSlots[i].activated = Math.random() >= 0.5;
      if (this.lavaSlots[i-1].activated) {
        this.lavaSlots[i].activated = false;
      }
      if (this.lavaSlots[i].y === playerY) {
        this.lavaSlots[i].activated = false;
      }
    }
  }

  //set the speed of the lava rivers
  setSpeed(speed) {
    this.lavaSlots.forEach(function(lava) {
      lava.speed = speed;
    });
  }

  checkIfGrass(y) {
    for (let i=0; i<this.lavaSlots.length; i++) {
      if (this.lavaSlots[i].y === y) {
        return !this.lavaSlots[i].activated;
      }
    }
    return true;
  }

  getRockX(y) {
    for (let i=0; i<this.lavaSlots.length; i++) {
      if (this.lavaSlots[i].y === y) {
        return this.lavaSlots[i].rockX;
      }
    }
  }

}

//class to create player sprite, move them up and store
//whether they are dead or not
class Player {
  constructor(game) {
    this.sprite = game.add.sprite(200, 420, "circle");
    this.sprite.setScale(0.4); //make it appear smaller
    this.sprite.depth = 9;
    this.game = game;
    this.dead = false;
  }

  //move player sprite up
  moveUp() {
    if (!this.dead) {
      this.sprite.y -= 60;
    }
  }

  get y() {
    return this.sprite.y;
  }

}

var config = { //create configuration for game
  type: Phaser.CANVAS,
  width: 400, //size of window
  height: 600,
  pixelArt: true, //prevents pixel art from being blurred when scaled
  scene: {
    preload: preload,
    create: create,
    update: update
  }
};

var game = new Phaser.Game(config); //create the game object

//initialise global variables
var lavas;
var gameOverText, scoreText;
var score = 0;
var ga;

function preload () { //this function loads images before the game starts
  //each image is given a name that is used to refer to it later on
  this.load.image("circle", "assets/circle.png");
  this.load.image("lava1", "assets/lava1.png");
  this.load.image("lava2", "assets/lava2.png");
  this.load.image("rock", "assets/rock.png");
}

function create () { //this function creates sprites at the start of the game
  lavas = new LavaManager(this);
  ga = new GeneticAlgorithm(50, 0.3, lavas, this);

  infoText = this.add.text(0, -40, "Generation: 0\nBest: 0", {
    fontFamily: "Arial",
    fontSize: 25
  });
  infoText.depth = 10;

  this.cameras.main.setBackgroundColor("#99ff66");

}

function update () { //this function runs every frame
  lavas.update();
  infoText.y = this.cameras.main.midPoint.y- 250;
  infoText.text = "Generation: "+ga.generation+"\nBest: "+ga.bestFitness;
}

class Lava {
  constructor(y, game) {
    this.image1 = game.add.image(Math.floor(Math.random() * 401)-200, y, 'lava1');
    this.image1.setScale(6);
    this.image2 = game.add.image(this.image1.x+this.image1.displayWidth, y, 'lava2');
    this.image2.setScale(6);
    this.rockImage = game.add.image(Math.floor(Math.random() * 401), y, 'rock');
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
    //if it's off the bottom edge of the screen
    if (this.y - this.image1.displayHeight/2 > this.game.cameras.main.midPoint.y+300) {
      this.y = this.game.cameras.main.midPoint.y - 360;
      return true; //return true if moved from bottom to top (so active state can be randomised)
    }
    return false;
  }

  //check if it is safe for the player to stand on the lava
  //(whether the rock is under their x coordinate)
  checkIfSafe() {
    if (200 > this.rockImage.x-this.rockImage.displayWidth/2 && 200 < this.rockImage.x+this.rockImage.displayWidth/2) {
      return true
    }
    return false || !this._activated;
  }

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
}

class LavaManager {
  constructor(game) {
    this.lavaSlots = [];
    this.lavaSlots.push(new Lava(-60, game));
    for (let y=0; y<=600; y=y+60) {
      this.lavaSlots.push(new Lava(y, game));
      this.lavaSlots[this.lavaSlots.length-1].activated = Math.random() >= 0.5;
      if (this.lavaSlots[this.lavaSlots.length-2].activated) {
        this.lavaSlots[this.lavaSlots.length-1].activated = false;
      }
    }
    this.lavaSlots[8].activated = false; //deactivate lava where player spawns
  }

  update() {
    this.lavaSlots.forEach(function(lava, index) {
      let movedToTop = lava.update();
      if (movedToTop) {
        lava.activated = Math.random() >= 0.5;
        if (this.lavaSlots[(index+1) % 12].activated) {
          //if neighbour is activated, deactivate
          lava.activated = false;
        }
      }
    }.bind(this));
  }

  checkIfPlayerSafe(playerY) {
    for (let lava of this.lavaSlots) {
      if (playerY === lava.y && !lava.checkIfSafe()) {
        return true;
      }
    }
    return false;
  }

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

  setSpeed(speed) {
    this.lavaSlots.forEach(function(lava) {
      lava.speed = speed;
    });
  }

}

class Player {
  constructor(game) {
    this.sprite = game.add.sprite(200, 420, 'circle');
    this.sprite.setScale(0.4); //make it appear smaller
    this.sprite.depth = 9;
    this.game = game;
    this.dead = false;
  }

  moveUp() {
    if (!this.dead) {
      this.sprite.y -= 60;
    }
  }

  get y() {
    return this.sprite.y;
  }

  get x() {
    return this.sprite.x;
  }

}

var config = { //create configuration for game
  type: Phaser.CANVAS,
  width: 400, //size of window
  height: 600,
  pixelArt: true,
  scene: {
    preload: preload,
    create: create,
    update: update
  }
};

var game = new Phaser.Game(config); //create the game object

//initialise global variables
var player;
var lavas; //list to store the 10 lava objects
var dead = false;
var gameOverText, scoreText;
var score = 0;

function preload () { //this function loads images before the game starts
  //each image is given a name that is used to refer to it later on
  this.load.image('circle', 'assets/circle.png');
  this.load.image('lava1', 'assets/lava1.png');
  this.load.image('lava2', 'assets/lava2.png');
  this.load.image('rock', 'assets/rock.png');
}

function create () { //this function creates sprites at the start of the game
  player = new Player(this);
  lavas = new LavaManager(this);

  gameOverText = this.add.text(50, 300, 'GAME OVER\nPress R to respawn', {
    fontFamily: 'Arial',
    fontSize: 35,
    align: 'center'
  });
  gameOverText.depth = 10;
  gameOverText.visible = false;

  scoreText = this.add.text(0, -40, 'Score: 0', {
    fontFamily: 'Arial',
    fontSize: 25
  });
  scoreText.depth = 10;

  this.cameras.main.setBackgroundColor('#99ff66');

  this.input.keyboard.on('keydown-SPACE', spacePressed);
  this.input.keyboard.on('keydown-R', restart);

}

function update () { //this function runs every frame
  if (!player.dead) {
    lavas.update();
    player.dead = lavas.checkIfPlayerSafe(player.y);
  } else {
    gameOverText.y = this.cameras.main.midPoint.y;
    gameOverText.visible = true;
  }
  this.cameras.main.centerOn(player.x, player.y-180);
}

function spacePressed() {
  player.moveUp();
  score += 1;
  scoreText.y -= 60;
  scoreText.text = "Score: "+score;
  lavas.setSpeed(4 + 0.2*score);
}

function restart() {
  lavas.restart(player.y);
  player.dead = false;
  gameOverText.visible = false;
  score = 0;
  lavas.setSpeed(4);
}

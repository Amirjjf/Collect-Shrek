
let game;

const gameOptions = {
    dudeGravity: 800,
    dudeSpeed: 300
}

window.onload = function() {
    let gameConfig = {
        type: Phaser.AUTO,
        //backfround: image("assets/background.png"),
        backgroundColor: "#000000",
        scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH,
            width: 800,
            height: 1000,
        },
        pixelArt: true,
        physics: {
            default: "arcade",
            arcade: {
                gravity: {
                    y: 0
                }
            }
        },
        scene: PlayGame
    }

    game = new Phaser.Game(gameConfig)
    window.focus();
}

class PlayGame extends Phaser.Scene {

    constructor() {
        super("PlayGame")
        this.score = 0;
        this.gameOver = false;
    }


    preload() {
        this.load.image("ground", "assets/platform.png")
        this.load.image("star", "assets/star.png")
        this.load.image("fire", "assets/fire.png");
        this.load.image("background", "assets/background.png");
        this.load.image("bullet", "assets/bullet.png");
        this.load.spritesheet('fireSprite', 'assets/fire2.png', { frameWidth: 72, frameHeight: 72 });
        this.load.spritesheet("dude", "assets/dude.png", {frameWidth: 32, frameHeight: 48})
    }

    create() {
        this.bg = this.add.image(game.config.width / 2, game.config.height / 2, "background").setDisplaySize(game.config.width, game.config.height);
        this.bg.alpha = 0.5; 
        this.groundGroup = this.physics.add.group({
            immovable: true,
            allowGravity: true
        })



        const maxRows = 8; // Maximum number of rows where platforms could appear
        const maxCols = 8; // Maximum number of potential columns in each row
        const maxPerRow = 3; // Maximum number of platforms in a single row
        const platformWidth = 50; 

        const verticalSpacing = game.config.height / maxRows;

       
        const horizontalSpacing = (game.config.width - platformWidth) / (maxCols - 1);


        for (let row = 0; row < maxRows; row++) {
            
            const baseY = row * verticalSpacing;
            
            let platformsInRow = 0;

           
            for (let col = 0; col < maxCols; col++) {
                if (platformsInRow >= maxPerRow) {
                    break;
                }

                const x = col * horizontalSpacing;

                if (Phaser.Math.Between(0, 1) > 0.3) {
                    this.groundGroup.create(x + platformWidth / 2, baseY, "ground");
                    
                    platformsInRow++;
                }
            }
        }
        

        this.dude = this.physics.add.sprite(game.config.width / 2, game.config.height / 2, "dude")
        this.dude.body.gravity.y = gameOptions.dudeGravity
        this.physics.add.collider(this.dude, this.groundGroup)

        this.starsGroup = this.physics.add.group({})
        this.physics.add.collider(this.starsGroup, this.groundGroup)

        this.physics.add.overlap(this.dude, this.starsGroup, this.collectStar, null, this)


        this.anims.create({
            key: 'burn',
            frames: this.anims.generateFrameNumbers('fireSprite', { start: 0, end: 4 }),
            frameRate: 10,
            repeat: -1
        });

        this.fireSpritesGroup = this.physics.add.group({});
        this.physics.add.collider(this.fireSpritesGroup, this.groundGroup);
        
        this.physics.add.overlap(this.dude, this.fireSpritesGroup, this.hitFire, null, this);


        const fireHeight = 100; 
        this.fire = this.add.image(game.config.width / 2, game.config.height - (fireHeight / 2), "fire");
        this.fire.setScale(0.1);
        const yOffset = 15;
        this.fire.setY(game.config.height - (fireHeight / 2) + yOffset);

        this.bulletsGroup = this.physics.add.group({
            defaultKey: 'bullet',
            maxSize: 1000
        });
        this.physics.add.collider(this.bulletsGroup, this.fireSpritesGroup, this.destroyFire, null, this);

        
        

        this.scoreText = this.add.text(40, 8, "0", {fontSize: "30px", fill: "#ffffff"})
        this.add.image(16, 30, "star").setScale(0.8);


        this.cursors = this.input.keyboard.createCursorKeys()
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        this.anims.create({
            key: "left",
            frames: this.anims.generateFrameNumbers("dude", {start: 0, end: 3}),
            frameRate: 10,
            repeat: -1
        })
        this.anims.create({
            key: "turn",
            frames: [{key: "dude", frame: 4}],
            frameRate: 10,
        })

        this.anims.create({
            key: "right",
            frames: this.anims.generateFrameNumbers("dude", {start: 5, end: 9}),
            frameRate: 10,
            repeat: -1
        })
        

        this.triggerTimer = this.time.addEvent({
            callback: this.addGround,
            callbackScope: this,
            delay: 700,
            loop: true
        })

        this.input.keyboard.on('keydown', this.restartGame, this);
    }

    addGround() {
        console.log("Adding new stuff!")
        this.groundGroup.create(Phaser.Math.Between(0, game.config.width), 0, "ground")
        this.groundGroup.setVelocityY(gameOptions.dudeSpeed / 6)

        if(Phaser.Math.Between(0, 1)) {
            this.starsGroup.create(Phaser.Math.Between(0, game.config.width), 0, "star")
            this.starsGroup.setVelocityY(gameOptions.dudeSpeed)

        }

        if (Phaser.Math.Between(0, 3) === 0) {
            let newFireSprite = this.fireSpritesGroup.create(Phaser.Math.Between(0, game.config.width), 0, 'fireSprite');
            if (newFireSprite) {
                newFireSprite.anims.play('burn', true);
                newFireSprite.setVelocityY(gameOptions.dudeSpeed / 2);
            }
        }
        
    }

    shootBullet() {
        let bullet = this.bulletsGroup.get(this.dude.x, this.dude.y);
        if (bullet) {
            bullet.setActive(true);
            bullet.setVisible(true);
            bullet.body.velocity.y = -300;
        }
    }

    destroyFire(bullet, fire) {
        fire.destroy();
        bullet.destroy();
    }
    
    

    collectStar(dude, start) {
        start.disableBody(true, true)
        this.score += 1
        this.scoreText.setText(this.score)
    }

    hitFire(dude, fire) {

        this.triggerTimer.remove();
        

        this.dude.setVelocity(0, 0);
        this.groundGroup.setVelocityY(0);
        this.starsGroup.setVelocityY(0);
        this.fireSpritesGroup.setVelocityY(0);
        this.score = 0;
        
        this.add.text(game.config.width / 2, game.config.height / 2, 'YOU HAVE DIED, PRESS ANY KEY TO PLAY', { fontSize: '32px', fill: '#fff' }).setOrigin(0.5);
        
        this.gameOver = true;
    }

    restartGame() {
        if(this.gameOver) {
            this.gameOver = false;
            this.scene.restart();
        }
    }

    
    update() {
        if(this.gameOver) {
            return;
        }

        if(this.cursors.left.isDown) {
            this.dude.body.velocity.x = -gameOptions.dudeSpeed
            this.dude.anims.play("left", true)
        }
        else if(this.cursors.right.isDown) {
            this.dude.body.velocity.x = gameOptions.dudeSpeed
            this.dude.anims.play("right", true)
        }
        else {
            this.dude.body.velocity.x = 0
            this.dude.anims.play("turn", true)
        }

        if(this.cursors.up.isDown && this.dude.body.touching.down) {
            this.dude.body.velocity.y = -gameOptions.dudeGravity / 1.6
        }
        if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
            this.shootBullet();
        }
        

        if(this.dude.y > game.config.height || this.dude.y < 0) {
            this.triggerTimer.remove();
            
 
            this.dude.setVelocity(0, 0);
            this.groundGroup.setVelocityY(0);
            this.starsGroup.setVelocityY(0);
            this.fireSpritesGroup.setVelocityY(0);
            this.score = 0;
      
            this.add.text(game.config.width / 2, game.config.height / 2, 'YOU HAVE DIED, PRESS ANY KEY TO PLAY', { fontSize: '32px', fill: '#fff' }).setOrigin(0.5);
            
   
            this.gameOver = true;
        }

    }

}

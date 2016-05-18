var canvas = document.getElementById("gameCanvas");
var context = canvas.getContext("2d");

var startFrameMillis = Date.now();
var endFrameMillis = Date.now();

var score = 0;

// This function will return the time in seconds since the function 
// was last called
// You should only call this function once per frame
function getDeltaTime()
{
	endFrameMillis = startFrameMillis;
	startFrameMillis = Date.now();

		// Find the delta time (dt) - the change in time since the last drawFrame
		// We need to modify the delta time to something we can use.
		// We want 1 to represent 1 second, so if the delta is in milliseconds
		// we divide it by 1000 (or multiply by 0.001). This will make our 
		// animations appear at the right speed, though we may need to use
		// some large values to get objects movement and rotation correct
	var deltaTime = (startFrameMillis - endFrameMillis) * 0.001;
	
		// validate that the delta is within range
	if(deltaTime > 1)
		deltaTime = 1;
		
	return deltaTime;
}

//-------------------- Don't modify anything above here

var SCREEN_WIDTH = canvas.width;
var SCREEN_HEIGHT = canvas.height;

function cellAtPixelCoord(layer, x,y)
{
    if(x<0 || x>SCREEN_WIDTH || y<0)
        return 1;
    if(y>SCREEN_HEIGHT)
        return 0;
    return cellAtPixelCoord(layer, p2t(x), p2t(y));    
};

function cellAtTileCoord(layer, tx, ty)
{
    if(tx<0 || tx>=MAP.tw || ty<0)
        return 1;
    if(ty>=MAP.th)
        return 0;
    return cells[layer][ty][tx];        
};

function tileToPixel(tile)
{
    return tile * TILE;
};

function pixelToTile(pixel)
{
    return Math.floor(pixel/TILE);
};

function bound(value, min, max)
{
    if(value < min)
            return min;
    if(value > max)
            return max;
    return value;            
}

var musicBackground;
var sfxFire;

var cells = [];
function initialize() {
    for(var layerIdx = 0; layerIdx < LAYER_COUNT; layerIdx++) {
        cells[layerIdx] = [];
        var idx = 0;
        for(var y = 0; y < level2.layers[layerIdx].height; y++) {
            cells[layerIdx][y] = [];
            for(var x = 0; x < level2.layers[layerIdx].width; x++) {
                if(level2.layers[layerIdx].data [idx] != 0) {
                    cells[layerIdx][y][x] = 1;
                    cells[layerIdx][y-1][x] = 1;
                    cells[layerIdx][y-1][x+1] = 1;
                    cells[layerIdx][y][x+1] = 1;
                }
                else if(cells[layerIdx][y][x] != 1) {
                    cells[layerIdx][y][x] = 0;
                }
                idx++;
            }
        }
    }
    musicBackground = new Howl(
    {
        urls: ["background.ogg"],
        loop: true,
        buffer: true,
        volume: 0.5
    } );
    musicBackground.play();
    
    sfxFire = new Howl(
           {
               urls: ["fireEffect.ogg"],
               buffer: true,
               volume: 1,
               onend: function() {
                   isSfxPlaying = false;
               }
           } );    
}

var tileset = document.createElement("img");
tileset.src = "tileset.png";

var LAYER_COUNT =3;
var LAYER_BACKGOUND = 0;
var LAYER_PLATFORMS = 1;
var LAYER_LADDERS = 1;  
var MAP = {tw:60,th:15};
var TILE = 35;
var TILESET_TILE = TILE * 2;
var TILESET_PADDING = 2;
var TILESET_SPACING = 2;
var TILESET_COUNT_X = 14;
var TILESET_COUNT_Y = 14;
var METER = TILE;
var GRAVITY = METER * 9.8 * 6;
var MAXDX = METER * 10;
var MAXDY = METER * 15;
var ACCEL = MAXDX * 2;
var FRICTION = MAXDX * 6;
var JUMP = METER * 1500;


var worldOffsetX =0;
function drawMap() 
{
    var maxTiles = Math.floor(SCREEN_WIDTH / TILE) + 2;
    var tileX = pixelToTile(player.position.x);
    var offsetX = TILE + Math.floor(player.position.x%TILE);

    startX = tileX - Math.floor(maxTiles / 2);

    if(startX < -1)
    {
        startX = 0;
        offsetX = 0;
    } 
    if(startX > MAP.tw - maxTiles)
    {
        startX = MAP.tw - maxTiles + 1;
        offsetX = TILE;
    }

    worldOffsetX = startX * TILE + offsetX;
    for (var layerIdx = 0; layerIdx < LAYER_COUNT; layerIdx++) 
    {
        var idx = 0;
        for (var y = 0; y < level2.layers[layerIdx].height; y++) 
        {
            var idx = y * level2.layers[laterIdx].width + startX;
            for (var x = 0; x < level2.layers[layerIdx].width; x++) 
            {
                if (level2.layers[layerIdx].data[idx] != 0) 
                {
                    var tileIndex = level2.layers[layerIdx].data[idx] - 1;
                    var sx = TILESET_PADDING + (tileIndex % TILESET_COUNT_X) * 
                             (TILESET_TILE + TILESET_SPACING);
                    var sy = TILESET_PADDING + (Math.floor(tileIndex / TILESET_COUNT_Y)) * 
                             (TILESET_TILE + TILESET_SPACING);
                    context.drawImage(tileset, sx, sy, TILESET_TILE, TILESET_TILE,
                             (x - startX) * TILE - offsetX, (y - 1) * TILE, TILESET_TILE, TILESET_TILE);
                }
                idx++;
            }
        }
    }
}

// some variables to calculate the Frames Per Second (FPS - this tells use
// how fast our game is running, and allows us to make the game run at a 
// constant speed)
var fps = 0;
var fpsCount = 0;
var fpsTime = 0;


// load an image to draw
var chuckNorris = document.createElement("img");
chuckNorris.src = "hero.png";

var sprite;
var player = new Player();
var keyboard = new Keyboard();

//function initialize()
//{
 //  sprite = new Sprite("ChuckNorris.png");
  //  sprite.buildAnimation(7, 8, 165, 126, 0.05,
  //              [11, 12, 13, 14, 15, 16, 17, 18]);
//}
function run()
{
	context.fillStyle = "#ccc";		
	context.fillRect(0, 0, canvas.width, canvas.height);
	
    drawMap();
        
    // score 
    context.fillStyle = "yellow";
    context.font= "32px Arial";
    varscoreText = "Score:" + score;
    context.fillText(scoreText, SCREEN_WIDTH - 170, 35);
        
	var deltaTime = getDeltaTime();
    
    //sprite.update(deltaTime);
    //sprite.draw(context, 10, 10);
    
	player.update(deltaTime);
    player.draw();
	
		
	    // update the frame counter 
	fpsTime += deltaTime;
	fpsCount++;
	if(fpsTime >= 1)
	{
		fpsTime -= 1;
		fps = fpsCount;
		fpsCount = 0;
	}		
		
	// draw the FPS
	context.fillStyle = "#f00";
	context.font="14px Arial";
	context.fillText("FPS: " + fps, 5, 20, 100);
}

initialize();

//-------------------- Don't modify anything below here


// This code will set up the framework so that the 'run' function is called 60 times per second.
// We have a some options to fall back on in case the browser doesn't support our preferred method.
(function() {
  var onEachFrame;
  if (window.requestAnimationFrame) {
    onEachFrame = function(cb) {
      var _cb = function() { cb(); window.requestAnimationFrame(_cb); }
      _cb();
    };
  } else if (window.mozRequestAnimationFrame) {
    onEachFrame = function(cb) {
      var _cb = function() { cb(); window.mozRequestAnimationFrame(_cb); }
      _cb();
    };
  } else {
    onEachFrame = function(cb) {
      setInterval(cb, 1000 / 60);
    }
  }
  
  window.onEachFrame = onEachFrame;
})();

window.onEachFrame(run);

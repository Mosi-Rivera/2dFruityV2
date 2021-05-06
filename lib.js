const LIB = {};
(function()
{
    function debounce(func, wait, immediate) {
        var timeout;
        return function() {
            var context = this, args = arguments;
            var later = function() {
                timeout = null;
                if (!immediate) func.apply(context, args);
            };
            var callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(context, args);
        };
    };
    //#region Game
    class Game
    {
        scenes;
        activeScene;
        spriteData = {};
        drawCanvas = {
            ctx: null,
            canvas: null,
            offset: {x: 0, y: 0},
            scale: 1,
            width: 0,
            height: 0,
            ratio: 0
        };
        keyboardManager;
        mouseManager;
        gamepadManager;
        updateArr = new Map();
        raf;
        lastTick;
        smoothing = false;
        constructor(configs)
        {
            this.smoothing = configs.smoothing || false;
            this.drawCanvas.canvas  = document.createElement('canvas');
            this.drawCanvas.ctx     = this.drawCanvas.canvas.getContext('2d');
            this.drawCanvas.width   = configs.width;
            this.drawCanvas.height  = configs.height;
            this.drawCanvas.ratio   = configs.width / configs.height;
            document.getElementById('game').appendChild(this.drawCanvas.canvas);
            window.addEventListener('resize',debounce(this.resize.bind(this),200));
            this.resize();
            const body = document.getElementsByTagName('body')[0];
            const html = document.getElementsByTagName('html')[0];
            body.style.padding = html.style.padding = '0px';
            body.style.margin = html.style.margin = '0px';
            body.style.overflow = 'hidden';
            this.drawCanvas.canvas.style.width = '100vw';
            this.drawCanvas.canvas.style.height = '100vh';
            if (configs.keyboard)
                this.addKeyboardManager();
            if (configs.mouse)
                this.addMouseManager();
            if (configs.gamepad)
                this.addGamepadManager();
            this.scenes             = configs.scenes;
            this.activeScene        = new (this.scenes[0])(this);
        }
        addGamepadManager()
        {
            this.gamepadManager = new GamepadManager(this);
        }
        removeGamepadManager()
        {
            this.updateArr.delete('gamepad');
            this.gamepadManager.destroy();
            this.gamepadManager = null;
        }
        addKeyboardManager()
        {
            this.keyboardManager = new KeyboardManager(this);
        }
        removeKeyboardManager()
        {
            this.updateArr.delete('keyboard');
            this.keyboardManager.destroy();
            this.keyboardManager = null;
        }
        addMouseManager()
        {
            this.mouseManager = new MouseManager(this);
        }
        removeMouseManager()
        {
            this.updateArr.delete('mouse');
            this.mouseManager.destroy();
            this.mouseManager = null;
        }
        fillRect(x,y,w,h,color = 'red')
        {
            let drawCanvas  = this.drawCanvas;
            let scale       = drawCanvas.scale;
            let ctx         = drawCanvas.ctx;
            ctx.fillStyle   = color;
            ctx.fillRect(
                drawCanvas.offset.x + scale * x,
                drawCanvas.offset.y + scale * y,
                scale * w,
                scale * h
            );
        }
        fillText(
            text,
            x,
            y,
            w,
            size,
            baseline = 'middle',
            align = 'center',
            fontFamily = 'Georgia',
            color = 'white'
        )
        {
            let drawCanvas = this.drawCanvas;
            let ctx = drawCanvas.ctx;
            let scale = drawCanvas.scale;
            let offset = drawCanvas.offset;
            ctx.fillStyle = color;
            ctx.font = (size * scale) + 'px ' + fontFamily;
            ctx.textBaseline = baseline;
            ctx.textAlign = align;
            ctx.fillText(
                text,
                offset.x + scale * x,
                offset.y + scale * y,
                scale * w
            );
        }
        drawSpriteSection(key,x,y,sx,sy,sw,sh,flip)
        {
            let drawCanvas = this.drawCanvas;
            let data = this.spriteData[key];
            let scale = drawCanvas.scale;
            if (flip)
            {
                let ctx = drawCanvas.ctx;
                ctx.save();
                ctx.scale(-1,1);
                ctx.drawImage(
                    data.img,
                    sx,
                    sy,
                    sw,
                    sh,
                    (drawCanvas.offset.x + scale * (x + data.left + sw)) * -1,
                    drawCanvas.offset.y + scale * (y + data.top),
                    sw * scale,
                    sh * scale
                );
                ctx.restore();
            }
            else
                drawCanvas.ctx.drawImage(
                    data.img,
                    sx,
                    sy,
                    sw,
                    sh,
                    drawCanvas.offset.x + scale * (x + data.left),
                    drawCanvas.offset.y + scale * (y + data.top),
                    sw * scale,
                    sh * scale
                );
        }
        drawSprite(key,x,y,flip)
        {
            let drawCanvas = this.drawCanvas;
            let data = this.spriteData[key];
            let scale = drawCanvas.scale;
            if (flip)
            {
                let ctx = drawCanvas.ctx;
                ctx.save();
                ctx.scale(-1,1);
                ctx.drawImage(
                    data.img,
                    (drawCanvas.offset.x + scale * (x + data.left + data.width)) * -1,
                    drawCanvas.offset.y + scale * (y + data.top),
                    data.width * scale,
                    data.height * scale
                );
                ctx.restore();
            }
            else
                drawCanvas.ctx.drawImage(
                    data.img,
                    drawCanvas.offset.x + scale * (x + data.left),
                    drawCanvas.offset.y + scale * (y + data.top),
                    data.width * scale,
                    data.height * scale
                );
        }
        setScene(i,parameters = null)
        {
            this.activeScene.dispose();
            this.activeScene = new (this.scenes[i])(this,parameters);
        }
        start()
        {
            this.lastTick = Date.now();
            this.raf = requestAnimationFrame(() => this.update());
        }
        pause()
        {
            cancelAnimationFrame(this.raf);
            this.raf = null;
        }
        update()
        {
            let now = Date.now();
            let delta = (now - this.lastTick) / 1000;
            this.lastTick = now;
            let drawCanvas = this.drawCanvas;
            let canvas = drawCanvas.canvas;
            let offset = drawCanvas.offset;
            let ctx = drawCanvas.ctx;
            ctx.clearRect(
                offset.x,
                offset.y,
                canvas.width - offset.x * 2,
                canvas.height - offset.y * 2
            );
            this.activeScene.update(delta);
            this.activeScene.render();
            this.updateArr.forEach(func => func(delta));
            ctx.fillStyle = 'black';
            ctx.fillRect(
                0,
                0,
                offset.x,
                canvas.height
            );
            ctx.fillRect(
                offset.x,
                0,
                canvas.width - offset.x * 2,
                offset.y
            );
            ctx.fillRect(
                canvas.width - offset.x,
                0,
                offset.x,
                canvas.height
            );
            ctx.fillRect(
                offset.x,
                canvas.height - offset.y,
                canvas.width - offset.x * 2,
                offset.y
            );
            if (this.raf)
                this.raf = requestAnimationFrame(() => this.update());
        }
        resize()
        {
            const w = window.innerWidth;
            const h = window.innerHeight;
            const drawCanvas = this.drawCanvas;
            drawCanvas.canvas.width = w;
            drawCanvas.canvas.height = h;
            const ratio = w / h;

            if (ratio < drawCanvas.ratio)
                drawCanvas.scale    = Math.floor(w / drawCanvas.width);
            else if (ratio > drawCanvas.ratio)
                drawCanvas.scale    = Math.floor(h / drawCanvas.height);
            else
                drawCanvas.scale    = 1;

            drawCanvas.offset.x     = Math.floor((w - (drawCanvas.width * drawCanvas.scale)) / 2);
            drawCanvas.offset.y     = Math.floor((h - (drawCanvas.height * drawCanvas.scale)) / 2);

            this.drawCanvas.ctx.imageSmoothingEnabled = false;
        }
        loadSprite(data)
        {
            /*
            key:    String
            src:    String
            width:  Number
            height: Number
            */

            return new Promise((resolve, reject) => {
                let img = new Image();
                img.src = data.src;
                
                img.onload = () => {
                    this.spriteData[data.key] = {
                        img,
                        width: data.width,
                        height: data.height,
                        key: data.key,
                        left: -Math.floor(data.width * data.ox),
                        top: -Math.floor(data.height * data.oy)
                    }
                    return resolve();
                }

                img.onerror = err => reject(err);
            });
        }
    }
    //#endregion

    //#region Scene
    class Scene
    {
        game;
        loadArr = [];
        constructor(game)
        {
            game.pause();
            this.game = game;
            this.load(game);
            Promise.all(this.loadArr)
            .then(() => this.startGame())
            .catch(err => console.log(err));
        }
        dispose(){}
        start(){}
        startGame()
        {
            this.start();
            this.game.start(this.game);
        }
        loadImage(data)
        {
            this.loadArr.push(this.game.loadSprite(data));
        }
        load(game){};
        start(game){};
        update(dt){};
        render(){};
    }
    class DemoScene extends Scene
    {
        width;
        height;
        bouncySquare;
        constructor(game)
        {
            super(game);
            this.bouncySquare = new Hitbox(50,50,0,0);
            this.bouncySquare.x = 100;
            this.bouncySquare.y = 100;
            this.bouncySquare.speedX = 120;
            this.bouncySquare.speedY = 80;
            this.width = game.drawCanvas.width;
            this.height = game.drawCanvas.height;
        }
        update(dt)
        {
            let bouncySquare = this.bouncySquare;
            bouncySquare.x += bouncySquare.speedX * dt;
            bouncySquare.y += bouncySquare.speedY * dt;

            if (bouncySquare.x + bouncySquare.right > this.width)
            {
                bouncySquare.speedX *= -1;
                bouncySquare.x = this.width - bouncySquare.right;
            }
            else if (bouncySquare.x + bouncySquare.left < 0)
            {
                bouncySquare.speedX *= -1;
                bouncySquare.x = -bouncySquare.left;
            }

            if (bouncySquare.y + bouncySquare.bottom > this.height)
            {
                bouncySquare.speedY *= -1;
                bouncySquare.y = this.height - bouncySquare.bottom;
            }
            else if (bouncySquare.y + bouncySquare.top < 0)
            {
                bouncySquare.speedY *= -1;
                bouncySquare.y = -bouncySquare.top;
            }
        }

        render()
        {
            let bouncySquare = this.bouncySquare;
            this.game.fillRect(
                bouncySquare.x + bouncySquare.left,
                bouncySquare.y + bouncySquare.top,
                bouncySquare.w,
                bouncySquare.h,
                'blue'
            );
        }
    }
    //#endregion

    //#region keyboard
    class Key
    {
        isDown = false;
        down = false;
        up = false;
        update(b)
        {
            if (!this.isDown && b)
                this.down = true;
            else if (this.isDown && !b)
                this.up = true;
            this.isDown = b;
        }
        reset()
        {
            this.down = false;
            this.up = false;
        }
    }
    class KeyboardManager
    {
        keys = new Map();
        game;
        constructor(game)
        {
            document.addEventListener('keydown', e => this.keydown(e.code));
            document.addEventListener('keyup',e => this.keyup(e.code));
            this.game = game;
            game.updateArr.set('keyboard',() => this.update());
        }
        reset()
        {
            this.keys.clear();
        }
        getPressed(keyCode)
        {
            return this.keys.get(keyCode)?.isDown;
        }
        getUp(keyCode)
        {
            return this.keys.get(keyCode)?.up;
        }
        getDown(keyCode)
        {
            return this.keys.get(keyCode)?.down;
        }
        addKey(keyCode)
        {
            this.keys.set(keyCode,new Key());
        }
        keyup(keyCode)
        {
            this.keys.get(keyCode)?.update(false);
        }
        keydown(keyCode)
        {
            this.keys.get(keyCode)?.update(true);
        }
        update()
        {
            this.keys.forEach(key => key.reset());
        }
    }
    //#endregion

    //#region Gamepad
    class GamepadData
    {
        buttons = new Map();
        axes = [];
        constructor(gamepad)
        {
            for (let i = gamepad.buttons.length; i--;)
                this.buttons.set(i,new Key());
            this.axes.length = gamepad.axes.length;
        }
        update(gamepad)
        {
            let axes = gamepad.axes;
            this.buttons.forEach((button,i) => button.update(gamepad.buttons[i].pressed));
            for (let i = axes.length; i--;)
                this.axes[i] = axes[i];
        }
    }
    class GamepadEvents
    {
        disconnect = new Map();
        connect = new Map();
        add_connect(func)
        {
            let i = 0;
            while (true)
            {
                if (!this.connect.has(i))
                {
                    this.connect.set(i,func);
                    return i;
                }
                i++;
            }
        }
        remove_connect(index)
        {
            this.connect.delete(index);
        }
        add_disconnect(func)
        {
            let i = 0;
            while (true)
            {
                if (!this.disconnect.has(i))
                {
                    this.disconnect.set(i,func);
                    return i;
                }
                i++;
            }
        }
        remove_disconnect(index)
        {
            this.disconnect.delete(index);
        }
    }
    class GamepadManager
    {
        gamepads = new Map();
        events = new GamepadEvents();
        constructor(game)
        {
            document.addEventListener("gamepadconnected", e => this.handler(e,true),false);
            document.addEventListener("gamepaddisconnect", e => this.handler(e,false),false);
            game.updateArr.set('gamepad',() => this.update());
        }
        destroy()
        {
            document.removeEventListener("gamepadconnected", e => this.handler(e,true),false);
            document.removeEventListener("gamepaddisconnect", e => this.handler(e,false),false);
        }
        handler(event,connecting)
        {
            let gamepad = event.gamepad;
            if (connecting)
            {
                let gamepad_data = this.addGamepad(gamepad);
                this.events.connect.forEach(func => func(gamepad_data));
            }
            else
            {
                let index = gamepad.index;
                this.gamepads.delete(index);
                this.events.disconnect.forEach(func => func(index));
            }
        }
        addGamepad(gamepad)
        {
            let gamepadData = new GamepadData(gamepad);
            this.gamepads.set(gamepad.index,gamepadData);
            return gamepadData;
        }
        update()
        {
            let gamepads = navigator.getGamepads ? navigator.getGamepads() : (navigator.webkitGetGamepads ? navigator.webitGetGamepads : []);
            for (let i = gamepads.length; i--;)
            {
                let gamepad = gamepads[i];
                if (gamepad)
                {
                    if (this.gamepads.has(i))
                        this.gamepads.get(i).update(gamepad);
                    else
                    {
                        this.addGamepad(gamepad);
                        let gamepadData = this.gamepads.get(gamepad.index);
                        this.events.connect.forEach((func,i) => func(gamepadData));
                    }
                }
            }
        }
    }
    //#endregion 

    //#region Hitbox
    class Hitbox
    {
        w;
        h;
        left;
        right;
        top;
        bottom;
        constructor(w,h,ox = 0.5, oy = 1)
        {
            this.w = w;
            this.h = h;
            this.left = -Math.floor(w * ox);
            this.right = w + this.left - 1;
            this.top = -Math.floor(h * oy);
            this.bottom = h + this.top - 1;
        }
    }
    //#endregion

    //#region Actor
    class Actor
    {
        position = { x: 0, y: 0 };
        scene = null;
        constructor(scene,x,y,w,h)
        {
            this.scene = scene;
            this.position.x = x;
            this.position.y = y;
            this.speedX = 0;
            this.speedY = 0;
            this.xRemainder = 0;
            this.yRemainder = 0;
            this.stateManager = new StateManager();
            this.animationManager = new AnimationManager();
            this.hitbox = new Hitbox(w,h);
        }
        update(){};
        render(){};
        moveX(amount,onCollision = null)
        {
            let scene = this.scene;
            let hitbox = this.hitbox;
            let position = this.position;
            this.xRemainder += amount;
            let move = Math.round(this.xRemainder);

            if (move != 0)
            {
                this.xRemainder -= move;
                let sign = Math.sign(move);
                while (move != 0)
                {
                    let x = amount > 0 ? position.x + hitbox.right : position.x + hitbox.left;
                    if (!(
                        scene.collideAt(x + sign,position.y + hitbox.bottom) ||
                        scene.collideAt(x + sign,position.y + hitbox.top)
                    ))
                    {
                        position.x += sign;
                        move -= sign;
                    }
                    else
                    {
                        if (onCollision != null)
                            onCollision();
                        break;
                    }
                }
            }
        }
        moveY(amount,onCollision = null)
        {
            let scene = this.scene;
            let hitbox = this.hitbox;
            let position = this.position;
            this.yRemainder += amount;
            let move = Math.round(this.yRemainder);

            if (move != 0)
            {
                this.yRemainder -= move;
                let sign = Math.sign(move);
                while (move != 0)
                {
                    let y = amount > 0 ? position.y + hitbox.bottom : position.y + hitbox.top;
                    if (!(
                        scene.collideAt(position.x + hitbox.right,y + sign) ||
                        scene.collideAt(position.x + hitbox.left,y + sign)
                    ))
                    {
                        position.y += sign;
                        move -= sign;
                    }
                    else
                    {
                        if (onCollision != null)
                            onCollision();
                        break;
                    }
                }
            }
        }
    }
    //#endregion

    //#region StateManager
    class State
    {
        update = null;
        start = null;
        end = null;
        coroutine = null;
        coroutine_instance = null;
        coroutine_timer = 0;
        constructor(update,coroutine,start,end)
        {
            this.update = update;
            this.coroutine = coroutine;
            this.start = start;
            this.end = end;
        }
    }
    class StateManager
    {
        index = null;
        states = {};
        update(delta)
        {
            let state = this.states[this.index];
            if (state.coroutine_instance)
            {
                state.coroutine_timer -= delta;
                if (state.coroutine_timer <= 0)
                    state.coroutine_timer = state.coroutine_instance.next().value || 0;
            }
            if (state.update)
                state.update(delta);
        }
        set(key,parameter)
        {
            let state = this.states;
            let active = state[this.index];
            if (active.end) active.end();
            this.index = key;
            active = state[this.index];
            if (active.start) active.start();
            if (active.coroutine)
            {
                active.coroutine_timer = 0;
                active.coroutine_instance = active.coroutine(parameter);
            }
        }
        add(
            key,
            update = null,
            coroutine = null,
            start = null,
            end = null,
            default_value = false
        )
        {
            if (this.states[key])
                throw new Error('Key already exists in state manager.');
            this.states[key] = new State(update,coroutine,start,end);
            if (default_value) 
            {
                this.index = key;
                let state = this.states[this.index];
                state.start?.call(state);
                if (state.coroutine)
                {
                    state.coroutine_timer = 0;
                    state.coroutine_instance = active.coroutine();
                }
            }
        }
        remove(key)
        {
            delete this.states[key];
        }
    }
    //#endregion
    
    //#region Clickable
    class Clickable extends Hitbox
    {
        x;
        y;
        constructor(x,y,w,h,ox,oy)
        {
            super(w,h,ox,oy);
            this.x = x;
            this.y = y;
        }
        isMouseOver(x,y)
        {
            return !(
                x < this.x + this.left ||
                x > this.x + this.right ||
                y < this.y + this.top ||
                y > this.y + this.bottom
            );
        }
    }
    class Button extends Clickable
    {
        text;
        game;
        size;
        constructor(scene,text,x,y,w,h,size = 20, ox = 0.5, oy = 0.5,imgKey = null)
        {
            super(x,y,w,h,ox,oy);
            this.game = scene.game;
            this.text = text;
            this.size = size;
            this.render = (
                imgKey ? 
                () => {} :
                () => {
                    let mouse = this.game.mouseManager;
                    this.game.fillRect(
                        this.x + this.left,
                        this.y + this.top,
                        this.w,
                        this.h,
                        this.isMouseOver(mouse.x,mouse.y) ? 'purple' : 'orange'
                    );
                    this.game.fillText(
                        this.text,
                        this.x,
                        this.y,
                        this.w,
                        this.size,
                    );
                }
            )
        }
    }
    //#endregion 
    
    //#region MouseManager
    class MouseManager
    {
        x = 0;
        y = 0;
        isDown = false;
        game;
        drawCanvas;
        updateArrIndex;
        constructor(game)
        {
            this.drawCanvas = game.drawCanvas;
            this.game = game;
            game.drawCanvas.canvas.addEventListener('mousemove',this.mouseMove.bind(this));
            game.drawCanvas.canvas.addEventListener('mousedown',this.mouseDown.bind(this));
            game.updateArr.set('mouse',() => this.update());
        }
        destroy()
        {
            this.game.drawCanvas.canvas.removeEventListener('mousemove',this.mouseMove.bind(this));
            this.game.drawCanvas.canvas.removeEventListener('mousedown',this.mouseDown.bind(this));
        }
        mouseMove(e)
        {
            let drawCanvas = this.game.drawCanvas;
            let offset = drawCanvas.offset;
            let scale = drawCanvas.scale;
            this.x = (e.offsetX - offset.x) / scale;
            this.y = (e.offsetY - offset.y) / scale;
        }
        mouseDown()
        {
            this.isDown = true;
        }
        update()
        {
            this.isDown = false;
        }
    }
    //#endregion
    
    //#region TileMap
    class TileMap
    {
        map;
        mapWidth;
        mapHeight;
        tileWidth;
        tileHeight;
        mapWidthPixels;
        mapHeightPixels;
        collidable;
        constructor(scene,mapConfig,collidable)
        {
            this.collidable = collidable;
            this.map = mapConfig.map;
            this.mapWidth = mapConfig.mapWidth;
            this.mapHeight = mapConfig.mapHeight;
            this.tileWidth = mapConfig.tileWidth;
            this.tileHeight = mapConfig.tileHeight;
            this.mapWidthPixels = this.tileWidth * this.mapWidth;
            this.mapHeightPixels = this.tileHeight * this.mapHeight;
        }
        collideAt(x,y)
        {
            return this.collidable.includes(this.getTile(x,y)[0]);
        }
        getTile(x,y)
        {
            x = Math.floor(x / this.tileWidth);
            y = Math.floor(y / this.tileHeight);
            return [this.map[y * this.mapWidth + x],x,y];
        }
        setTile(id,x,y)
        {
            x /= this.tileWidth;
            y /= this.tileHeight;
            this.map[y * this.mapWidth + x] = id;
        }
    }
    //#endregion

    //#region Animation
    class Animation
    {
        onFinish = null;
        frames;
        index = 0;
        fps;
        frameCount;
        timer = 0;
        loop = false;
        constructor(frameKeys,fps,loop)
        {
            this.frames = frameKeys;
            this.frameCount = frameKeys.length;
            this.fps = 1 / fps;
            this.timer = this.fps;
            this.loop = loop;
        }
        reset()
        {
            this.index = 0;
            this.timer = this.fps;
        }
        update(dt)
        {
            this.timer -= dt;
            if (this.timer <= 0)
            {
                this.index++;
                if (this.index >= this.frameCount)
                {
                    if (this.onFinish)
                        this.onFinish();
                    this.index = 0;
                }
                this.timer = this.fps;
            }
        }
        getKey()
        {
            return this.frames[this.index];
        }
    }
    class AnimationManager
    {
        animations = {};
        active = null;
        constructor()
        {

        }
        add(key,anim,defaultAnim = false)
        {
            this.animations[key] = anim;
            if (defaultAnim)
                this.active = key;
        }
        set(key)
        {
            this.active = key;
            if (this.active != key)
                this.animations[key].reset();
        }
        update(dt)
        {
            this.animations[this.active].update(dt);
        }
        getKey()
        {
            return this.animations[this.active].getKey();
        }
    }
    //#endregion
    const appr = (val,target,amount) => (
        val > target ? Math.max(val - amount, target) : Math.min(val + amount,target)
    );
    const actorCollision = (a1,a2) => {
        let hb1 = a1.hitbox;
        let pos1 = a1.position;
        let hb2 = a2.hitbox;
        let pos2 = a2.position;
        return !(
            pos1.x + hb1.right < pos2.x + hb2.left ||
            pos1.x + hb1.left > pos2.x + hb2.right ||
            pos1.y + hb1.bottom < pos2.y + hb2.top ||
            pos1.y + hb1.top > pos2.y + hb2.bottom
        ); 
    }
    const generateKeys = (key,len) => {
        let result = [];
        for (let i = 0; i < len; i++)
            result.push(key + (i > 9 ? i : '0' + i));
        return result;
    }
    LIB.misc = {generateKeys};
    LIB.math = { appr, actorCollision };
    LIB.debounce = debounce;
    LIB.GamepadManager = GamepadManager;
    LIB.TileMap = TileMap;
    LIB.DemoScene = DemoScene;
    LIB.MouseManager = MouseManager;
    LIB.Button = Button;
    LIB.Clickable = Clickable;
    LIB.Actor = Actor;
    LIB.Hitbox = Hitbox;
    LIB.Game = Game;
    LIB.Scene = Scene;
    LIB.StateManager = StateManager;
    LIB.Animation = Animation;
    LIB.AnimationManager = AnimationManager;
}())